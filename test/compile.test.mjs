import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'child_process';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const outDir = join(projectRoot, 'tmp', 'test-compile');

describe('compile', () => {
  it('compiles giuseppe site to static HTML', () => {
    if (existsSync(outDir)) rmSync(outDir, { recursive: true });
    mkdirSync(outDir, { recursive: true });

    execSync(`node src/compile.mjs sites/giuseppe --out ${outDir}`, { cwd: projectRoot });

    assert.ok(existsSync(join(outDir, 'index.html')));
    assert.ok(existsSync(join(outDir, 'menu.html')));
    assert.ok(existsSync(join(outDir, 'about.html')));

    const html = readFileSync(join(outDir, 'index.html'), 'utf-8');

    // Has doctype and structure
    assert.ok(html.startsWith('<!DOCTYPE html>'));
    assert.ok(html.includes('<title>'));

    // Has nav and footer
    assert.ok(html.includes('smd-nav'));
    assert.ok(html.includes('smd-footer'));

    // Has content
    assert.ok(html.includes("Giuseppe's Italian Restaurant"));
    assert.ok(html.includes('smd-carousel'));
    assert.ok(html.includes('smd-form'));

    // Links rewritten from .md to .html
    assert.ok(html.includes('href="menu.html"'));
    assert.ok(html.includes('href="about.html"'));

    // Has minimal runtime JS
    assert.ok(html.includes('carouselNav'));
    assert.ok(html.includes('smd-nav-toggle'));

    rmSync(outDir, { recursive: true });
  });

  it('compiles all demo sites without errors', () => {
    const sites = ['giuseppe', 'nonprofit', 'portfolio', 'salon', 'wedding'];
    for (const site of sites) {
      const siteOut = join(outDir, site);
      if (existsSync(siteOut)) rmSync(siteOut, { recursive: true });
      execSync(`node src/compile.mjs sites/${site} --out ${siteOut}`, { cwd: projectRoot });
      assert.ok(existsSync(join(siteOut, 'index.html')), `${site}/index.html exists`);
    }
    rmSync(outDir, { recursive: true });
  });
});
