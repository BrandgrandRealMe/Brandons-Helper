import cron from 'node-cron';
import { fetchDocsFromSitemap } from './fetchDocs.js';

cron.schedule('0 * * * *', async () => {
  console.log('🕒 Cron: updating docs...');
  await fetchDocsFromSitemap();
});
