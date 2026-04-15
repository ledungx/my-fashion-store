# Elessi Fashion Store

A modern, high-performance e-commerce platform built with Next.js (App Router), Prisma (PostgreSQL), and Typesense (Search Engine).

This README outlines the steps required to initialize the local infrastructure, run the data ingestion pipelines, and start the frontend web application and admin panel.

## 1. Prerequisites & Infrastructure
The application relies on PostgreSQL natively natively running or via Docker, and Typesense for rapid faceted searching.

Start the required containers:
```bash
docker-compose up -d
```
*(Verify they are running using `docker ps`)*

Ensure your `.env` file contains your connection strings:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/my-fashion-store"
TYPESENSE_API_KEY="your-api-key"
```

## 2. Setup Database Schema
Execute Prisma to push the schema and synchronize your database tables:
```bash
npx prisma generate
npx prisma db push
```

## 3. Seed Menus
Run the seed script to create the default Header and Footer navigation layout (including mega menus) for the store:
```bash
node scripts/seed-menus.js
```

## 4. Run the Ingestion Pipeline
The current data strategy pulls comprehensive active product data (including "Style" and "Color" variants) via Shopify JSON ingestion. 

### Automated Full Pipeline
To clear out existing data, fetch fresh products, load them into Postgres, and sync everything to Typesense seamlessly, run:
```bash
npx tsx scripts/re-ingest-full.ts
```

### Manual Individual Steps
Alternatively, you can run the workers manually in order:

**Ingest Products:**
```bash
npx tsx scripts/ingest-shopify.ts
```

**Sync to Typesense:**
*(Run this after ingestion so the search engine contains the new catalog)*
```bash
node workers/syncTypesense.js
```

**Generate Sitemaps:**
*(For SEO. Re-run after adding new products or categories)*
```bash
node scripts/generateSitemaps.js
```

## 5. Launch Application
Start the Next.js development server to serve the frontend store, search APIs, and the Admin portal.
```bash
npm run dev
# OR 
npx next dev
```

### Access Points
- **Frontend Store:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin) (Manage products, bulk assignments, and menu structures natively)

## Features
- **Dynamic Mega Menus**: Header data structures are completely generated and sorted from the Postgres backend and manageable via the Admin area.
- **Advanced Typesense Search**: Features an ultra-fast inline header search drop-down natively indexing `name`, `description` with a robust faceted filtering system.
- **Clean URLs**: Category routing allows top-level viewing (`/wedding-guest-dresses`) backed by intelligent fuzzy-matching fallback logic.
- **Admin Bulk Assignments**: Includes native backend bulk categorization and dynamic product management interfaces.
