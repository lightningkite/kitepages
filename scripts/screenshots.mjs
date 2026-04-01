#!/usr/bin/env node
import puppeteer from 'puppeteer-core';
import { readdir, mkdir, mkdtemp } from 'fs/promises';
import { join, basename } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const PROJECT_ROOT = join(import.meta.dirname, '..');
const SITES_DIR = join(PROJECT_ROOT, 'sites');
const SCREENSHOTS_DIR = join(PROJECT_ROOT, 'screenshots');
const RENDERER = join(PROJECT_ROOT, 'prototype', 'renderer.html');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 375,  height: 812 },
];

// Find Chrome
function findChrome() {
  const paths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  for (const p of paths) {
    try { execSync(`test -f "${p}"`); return p; } catch {}
  }
  throw new Error('Chrome not found');
}

async function main() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  // Find all site directories
  const entries = await readdir(SITES_DIR, { withFileTypes: true });
  const siteDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  if (siteDirs.length === 0) {
    console.log('No site directories found in sites/');
    return;
  }

  // Start a simple HTTP server
  const { createServer } = await import('http');
  const { readFile } = await import('fs/promises');
  const { extname } = await import('path');

  const MIME = { '.html': 'text/html', '.md': 'text/plain', '.json': 'application/json',
                 '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
                 '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

  let currentSiteDir = '';

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let filePath;

    if (url.pathname === '/renderer.html') {
      filePath = RENDERER;
    } else if (url.pathname.startsWith('/src/')) {
      filePath = join(PROJECT_ROOT, url.pathname.slice(1));
    } else {
      filePath = join(currentSiteDir, url.pathname.slice(1));
    }

    try {
      const data = await readFile(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  const tmpProfile = await mkdtemp(join(tmpdir(), 'kp-chrome-'));
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'shell',
    args: [
      '--no-sandbox',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--no-first-run',
      '--disable-gpu',
      `--user-data-dir=${tmpProfile}`,
    ],
  });

  for (const siteName of siteDirs) {
    const siteDir = join(SITES_DIR, siteName);
    currentSiteDir = siteDir;
    const siteScreenDir = join(SCREENSHOTS_DIR, siteName);
    await mkdir(siteScreenDir, { recursive: true });

    // Find the main .md file
    const mdFiles = (await readdir(siteDir)).filter(f => f.endsWith('.md') && f !== 'header.md' && f !== 'footer.md');
    if (mdFiles.length === 0) continue;

    for (const mdFile of mdFiles) {
      const pageName = basename(mdFile, '.md');

      for (const vp of VIEWPORTS) {
        const page = await browser.newPage();
        await page.setViewport({ width: vp.width, height: vp.height });

        // Load renderer with the .md file
        const url = `http://localhost:${port}/renderer.html?file=${mdFile}&theme=theme.yaml`;
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

        // Wait for images and fonts to load
        await new Promise(r => setTimeout(r, 3000));
        await page.evaluate(() => document.fonts?.ready);

        // Full page screenshot
        const filename = `${pageName}-${vp.name}.png`;
        await page.screenshot({
          path: join(siteScreenDir, filename),
          fullPage: true,
        });

        console.log(`  ${siteName}/${filename}`);
        await page.close();
      }
    }
  }

  await browser.close();
  server.close();
  console.log('\nDone! Screenshots in screenshots/');
}

main().catch(console.error);
