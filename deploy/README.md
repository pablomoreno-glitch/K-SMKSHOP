# Deploying la tienda de vapers

The storefront runs on Netlify, the API runs on one VPS, and the domain `ksmkshop.com` ties them together.

| Piece | Where | Notes |
| --- | --- | --- |
| Storefront (React build of `app/frontend`) | Netlify | Built on every push to the production branch; see `netlify.toml` |
| Gateway, six FastAPI services, Postgres | Dedicated VPS with Docker Compose behind Caddy | `docker-compose.yml` + `docker-compose.prod.yml` + `docker-compose.caddy.yml` |
| DNS | Porkbun | Apex and `www` already point at Netlify; `api` must point at the VPS |

## How the pieces talk

```
browser --https--> ksmkshop.com (Netlify CDN, React SPA)
                        |
                        | /api/*  (Netlify 200 proxy, same origin for the browser)
                        v
                  api.ksmkshop.com (Caddy, TLS)  -->  gateway (Laravel)  -->  business / catalog / inventory / orders
                                                                                            |
                                                                                        PostgreSQL
```

Only Caddy listens on the public interface of the VPS.
Postgres, the gateway and every microservice stay on the internal Docker network.

The API runs on a server dedicated to K SMKSHOP; no other project shares it.
The only production stack is `docker-compose.yml` + `docker-compose.prod.yml` + `docker-compose.caddy.yml`, started by `deploy/deploy-vps.sh`.

## 1. Get a VPS

Any 2 vCPU / 4 GB Ubuntu 22.04 or 24.04 box works (Hetzner CX22, DigitalOcean, Vultr, Linode).
Make sure you can `ssh root@<ip>`.

## 2. Point `api` at it

At Porkbun, `ksmkshop.com` -> DNS, add:

| Type | Host | Answer |
| --- | --- | --- |
| A | `api` | the VPS IPv4 |

Keep the existing apex `ALIAS` and `www` `CNAME` records that point at Netlify.
The record must resolve before the first start, or Caddy cannot get a certificate.

## 3. Deploy the API

From a checkout of this repository:

```bash
VPS_HOST=<vps-ip> ACME_EMAIL=<you@example.com> \
BUSINESS_WHATSAPP=57XXXXXXXXXX BRANCH=main \
  bash deploy/deploy-vps.sh
```

The script checks DNS, provisions the host (Docker, swap, firewall, unattended upgrades), clones the branch, generates every secret on the server, starts the stack and waits until `https://api.ksmkshop.com/api/v1/health` answers.
It is idempotent: re-running it updates the code and keeps the existing secrets.

Read the generated admin password with:

```bash
ssh root@<vps-ip> 'grep ADMIN_ /opt/ksmkshop/.env'
```

Then sign in at `https://ksmkshop.com/admin` and change it.

## 4. Deploy the storefront

Netlify builds `app/frontend` automatically when the production branch is pushed (settings live in `netlify.toml`).
No environment variables are needed in Netlify.

Deploy the API (step 3) before merging `dev` into the production branch, otherwise the new storefront loads but its `/api` calls fail.

## Updating

```bash
ssh root@<vps-ip> 'cd /opt/ksmkshop && git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d --build'
```

## Backups

The `backup` service of `docker-compose.prod.yml` (container `vape_backup`) dumps every database once a day after 03:00 Colombia time.
Each day gets a folder in `/opt/ksmkshop/backups/` with one `pg_dump` file per database (custom format), and only the newest 7 days are kept.
The script is `deploy/backup/pg-backup.sh`. If a dump fails, the half-written day is discarded and it retries every 10 minutes.

Check the latest backups and the log:

```bash
ssh root@<vps-ip> 'ls -l /opt/ksmkshop/backups/ && docker logs --tail 5 vape_backup'
```

Make an extra backup right now (for example before an update):

```bash
ssh root@<vps-ip> 'docker exec vape_backup sh /usr/local/bin/pg-backup.sh once'
```

The backups live on the same server, so they do not survive losing it.
Copy them to your computer from time to time, or enable the provider's server backups:

```bash
scp -r root@<vps-ip>:/opt/ksmkshop/backups ./ksmkshop-backups
```

### Restoring

On the server, from `/opt/ksmkshop`:

```bash
bash deploy/backup/restore.sh
```

Without arguments it lists the available days. To restore:

```bash
bash deploy/backup/restore.sh 2026-10-14
```

```bash
bash deploy/backup/restore.sh 2026-10-14 vape_orders
```

The first restores every database from that day; the second only one (`vape_gateway` holds the admin accounts, `vape_orders` the orders and carts, `vape_catalog` the products, `vape_inventory` the stock, `vape_business` the store profile and messages, `vape_notifications` the SMS log).
It asks you to type `RESTAURAR`, stops the gateway and the services, replaces the current contents with the backup and starts them again, even if the restore fails halfway.
Anything written after that backup is lost, so make a fresh backup first if you may want to come back.

To restore on a new server, copy the day's folder into `/opt/ksmkshop/backups/` after the first deploy and run the same command.

## Rollback

- Storefront: in Netlify, publish a previous deploy, or set the build to `publish = "public"` with no base or command to serve the legacy static site.
- API: `git checkout <previous-commit>` on the VPS and run the update command.

## Environment variables

See `deploy/env.example` for every variable and its purpose.
