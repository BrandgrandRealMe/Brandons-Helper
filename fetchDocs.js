import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import fs from 'fs';
import settings from './config/settings.js'; // Import your settings object

export async function fetchDocsFromSitemap() {
  // Use settings.BASE_URL directly
  if (!settings.BASE_URL) {
    console.error('🚨 BASE_URL is not defined in your settings.js file!');
    return;
  }
  const SITEMAP_URL = `${settings.BASE_URL}/sitemap.xml`; 

  try { 
    console.log(`Fetching sitemap from: ${SITEMAP_URL}`);
    const sitemapRes = await fetch(SITEMAP_URL);
    if (!sitemapRes.ok) {
      throw new Error(`HTTP error! status: ${sitemapRes.status} from ${SITEMAP_URL}`);
    }
    const sitemapXml = await sitemapRes.text();
    const sitemap = await parseStringPromise(sitemapXml);

    const urls = sitemap.urlset.url
      .map(entry => entry.loc[0])
      // Use settings.BASE_URL for filtering
      .filter(url => url.startsWith(`${settings.BASE_URL}/docs/`));

    console.log(`🔍 Found ${urls.length} /docs URLs to process.`);

    const allDocs = [];
    for (const url of urls) {
      try {
        console.log(`Fetching content from: ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`⚠️ Failed to fetch ${url}: HTTP status ${res.status}`);
          continue; // Skip to next URL
        }
        const html = await res.text();
        const $ = cheerio.load(html);

        // Attempt to extract the title from the <title> tag or an <h1> within the article
        const pageTitle = $('head title').text().trim() || $('article h1').first().text().trim() || 'No Title Found';
        const articleContent = $('article').text().trim(); // This extracts ALL text from the article tag

        if (articleContent) {
          // Format the output exactly as requested
          const formattedDoc = `---- START OF PAGE ---\nTitle: ${pageTitle}\nDocumentation Source: ${url}\n\n${articleContent}\n---- END OF PAGE ---`;
          allDocs.push(formattedDoc);
        } else {
          console.log(`Skipping ${url}: No article content found.`);
        }
      } catch (err) {
        console.error(`⚠️ Error processing ${url}: ${err.message}`);
      }
    }

    fs.writeFileSync('./docs.txt', allDocs.join('\n\n'));
    console.log(`✅ Saved ${allDocs.length} documentation entries to docs.txt`);
  } catch (e) {
    console.error('🚨 Error fetching or parsing sitemap:', e.message);
  }
}

// This block ensures the function runs when directly executed
if (process.argv[1] && process.argv[1].endsWith('fetchDocs.js')) {
  fetchDocsFromSitemap();
}