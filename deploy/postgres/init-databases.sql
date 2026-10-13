-- One database per service on a single Postgres instance (see design decision 2).
-- Runs once, when the data volume is created.
CREATE DATABASE vape_gateway;
CREATE DATABASE vape_business;
CREATE DATABASE vape_catalog;
CREATE DATABASE vape_inventory;
CREATE DATABASE vape_orders;
CREATE DATABASE vape_notifications;
