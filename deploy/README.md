# Despliegue de K SMKSHOP

La tienda corre en Netlify, la API en un VPS dedicado y el dominio `ksmkshop.com` las une.

| Pieza | Dónde | Notas |
| --- | --- | --- |
| Tienda (build de React de `app/frontend`) | Netlify | Se construye en cada push a `main`; ver `netlify.toml` |
| Gateway, cinco servicios FastAPI, Postgres y respaldos | VPS dedicado con Docker Compose detrás de Caddy | `docker-compose.yml` + `docker-compose.prod.yml` + `docker-compose.caddy.yml` |
| DNS | Donde compres el dominio | Raíz y `www` apuntan a Netlify; `api` y `storefront` al VPS |

## Cómo se conectan

```
navegador --https--> ksmkshop.com (Netlify, SPA de React)
                        |
                        | /api/*  (proxy 200 de Netlify: mismo origen para el navegador)
                        v
                  api.ksmkshop.com (Caddy, TLS)  -->  gateway (Laravel)  -->  business / catalog / inventory / orders / notifications
                                                                                            |
                                                                                        PostgreSQL
```

Solo Caddy escucha en la interfaz pública del VPS (puertos 80 y 443).
Postgres, el gateway y los microservicios quedan en la red interna de Docker.
El servidor es exclusivo de K SMKSHOP; ningún otro proyecto lo comparte.

## Guía rápida: VPS nuevo

### 1. Contratar el servidor

Con 2 vCPU, 4 GB de RAM y 40 GB de disco o más alcanza. Imagen: **Ubuntu 24.04**.

| Proveedor | Plan | Notas |
| --- | --- | --- |
| Hetzner Cloud | CPX22 (2 vCPU, 4 GB, 80 GB) en Ashburn o Hillsboro (EE. UU.), las ubicaciones más cercanas a Colombia. El CX23 (2 vCPU, 4 GB, 40 GB) es más barato, pero solo existe en Alemania y Finlandia (más latencia) y a veces no está disponible | Deja marcada la IPv4 pública |
| DigitalOcean | Droplet Basic, Regular, 2 vCPU / 4 GB / 80 GB | Región NYC o Atlanta |

Los precios cambiaron varias veces en 2026; revísalos en la página del proveedor antes de contratar.
Activa los respaldos del proveedor si el presupuesto lo permite: protegen también contra perder el servidor completo.

Al crearlo, agrega tu llave SSH en vez de una contraseña. Si no tienes una, créala en tu PC (Git Bash o PowerShell):

```bash
ssh-keygen -t ed25519 -C "pabloandresmorenohidalgo@gmail.com"
```

Copia el contenido de `~/.ssh/id_ed25519.pub` en el campo "SSH key" del proveedor.
Cuando el servidor esté listo, anota su IPv4 y comprueba que entras:

```bash
ssh root@<ip-del-vps>
```

### 2. Registros DNS de ksmkshop.com

En el panel DNS de donde compres el dominio (Porkbun, Namecheap, Cloudflare...):

| Tipo | Nombre | Valor | Para qué |
| --- | --- | --- | --- |
| A | `api` | IPv4 del VPS | La API; Caddy saca el certificado HTTPS |
| A | `storefront` | IPv4 del VPS | Copia de la tienda servida desde el VPS, por si Netlify falla |
| A (o ALIAS) | `@` (raíz) | `75.2.60.5` (o ALIAS a `apex-loadbalancer.netlify.com`) | La tienda en Netlify |
| CNAME | `www` | `<tu-sitio>.netlify.app` | La tienda en Netlify |

En Netlify: Site configuration > Domain management > Add a domain > `ksmkshop.com`. Netlify confirma los valores de la raíz y de `www` y emite su certificado.

Los registros `api` y `storefront` deben resolver **antes** del primer despliegue: Caddy no consigue certificados sin ellos, y Let's Encrypt limita los reintentos. Compruébalo con:

```bash
nslookup api.ksmkshop.com
```

### 3. Desplegar la API

Desde una copia de este repositorio en tu PC (en Windows, con Git Bash):

```bash
VPS_HOST=<ip-del-vps> ACME_EMAIL=pabloandresmorenohidalgo@gmail.com ADMIN_EMAIL=pabloandresmorenohidalgo@gmail.com bash deploy/deploy-vps.sh
```

El script:

