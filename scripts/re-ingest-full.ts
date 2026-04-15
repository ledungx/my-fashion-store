import { execSync } from 'child_process';
console.log('1. Clearing old images...');
execSync('npx tsx scripts/clear_images.ts', { stdio: 'inherit' });
console.log('2. Ingesting products from Shopify...');
execSync('npx tsx scripts/ingest-shopify.ts', { stdio: 'inherit' });
console.log('3. Syncing to Typesense...');
execSync('node workers/syncTypesense.js', { stdio: 'inherit' });
console.log('All done! New mapping is active across both databases.');
