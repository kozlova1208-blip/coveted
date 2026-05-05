/**
 * NAP product scraper — run with Node.js (requires Playwright)
 *
 * Setup:
 *   cd scripts
 *   npm install playwright
 *   npx playwright install chromium
 *   node scrape-nap.js
 *
 * Output: writes ../server/cards.js with all scraped cards
 *
 * Add/remove URLs in the URLS array below.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── Add your NAP product URLs here ──────────────────────────────────────────
const URLS = [
  'https://www.net-a-porter.com/en-gb/shop/product/46376663163024499',
  'https://www.net-a-porter.com/en-gb/shop/product/loewe/clothing/t-shirts/plus-paula%E2%80%99s-ibiza-logo-embroidered-cotton-jersey-t-shirt/46376663163091741',
  'https://www.net-a-porter.com/en-gb/shop/product/rohe/clothing/shirts/cotton-poplin-shirt/46376663163072146',
  'https://www.net-a-porter.com/en-gb/shop/product/frame/clothing/wide-leg/the-loose-distressed-mid-rise-straight-leg-jeans/46376663163106217',
  'https://www.net-a-porter.com/en-gb/shop/product/repossi/jewelry-and-watches/statement-rings/antifer-18-karat-white-gold-diamond-ring/46376663162976198',
  'https://www.net-a-porter.com/en-gb/shop/product/carolina-herrera/clothing/blouses/silk-blouse/46376663162928671',
  // Add more URLs here...
];

// ─── Guess category from URL path ────────────────────────────────────────────
function guessCategory(url) {
  const u = url.toLowerCase();
  if (u.includes('/bags') || u.includes('/handbag')) return 'bag';
  if (u.includes('/shoes') || u.includes('/heel') || u.includes('/boot') || u.includes('/sandal') || u.includes('/sneaker')) return 'shoe';
  if (u.includes('/coat') || u.includes('/jacket') || u.includes('/outerwear')) return 'coat';
  if (u.includes('/dress')) return 'dress';
  if (u.includes('/jewelry') || u.includes('/jewellery') || u.includes('/watches') || u.includes('/ring') || u.includes('/earring') || u.includes('/necklace') || u.includes('/bracelet')) return 'jewellery';
  if (u.includes('/scarf') || u.includes('/belt') || u.includes('/sunglasses') || u.includes('/accessories')) return 'accessory';
  if (u.includes('/shirt') || u.includes('/blouse') || u.includes('/top')) return 'top';
  if (u.includes('/jeans') || u.includes('/trouser') || u.includes('/pant') || u.includes('/wide-leg') || u.includes('/skirt')) return 'bottom';
  if (u.includes('/clothing')) return 'clothing';
  return 'other';
}

// ─── Extract product ID from URL ─────────────────────────────────────────────
function extractId(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].replace(/[^0-9a-zA-Z]/g, '').slice(0, 20);
}

// ─── Scrape a single product page ────────────────────────────────────────────
async function scrapePage(page, url) {
  console.log(`  Fetching: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a moment for JS to hydrate
    await page.waitForTimeout(3000);

    // Try to extract from __NEXT_DATA__ (Next.js embedded JSON — most reliable)
    const nextData = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      if (!el) return null;
      try { return JSON.parse(el.textContent); } catch { return null; }
    });

    let product = null;

    if (nextData) {
      // Walk the Next.js page props to find product data
      const props = nextData?.props?.pageProps;
      const rawProduct =
        props?.product ||
        props?.initialData?.product ||
        props?.data?.product ||
        findDeep(nextData, 'product') ||
        findDeep(nextData, 'designerName'); // fallback key hunt

      if (rawProduct) product = parseNextProduct(rawProduct, url);
    }

    // Fallback: scrape DOM directly
    if (!product) {
      product = await page.evaluate((pageUrl) => {
        // JSON-LD schema
        const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of schemas) {
          try {
            const d = JSON.parse(s.textContent);
            const item = d['@type'] === 'Product' ? d : (Array.isArray(d['@graph']) ? d['@graph'].find(x => x['@type'] === 'Product') : null);
            if (item) {
              return {
                name: item.name || '',
                brand: item.brand?.name || item.brand || '',
                description: item.description || '',
                price: item.offers?.price ? `£${item.offers.price}` : (item.offers?.priceSpecification?.[0]?.price ? `£${item.offers.priceSpecification[0].price}` : ''),
                image: item.image?.[0] || item.image || '',
                category: '',
                url: pageUrl,
              };
            }
          } catch {}
        }

        // DOM scraping fallback
        const name =
          document.querySelector('h1')?.innerText ||
          document.querySelector('[data-test="product-name"]')?.innerText ||
          document.title.split('|')[0].trim();

        const brand =
          document.querySelector('[data-test="designer-name"]')?.innerText ||
          document.querySelector('.product-details__designer')?.innerText ||
          document.querySelector('[class*="designer"]')?.innerText || '';

        const price =
          document.querySelector('[data-test="price"]')?.innerText ||
          document.querySelector('[class*="price"]')?.innerText ||
          document.querySelector('.price')?.innerText || '';

        const description =
          document.querySelector('[data-test="description"]')?.innerText ||
          document.querySelector('[class*="description"]')?.innerText ||
          document.querySelector('.product-description')?.innerText || '';

        // Find largest product image
        const imgs = Array.from(document.querySelectorAll('img'));
        const productImg = imgs
          .filter(i => i.src && (i.src.includes('net-a-porter') || i.src.includes('yoox')) && i.naturalWidth > 200)
          .sort((a, b) => b.naturalWidth - a.naturalWidth)[0];

        return {
          name: name.trim(),
          brand: brand.trim(),
          description: description.trim().slice(0, 200),
          price: price.trim(),
          image: productImg?.src || '',
          category: '',
          url: pageUrl,
        };
      }, url);
    }

    if (!product || !product.name) {
      console.warn(`  ⚠ Could not extract product from: ${url}`);
      return null;
    }

    // Fill in category from URL if not set
    if (!product.category) product.category = guessCategory(url);

    // Clean up image URL — request a good resolution
    if (product.image) {
      product.image = product.image
        .replace(/w\d+/, 'w920')
        .replace(/q\d+/, 'q60')
        .split('?')[0];
    }

    console.log(`  ✓ ${product.brand} — ${product.name} (${product.price})`);
    return { ...product, id: extractId(url), url };

  } catch (err) {
    console.warn(`  ✗ Error on ${url}: ${err.message}`);
    return null;
  }
}

// ─── Deep search helper for Next.js data trees ───────────────────────────────
function findDeep(obj, key, depth = 0) {
  if (depth > 8 || !obj || typeof obj !== 'object') return null;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const found = findDeep(v, key, depth + 1);
    if (found) return found;
  }
  return null;
}

function parseNextProduct(raw, url) {
  if (!raw) return null;
  return {
    name: raw.name || raw.productName || raw.shortDescription || '',
    brand: raw.designerName || raw.brand?.name || raw.brandName || '',
    description: (raw.description || raw.longDescription || raw.editorialDescription || '').slice(0, 200),
    price: raw.price?.formatted || raw.price?.value ? `£${raw.price.value}` : (raw.price || ''),
    image: raw.images?.[0]?.url || raw.image || raw.imageUrl || '',
    category: raw.category || raw.productType || '',
    url,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Launching browser…');
  const browser = await chromium.launch({
    headless: false, // visible browser — helps bypass Cloudflare
    slowMo: 100,
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-GB',
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  // Visit NAP homepage first to warm up cookies
  console.log('Warming up session…');
  await page.goto('https://www.net-a-porter.com/en-gb/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const cards = [];

  for (const url of URLS) {
    const card = await scrapePage(page, url);
    if (card) cards.push(card);
    // Polite delay between requests
    await page.waitForTimeout(1500 + Math.random() * 1000);
  }

  await browser.close();

  if (cards.length === 0) {
    console.error('\n✗ No cards scraped. Check that the browser loaded pages correctly.');
    process.exit(1);
  }

  // ─── Write cards.js ──────────────────────────────────────────────────────
  const js = `// Auto-generated by scrape-nap.js — ${new Date().toISOString()}
// ${cards.length} products scraped from Net-a-Porter
const cards = ${JSON.stringify(cards, null, 2)};

module.exports = { cards };
`;

  const outPath = path.join(__dirname, '..', 'server', 'cards.js');
  fs.writeFileSync(outPath, js, 'utf8');

  console.log(`\n✓ Wrote ${cards.length} cards to ${outPath}`);
  console.log('\nCards scraped:');
  cards.forEach((c, i) => console.log(`  ${i + 1}. [${c.category}] ${c.brand} — ${c.name} (${c.price})`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