1. Comprueba que `api.ksmkshop.com` apunta al VPS.
2. Prepara el servidor: Docker, 2 GB de swap, firewall (solo SSH, 80 y 443), límite de logs y actualizaciones de seguridad automáticas.
3. Clona `main` en `/opt/ksmkshop`.
4. Genera en el servidor todos los secretos (`/opt/ksmkshop/.env`, permisos 600), incluida una contraseña aleatoria para el administrador.
5. Levanta el stack con los respaldos diarios y espera a que `https://api.ksmkshop.com/api/v1/health` responda.

Se puede volver a correr sin miedo: actualiza el código y conserva los secretos existentes.
La primera vez tarda unos minutos porque construye las imágenes.

### 4. Primer ingreso

Lee la contraseña generada del administrador:

```bash
ssh root@<ip-del-vps> 'grep ADMIN_ /opt/ksmkshop/.env'
```

Entra en `https://ksmkshop.com/admin` y cámbiala en **Mi cuenta**.
Para crear la cuenta de otra persona (ver "Más administradores" en el README principal):

```bash
ssh root@<ip-del-vps> 'cd /opt/ksmkshop && docker compose exec gateway php artisan admin:create correo@ejemplo.com --name="Nombre"'
```

### 5. La tienda

Netlify construye `app/frontend` sola en cada push a `main` (configuración en `netlify.toml`). No necesita variables de entorno.
Despliega la API antes de publicar cambios de la tienda que dependan de rutas nuevas; si no, la tienda carga pero sus llamadas a `/api` fallan.

## Actualizar la API

```bash
ssh root@<ip-del-vps> 'cd /opt/ksmkshop && git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d --build'
```

O vuelve a correr `deploy/deploy-vps.sh`, que hace lo mismo y además revisa el servidor.

## Respaldos

El servicio `backup` de `docker-compose.prod.yml` (contenedor `vape_backup`) respalda todas las bases una vez al día, después de las 03:00 hora de Colombia.
Cada día queda en una carpeta de `/opt/ksmkshop/backups/` con un archivo `pg_dump` por base (formato custom), y solo se conservan los 7 días más recientes.
El script es `deploy/backup/pg-backup.sh`. Si un respaldo falla, descarta el día a medias y lo reintenta cada 10 minutos.

Ver los últimos respaldos y el log:

```bash
ssh root@<ip-del-vps> 'ls -l /opt/ksmkshop/backups/ && docker logs --tail 5 vape_backup'
```

Hacer un respaldo extra ahora mismo (por ejemplo, antes de actualizar):

```bash
ssh root@<ip-del-vps> 'docker exec vape_backup sh /usr/local/bin/pg-backup.sh once'
```

Los respaldos viven en el mismo servidor, así que no sobreviven si se pierde. Cópialos a tu PC de vez en cuando, o activa los respaldos del proveedor:

```bash
scp -r root@<ip-del-vps>:/opt/ksmkshop/backups ./ksmkshop-backups
```

### Restaurar

En el servidor, desde `/opt/ksmkshop`. Sin argumentos, lista los días disponibles:

```bash
bash deploy/backup/restore.sh
```

Restaurar todas las bases de un día:

```bash
bash deploy/backup/restore.sh 2026-10-14
```

Restaurar solo una base:

```bash
bash deploy/backup/restore.sh 2026-10-14 vape_orders
```

Qué guarda cada base: `vape_gateway` las cuentas de administrador, `vape_orders` los pedidos y carritos, `vape_catalog` los productos, `vape_inventory` el stock, `vape_business` el perfil de la tienda y los mensajes, `vape_notifications` el registro de SMS.

El script pide escribir `RESTAURAR`, detiene el gateway y los servicios, reemplaza el contenido actual por el del respaldo y los vuelve a arrancar, incluso si la restauración falla a mitad de camino.
Se pierde todo lo que se escribió después de ese respaldo, así que haz uno nuevo antes si quizá quieras volver atrás.

Para restaurar en un servidor nuevo, copia la carpeta del día a `/opt/ksmkshop/backups/` después del primer despliegue y corre el mismo comando.

## Volver atrás

- Tienda: en Netlify, Deploys > elige un despliegue anterior > Publish deploy.
- API: en el VPS, `git checkout <commit-anterior>` y corre el comando de actualización.

## Variables de entorno

Ver `deploy/env.example` para cada variable y su propósito.
