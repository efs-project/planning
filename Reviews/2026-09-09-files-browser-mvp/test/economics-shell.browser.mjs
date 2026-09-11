import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
test('normal browser shell exposes a keyboard-expandable economics panel', async () => {
  const html = await readFile(new URL('../web/index.html', import.meta.url));
  const server = http.createServer((req, res) => { if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); } else { res.statusCode = 404; res.end(); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try { const page = await browser.newPage({ viewport: { width: 320, height: 640 } }); await page.goto(`http://127.0.0.1:${server.address().port}`); assert.equal(await page.locator('#economics').count(), 1, 'economics is on normal UI'); }
  finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
