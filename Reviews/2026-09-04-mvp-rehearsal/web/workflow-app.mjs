import { taggedJson, formatBasisSummary } from './model.mjs';
import { createFilesView } from './files-view.mjs';
import { createDataView } from './data-view.mjs';
import { createArcadeView } from './arcade-view.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = { sdk: null, labStatus: null, basis: null, evidence: null, active: null, views: {}, routeEpoch: 0 };

function say(message) { $('#live-status').textContent = message; }
function inspect(label, evidence) {
  state.evidence = evidence;
  const q = evidence?.qualification ?? {};
  const facts = [
    ['Selection', label], ['Outcome', evidence?.outcome],
    ['Basis', evidence?.basis?.blockHash ?? evidence?.basis?.blockNumber],
    ['Coverage', q.coverage], ['Support / validation', [q.support ?? '—', q.validation ?? '—'].join(' / ')],
    ['Authority', q.authority], ['Currentness / finality', [q.currentness ?? '—', q.finality ?? '—'].join(' / ')],
    ['Integrity', q.integrity], ['Availability / bytes', [q.availability ?? '—', q.bytes ?? '—'].join(' / ')],
    ['Effect', q.effect ?? evidence?.effect],
  ];
  const box = $('#evidence-summary'); box.replaceChildren();
  for (const [name, value] of facts) {
    if (value == null) continue;
    const fact = document.createElement('div'); fact.className = 'fact';
    const key = document.createElement('b'); key.textContent = name;
    fact.append(key, document.createTextNode(String(value))); box.append(fact);
  }
  $('#raw-evidence').textContent = taggedJson(evidence);
}

function navigate(hash) {
  if (location.hash !== hash) history.pushState(null, '', hash);
  return route();
}

async function route() {
  if (!state.sdk) return;
  const token = ++state.routeEpoch;
  const hash = location.hash || '#files';
  const area = /^#(files|data|arcade)(?:[/?]|$)/.exec(hash)?.[1];
  state.views[state.active]?.deactivate();
  state.active = area ?? null;
  state.basis = null; state.evidence = null;
  $('#basis-summary').textContent = 'Selecting a fixed basis…';
  $('#evidence-summary').replaceChildren(); $('#raw-evidence').textContent = 'No result selected at this route.';
  $$('[data-tab]').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === area);
    if (button.dataset.tab === area) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $$('.view').forEach(view => view.classList.toggle('active', view.dataset.view === area));
  if (!area) { say('Unknown route. Use Files, Data or Arcade; no target inferred.'); return; }
  try { await state.views[area].open(hash); }
  catch (error) { if (token === state.routeEpoch) say('Could not open ' + area + ': ' + error.message); }
}

async function initialize() {
  try {
    state.sdk = await window.EfsLabSdk;
    if (!state.sdk) throw new Error('Explicit local SDK and configuration required');
    const config = window.EFS_LAB_BOOTSTRAP;
    if (!config?.lab) throw new Error('Synthetic lab configuration required');
    state.labStatus = typeof state.sdk.getLabStatus === 'function'
      ? await state.sdk.getLabStatus() : state.sdk.deployment;
    const factories = { files: createFilesView, data: createDataView, arcade: createArcadeView };
    for (const [area, factory] of Object.entries(factories)) {
      state.views[area] = factory({ root: $('[data-view="' + area + '"]'), sdk: state.sdk, config,
        utilities: window.EFS_LAB_UTILS, navigate,
        onStatus: text => { if (state.active === area) say(text); },
        onEvidence: (label, evidence) => { if (state.active === area) inspect(label, evidence); },
        onBasis: basis => {
          if (state.active !== area) return;
          state.basis = basis;
          $('#basis-summary').textContent = formatBasisSummary(state.labStatus, basis);
        },
      });
    }
    await route();
  } catch (error) {
    $('#basis-summary').textContent = 'Lab unavailable; no success inferred';
    say('Lab unavailable: ' + error.message);
  }
}

$$('[data-tab]').forEach(button => button.addEventListener('click', () => navigate('#' + button.dataset.tab)));
$('.skip').addEventListener('click', event => {
  event.preventDefault(); $('#workspace').focus();
});
$('#copy-evidence').addEventListener('click', async () => {
  try {
    if (!state.evidence) return;
    await navigator.clipboard.writeText(taggedJson(state.evidence)); say('Evidence copied; qualification preserved.');
  } catch (error) { say('Could not copy evidence: ' + error.message); }
});
addEventListener('hashchange', () => { void route(); });
addEventListener('pagehide', () => {
  state.routeEpoch += 1; state.active = null;
  Object.values(state.views).forEach(view => view.deactivate());
}, { once: true });
void initialize();
