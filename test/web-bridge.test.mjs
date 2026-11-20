// Tests src/bridge.web.js against a fake @cmscure/javascript-sdk.
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'cmscure-web-bridge-'));

writeFileSync(join(dir, 'fake-sdk.mjs'), `
export class CMSCureSDK extends EventTarget {
  static instance = null;
  constructor() {
    super();
    if (CMSCureSDK.instance) return CMSCureSDK.instance;
    CMSCureSDK.instance = this;
    this.language = 'en';
    this.stores = {};
    this.reads = [];
    this.configured = null;
  }
  async configure(config) { this.configured = config; }
  getLanguage() { return this.language; }
  async setLanguage(code) {
    this.language = code;
    this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'LanguageChanged' } }));
  }
  getAvailableLanguages() { return ['en', 'fr']; }
  translation(key, tab, def) { this.reads.push(['t', tab, key]); return key === 'title' ? 'Hello' : def; }
  color(key, def) { this.reads.push(['c', key]); return key === 'primary' ? '#112233' : def; }
  image(key, def) { this.reads.push(['i', key]); return key === 'logo' ? 'https://x/logo.png' : def; }
  dataStore(id, def) {
    this.reads.push(['s', id]);
    if (!(id in this.stores) && id === 'late') {
      setTimeout(() => {
        this.stores.late = [{ _id: 'l1', data: { title: 'Late' } }];
        this.dispatchEvent(new CustomEvent('contentUpdated', { detail: { reason: 'DataStoreSynced', store: 'late' } }));
      }, 20);
    }
    return this.stores[id] || def;
  }
}
`);

const src = readFileSync(join(here, '..', 'src', 'bridge.web.js'), 'utf8')
  .replace("'@cmscure/javascript-sdk'", JSON.stringify(pathToFileURL(join(dir, 'fake-sdk.mjs')).href));
writeFileSync(join(dir, 'bridge.web.mjs'), src);

const { bridge } = await import(pathToFileURL(join(dir, 'bridge.web.mjs')).href);
const { CMSCureSDK } = await import(pathToFileURL(join(dir, 'fake-sdk.mjs')).href);
const sdk = new CMSCureSDK();

test('configure passes keys through', async () => {
  assert.equal(await bridge.configure({ projectId: 'p', apiKey: 'cmsc_ck_x', projectSecret: 's' }), true);
  assert.deepEqual(sdk.configured, { projectId: 'p', apiKey: 'cmsc_ck_x', projectSecret: 's' });
});

test('strings, colors, images', async () => {
  assert.equal(await bridge.translation('title', 'home'), 'Hello');
  assert.equal(await bridge.translation('missing', 'home'), '');
  assert.equal(await bridge.colorValue('primary'), '#112233');
  assert.equal(await bridge.colorValue('nope'), null);
  assert.equal(await bridge.imageURL('logo'), 'https://x/logo.png');
});

test('sync starts the right subscription', async () => {
  sdk.reads = [];
  await bridge.sync('__colors__');
  await bridge.sync('__images__');
  await bridge.sync('home');
  assert.deepEqual(sdk.reads.map((r) => r.slice(0, 2)), [['c', '__cmscure_probe__'], ['i', '__cmscure_probe__'], ['t', 'home']]);
});

test('data store items get the native JSONValue shape', async () => {
  sdk.stores.products = [
    { _id: 'a', data: { title: { en: 'Shoe', fr: 'Chaussure' }, price: 9.5, qty: 3, sale: true }, ctaUrl: 'https://x/a', createdAt: 'c', updatedAt: 'u' },
    { _id: 'b', data: { title: 'Hidden', is_active: false } },
  ];
  const items = await bridge.getStoreItems('products');
  assert.equal(items.length, 1);
  const [a] = items;
  assert.equal(a.id, 'a');
  assert.deepEqual(a.data.title, { stringValue: 'Shoe', localizedString: 'Shoe', values: { en: 'Shoe', fr: 'Chaussure' } });
  assert.equal(a.data.price.doubleValue, 9.5);
  assert.equal(a.data.qty.intValue, 3);
  assert.equal(a.data.sale.boolValue, true);
  assert.equal(a.data.cta_url.stringValue, 'https://x/a');
  await bridge.setLanguage('fr');
  const [fr] = await bridge.getStoreItems('products');
  assert.equal(fr.data.title.localizedString, 'Chaussure');
  await bridge.setLanguage('en');
});

test('syncStore waits for the first download', async () => {
  const items = await bridge.syncStore('late');
  assert.equal(items.length, 1);
  assert.equal(items[0].data.title.stringValue, 'Late');
});

test('update events map to native identifiers', async () => {
  const seen = [];
  const sub = bridge.addUpdateListener((e) => seen.push(e));
  const fire = (detail) => sdk.dispatchEvent(new CustomEvent('contentUpdated', { detail }));
  fire({ reason: 'TabSynced', tab: 'home' });
  fire({ reason: 'DataStoreSynced', store: 'products' });
  fire({ reason: 'ColorsSynced' });
  fire({ reason: 'ImagesSynced' });
  fire({ reason: 'InitialSyncComplete' });
  sub.remove();
  fire({ reason: 'ColorsSynced' });
  assert.deepEqual(seen, [
    { identifier: 'home', type: 'translation' },
    { identifier: 'products', type: 'dataStore' },
    { identifier: '__colors__', type: 'colors' },
    { identifier: '__images__', type: 'images' },
    { identifier: '__ALL_SCREENS_UPDATED__', type: 'all' },
  ]);
});
