import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { gameDocument } from '../web/game-source.mjs';

const root = new URL('../web/', import.meta.url);

test('browse document has no executable game iframe before explicit Play', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.match(html, /id="play-game"/);
});

test('original game document forbids external resources and has valid script syntax', () => {
  const html = gameDocument();
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /https?:|<img|<link|fetch\(|XMLHttpRequest|WebSocket|window\.parent|window\.ethereum/i);
  const body = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(body, 'inline game script must be present');
  assert.doesNotThrow(() => new Function(body));
});

test('runner construction contains only the scripts-only sandbox token', async () => {
  const sources = `${await readFile(new URL('app.mjs', root), 'utf8')}\n${await readFile(new URL('model.mjs', root), 'utf8')}`;
  assert.match(sources, /sandbox: 'allow-scripts'/);
  assert.doesNotMatch(sources, /allow-same-origin|allow-forms|allow-popups|allow-top-navigation/);
});
