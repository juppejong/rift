/* Rift Companion – app-logica. Draait volledig in de browser; data live uit Riot Data Dragon. */
'use strict';

const CDN = 'https://ddragon.leagueoflegends.com';
const LOCALE = 'en_US'; // Data Dragon heeft geen Nederlandse vertaling
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nk = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const plain = s => (s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(li|p|stats|mainText)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/\n{3,}/g, '\n\n').trim();

/* Nederlandse vertaling (nl.js, gemaakt met build-nl.js). Valt terug op Engels als de brontekst is gewijzigd. */
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
const tr = (key, en) => { const e = window.RC_NL?.t?.[key]; return e && en && e[0] === fnv(en) ? e[1] : en; };
const TAG_NL = { Mage: 'Mage', Assassin: 'Assassin', Tank: 'Tank', Fighter: 'Vechter', Marksman: 'Schutter', Support: 'Support' };

const S = { ver: '', champs: {}, champList: [], items: {}, runes: [], spells: {}, full: {}, favs: [], ui: { setup: 0, spell: 0, fav: false } };
const laneFilter = { q: '', sort: 'fit', diff: 0, flex: true, role: '', min: true };

/* ---------- opslag ---------- */
try { S.favs = JSON.parse(localStorage.getItem('rc_favs') || '[]'); } catch { S.favs = []; }
const saveFavs = () => { try { localStorage.setItem('rc_favs', JSON.stringify(S.favs)); } catch { } };
const isFav = id => S.favs.includes(id);
function toggleFav(id) { S.favs = isFav(id) ? S.favs.filter(x => x !== id) : [...S.favs, id]; saveFavs(); }

/* ---------- data laden ---------- */
async function getJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' → ' + r.status); return r.json(); }

async function loadAll() {
  const versions = await getJSON(`${CDN}/api/versions.json`);
  S.ver = versions[0];
  const base = `${CDN}/cdn/${S.ver}/data/${LOCALE}`;
  const [ch, it, ru, sp] = await Promise.all([
    getJSON(`${base}/champion.json`), getJSON(`${base}/item.json`),
    getJSON(`${CDN}/cdn/${S.ver}/data/${LOCALE}/runesReforged.json`), getJSON(`${base}/summoner.json`),
  ]);
  S.champs = ch.data; S.champList = Object.values(ch.data).sort((a, b) => a.name.localeCompare(b.name));
  S.items = it.data; Object.entries(S.items).forEach(([id, v]) => v.id = id);
  S.runes = ru; S.spells = sp.data;
  buildIndexes();
  S.stats = window.RC_STATS || null; // stats.js wordt gemaakt door collect.js
  buildTiers();
  $('#verBadge').textContent = 'Patch ' + S.ver;
}

/* ---------- indexen ---------- */
let champByKey = {}, itemByName = {}, runeByName = {}, spellByName = {}, laneMap = {}, completed = [], bootsList = [];

function buildIndexes() {
  champByKey = {}; S.champList.forEach(c => champByKey[nk(c.id)] = c);
  champByKey.wukong = champByKey.monkeyking; champByKey.nunu = champByKey.nunu || champByKey.nunuandwillump;

  laneMap = {};
  const raw = {}; Object.entries(CHAMP_LANES).forEach(([k, v]) => raw[nk(k)] = v.split(','));
  S.champList.forEach(c => laneMap[c.id] = (raw[nk(c.id)] || deriveLanes(c)).filter(l => LANES[l]));

  itemByName = {};
  const sr = Object.values(S.items).filter(i => i.maps && i.maps['11'] && i.gold && i.gold.purchasable !== false);
  sr.forEach(i => { const k = nk(i.name); if (!itemByName[k] || (i.gold.total || 0) > (itemByName[k].gold.total || 0)) itemByName[k] = i; });
  completed = sr.filter(i => (!i.into || !i.into.length) && (i.gold.total || 0) >= 1600 && !(i.tags || []).some(t => ['Consumable', 'Trinket', 'Boots'].includes(t)) && !i.requiredChampion && !i.requiredAlly && i.inStore !== false);
  bootsList = sr.filter(i => (i.tags || []).includes('Boots') && (!i.into || !i.into.length) && (i.gold.total || 0) >= 800);

  runeByName = {};
  S.runes.forEach(tree => tree.slots.forEach((slot, si) => slot.runes.forEach(r => runeByName[nk(r.name)] = { r, tree, slot: si })));

  spellByName = {}; Object.values(S.spells).forEach(s => spellByName[nk(s.name)] = s);
}

function deriveLanes(c) {
  const t = c.tags, set = [];
  const add = (...l) => l.forEach(x => !set.includes(x) && set.push(x));
  switch (t[0]) {
    case 'Marksman': add('ADC'); break;
    case 'Support': add('SUPPORT'); break;
    case 'Mage': add('MID'); if (t[1] === 'Support') add('SUPPORT'); break;
    case 'Assassin': add('MID', 'JUNGLE'); break;
    case 'Fighter': add('TOP', 'JUNGLE'); break;
    case 'Tank': add('TOP', 'SUPPORT'); break;
    default: add('MID');
  }
  return set;
}
const lanesOf = c => laneMap[c.id] || [];
const portrait = c => `${CDN}/cdn/${S.ver}/img/champion/${c.image.full}`;
const splash = (id, n = 0) => `${CDN}/cdn/img/champion/splash/${id}_${n}.jpg`;
const loading = (id, n = 0) => `${CDN}/cdn/img/champion/loading/${id}_${n}.jpg`;
const itemImg = i => `${CDN}/cdn/${S.ver}/img/item/${i.id}.png`;
const runeImg = r => `${CDN}/cdn/img/${r.icon}`;

/* ---------- archetype / build engine ---------- */
function archFor(c, lane) {
  let a = ARCH_OVERRIDE[`${c.id}:${lane}`] || ARCH_OVERRIDE[c.id];
  if (!a) {
    const [t1, t2] = c.tags, { attack, magic } = c.info;
    if (t1 === 'Marksman') a = 'marksman';
    else if (t1 === 'Mage') a = 'mage';
    else if (t1 === 'Assassin') a = magic > attack ? 'apAssassin' : 'adAssassin';
    else if (t1 === 'Fighter') a = magic > attack ? 'apFighter' : 'fighter';
    else if (t1 === 'Tank') a = 'tank';
    else a = t2 === 'Tank' ? 'engage' : t2 === 'Mage' ? 'mageSupport' : 'enchanter';
  }
  if (lane === 'SUPPORT') { if (a === 'mage') a = 'mageSupport'; else if (a === 'tank') a = 'engage'; }
  if (lane === 'ADC' && ['fighter', 'critSkirmisher'].includes(a)) a = 'marksman';
  return a;
}
const classOf = (c, lane) => ARCH_CLASS[archFor(c, lane)];

const findItem = name => itemByName[nk(name)];
function scoreItem(i, A) {
  let s = 0;
  (i.tags || []).forEach(t => s += A.weights[t] || 0);
  if ((i.gold.total || 0) >= 2600) s += 0.4;
  return s;
}
function uniqItems(arr) { const seen = new Set(); return arr.filter(i => i && !seen.has(i.id) && seen.add(i.id)); }
function resolveItems(names) { return uniqItems(names.map(findItem)); }

function buildFor(c, lane) {
  const archKey = archFor(c, lane), A = ARCHETYPES[archKey];
  const champNames = CHAMP_CORE[c.id] || [];
  const curated = uniqItems([...resolveItems(champNames), ...resolveItems(A.core)]);
  const algo = completed.map(i => ({ i, s: scoreItem(i, A) })).filter(x => x.s > 1).sort((a, b) => b.s - a.s).map(x => x.i);
  const pool = uniqItems([...curated, ...algo]);
  const core = pool.slice(0, 3);
  const alt = pool.slice(3, 9);

  let boots = resolveItems(A.boots).filter(i => (i.tags || []).includes('Boots'));
  if (boots.length < 2) boots = uniqItems([...boots, ...bootsList]).slice(0, 4);

  const sitCat = (names, filterFn, limit = 3) => {
    let r = resolveItems(names).slice(0, limit);
    if (!r.length && filterFn) r = completed.filter(filterFn).map(i => ({ i, s: scoreItem(i, A) })).sort((a, b) => b.s - a.s).map(x => x.i).slice(0, limit);
    return r;
  };
  const sit = {
    armor: sitCat(A.sit.armor, i => (i.tags || []).includes('Armor') && scoreItem(i, A) > -2),
    mr: sitCat(A.sit.mr, i => (i.tags || []).includes('SpellBlock') && scoreItem(i, A) > -2),
    antiheal: sitCat(A.sit.antiheal, i => /Grievous Wounds/i.test(i.description || '') && scoreItem(i, A) > 0),
    pen: sitCat(A.sit.pen, i => (i.tags || []).some(t => ['ArmorPenetration', 'MagicPenetration'].includes(t)) && scoreItem(i, A) > 0),
    defensive: sitCat(A.sit.defensive, null),
  };

  let start = [];
  if (lane === 'JUNGLE') start = resolveItems(JUNGLE_PETS).slice(0, 1);
  else if (lane === 'SUPPORT') start = resolveItems(['World Atlas', 'Runic Compass', 'Bounty of Worlds', "Spellthief's Edge"]).slice(0, 1);
  else start = resolveItems([STARTER_BY_DMG[A.dmg === 'sup' ? 'ap' : A.dmg]]);
  const pots = resolveItems(['Health Potion', 'Refillable Potion']).slice(0, 1);
  const ward = resolveItems(['Stealth Ward']);

  let runes = A.runes.map(s => resolveSetup(s));
  let spells = (SPELL_BY_ARCH[archKey] && lane === 'SUPPORT' ? SPELL_BY_ARCH[archKey] : SPELLS[lane] || SPELLS.MID)
    .map(p => p.map(n => spellByName[nk(n)]).filter(Boolean)).filter(p => p.length);

  return { archKey, A, core, alt, boots: boots.slice(0, 4), sit, start: [...start, ...pots], ward, runes, spells };
}

function resolveSetup(s) {
  const key = runeByName[nk(s.key)];
  const primary = s.primary.map(n => runeByName[nk(n)] || { missing: n });
  const sec = s.sec.map(n => runeByName[nk(n)] || { missing: n });
  const secTree = sec.find(x => x.tree)?.tree;
  return { ...s, keystone: key || { missing: s.key }, primaryTree: key?.tree, primaryRunes: primary, secTree, secRunes: sec };
}

/* ---------- echte matchdata (stats.json, gemaakt met collect.js) ---------- */
const MIN_GAMES = 10;
const wilson = (w, n) => { if (!n) return 0; const z = 1.645, p = w / n; return (p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n); };
function buildTiers() {
  S.tier = {};
  if (!S.stats) return;
  for (const [lane, L] of Object.entries(S.stats.lanes)) {
    const rows = Object.entries(L.champs).filter(([, c]) => c.g >= MIN_GAMES).map(([id, c]) => ({ id, s: wilson(c.w, c.g) })).sort((a, b) => b.s - a.s);
    rows.forEach((r, i) => { const q = i / rows.length; S.tier[lane + ':' + r.id] = q < .12 ? 'S' : q < .35 ? 'A' : q < .7 ? 'B' : 'C'; });
  }
}
function statOf(id, lane) {
  const L = S.stats?.lanes?.[lane], c = L?.champs?.[id]; if (!c) return null;
  const matches = S.stats.meta.matches || 1;
  return { g: c.g, wr: 100 * c.w / c.g, pr: 100 * c.g / matches, tier: c.g >= MIN_GAMES ? S.tier[lane + ':' + id] : null, c };
}
const topBy = (map, n = 3) => Object.entries(map || {}).sort((a, b) => b[1][0] - a[1][0]).slice(0, n);
const runeById = id => { for (const t of S.runes) for (const s of t.slots) for (const r of s.runes) if (r.id === +id) return r; return null; };
const spellById = k => Object.values(S.spells).find(s => s.key === String(k));
function dataPanel(c, lane) {
  const st = statOf(c.id, lane);
  if (!S.stats) return '';
  if (!st) return `<div class="panel"><h2>📊 Echte matchdata</h2><p class="mute">Nog geen games van ${esc(c.name)} in ${LANES[lane].label} in de steekproef (${S.stats.meta.matches} matches). Draai <code>node collect.js</code> met meer matches.</p></div>`;
  const pct = (a) => `${(100 * a[1] / a[0]).toFixed(0)}% WR`;
  const ks = topBy(st.c.keystones, 4).map(([id, a]) => { const r = runeById(id); return r ? `<div class="rune"><img src="${runeImg(r)}" alt=""><span class="rn">${esc(r.name)} <span class="mute">${a[0]}× · ${pct(a)}</span></span></div>` : ''; }).join('');
  const bigItems = Object.fromEntries(Object.entries(st.c.items).filter(([id]) => { const i = S.items[id]; return i && ((i.gold.total || 0) >= 1600 || (i.tags || []).includes('Boots')) && !(i.tags || []).includes('Trinket'); }));
  const its = topBy(bigItems, 8).map(([id, a]) => { const i = S.items[id]; return i ? `<div class="it" data-item="${id}" title="${a[0]}× · ${pct(a)}"><img src="${itemImg(i)}" alt=""><small>${esc(i.name)}<br>${a[0]}× · ${pct(a)}</small></div>` : ''; }).join('');
  const sps = topBy(st.c.spells, 3).map(([k, a]) => `<span class="chip gold">${k.split(',').map(x => spellById(x)?.name || x).join(' + ')} · ${a[0]}× · ${pct(a)}</span>`).join(' ');
  return `<div class="panel"><h2>📊 Echte matchdata ${st.tier ? `<span class="tier-label t-${st.tier}">${st.tier}</span>` : ''}</h2>
    <div class="pills"><span class="chip gold">${st.g} games</span><span class="chip">${st.wr.toFixed(1)}% win rate</span><span class="chip">${st.pr.toFixed(1)}% pick rate</span></div>
    <p class="mute" style="font-size:.8rem">Emerald+ ${esc(S.stats.meta.platform.toUpperCase())}, patch ${esc(S.stats.meta.mainPatch || '?')}, ${S.stats.meta.matches} matches. Kleine steekproef = ruis${st.g < MIN_GAMES ? ' (te weinig games voor een tier)' : ''}.</p>
    <div class="tag-title">Meest gebruikte keystones</div>${ks || '–'}
    <div class="tag-title">Meest gekochte items (eindbuild)</div><div class="items">${its || '–'}</div>
    <div class="tag-title">Summoner spells</div>${sps || '–'}</div>`;
}

/* ---------- matchups ---------- */
function duel(a, b, lane) {
  const ca = classOf(a, lane), cb = classOf(b, lane);
  let s = (CLASS_ADV[ca]?.[cb] || 0) - (CLASS_ADV[cb]?.[ca] || 0), why = [];
  if (s > 0) why.push(`${ca} wint meestal van ${cb}`); else if (s < 0) why.push(`${ca} heeft het moeilijk tegen ${cb}`);
  const ra = a.stats.attackrange, rb = b.stats.attackrange;
  if (lane === 'TOP' || lane === 'MID') {
    if (ra >= 300 && rb < 300) { s += 1; why.push('bereikvoordeel (ranged vs melee)'); }
    if (rb >= 300 && ra < 300) { s -= 1; why.push('bereiknadeel (melee vs ranged)'); }
  } else if (Math.abs(ra - rb) >= 100) { s += Math.sign(ra - rb) * 0.5; why.push(ra > rb ? 'meer bereik' : 'minder bereik'); }
  return { s, why };
}
function lanePool(lane, includeFlex = true) {
  return S.champList.filter(c => includeFlex ? lanesOf(c).includes(lane) : lanesOf(c)[0] === lane);
}
function matchups(c, lane) {
  const rows = lanePool(lane).filter(o => o.id !== c.id).map(o => ({ o, ...duel(c, o, lane) }));
  rows.sort((a, b) => b.s - a.s);
  return { good: rows.filter(r => r.s > 0).slice(0, 10), bad: rows.filter(r => r.s < 0).slice(-10).reverse() };
}

/* ---------- skill order (heuristiek) ---------- */
function skillPrio(full) {
  const L = ['Q', 'W', 'E'];
  const cd = full.spells.slice(0, 3).map((s, i) => {
    const v = String(s.cooldownBurn).split('/').map(parseFloat).filter(x => !isNaN(x));
    return { l: L[i], cd: v.length && v[v.length - 1] > 0 ? v[v.length - 1] : 99 };
  });
  return cd.sort((a, b) => a.cd - b.cd).map(x => x.l);
}

/* ---------- UI helpers ---------- */
const diffBar = n => `<span class="diff" title="Moeilijkheid ${n}/10">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'f' : ''}"></i>`).join('')}</span>`;
const dmgChip = A => `<span class="chip ${A.dmg}">${A.dmg === 'ad' ? 'AD' : A.dmg === 'ap' ? 'AP' : A.dmg === 'tank' ? 'Tank' : 'Support'}</span>`;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); }
function openModal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; }
const closeModal = () => $('#modal').hidden = true;

function champCard(c, lane, fit) {
  const A = ARCHETYPES[archFor(c, lane || lanesOf(c)[0] || 'MID')];
  const st = lane ? statOf(c.id, lane) : null;
  const statLine = st ? `<span class="mute" style="font-size:.74rem">${st.tier ? `<b class="tier-label t-${st.tier}" style="width:20px;height:20px;font-size:.7rem;vertical-align:middle">${st.tier}</b> ` : ''}${st.wr.toFixed(1)}% WR · ${st.g} games</span>` : '';
  const href = `#/champ/${c.id}/${lane || lanesOf(c)[0] || 'MID'}`;
  return `<a class="card" href="${href}">
    ${fit ? `<span class="fit ${fit === 'Primair' ? 'p' : 'f'}">${fit}</span>` : ''}
    <button class="fav ${isFav(c.id) ? 'on' : ''}" data-fav="${c.id}" aria-label="Favoriet">★</button>
    <div class="portrait" style="background-image:url('${loading(c.id)}')"></div>
    <div class="body"><span class="nm">${esc(c.name)}</span><span class="mute" style="font-size:.78rem">${esc(c.title)}</span>
    <div class="ct">${dmgChip(A)}<span class="chip">${esc(A.label.split('(')[0].trim())}</span></div>${statLine}${diffBar(c.info.difficulty)}</div></a>`;
}

function itemTile(i, label) {
  if (!i) return '';
  return `<div class="it" data-item="${i.id}" title="${esc(i.name)} – ${i.gold.total}g"><img src="${itemImg(i)}" alt="${esc(i.name)}" loading="lazy"><small>${esc(label || i.name)}</small></div>`;
}
const itemRow = (arr, sep = false) => `<div class="items">${arr.map((i, idx) => (sep && idx ? '<span class="arrow">›</span>' : '') + itemTile(i)).join('') || '<span class="mute">Geen items gevonden voor deze patch.</span>'}</div>`;

/* ---------- routes ---------- */
const routes = {
  home: renderHome, lane: renderLane, champions: renderChampions, champ: renderChamp, counter: renderCounter,
  team: renderTeam, items: renderItems, runes: renderRunes, favs: renderFavs,
};

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const name = parts[0] || 'home';
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === name));
  const fn = routes[name] || renderHome;
  const app = $('#app');
  try { fn(app, parts.slice(1)); } catch (e) { console.error(e); app.innerHTML = `<div class="panel warn">Er ging iets mis: ${esc(e.message)}</div>`; }
  window.scrollTo(0, 0);
}

/* ---------- Home ---------- */
function renderHome(app) {
  const day = Math.floor(Date.now() / 864e5), pick = S.champList[day % S.champList.length];
  const pl = lanesOf(pick)[0] || 'MID';
  const total = S.champList.length, items = completed.length;
  app.innerHTML = `
  <section class="hero"><h1>Welkom op de Kloof, Summoner.</h1>
    <p>Alle ${total} champions, per lane gesorteerd, met aanbevolen runes, summoner spells, skill-volgorde en items. Bekijk matchups, bouw een teamsamenstelling en exporteer je item set naar de League-client.</p>
    <div class="row"><a class="btn primary" href="#/lane/MID">Start met een lane →</a><a class="btn" href="#/counter">Counter picker</a><a class="btn" href="#/team">Team builder</a></div></section>
  <div class="stats-row"><div class="stat"><b>${total}</b><span>champions</span></div><div class="stat"><b>${items}</b><span>afgeronde items</span></div>
   <div class="stat"><b>${S.runes.reduce((n, t) => n + t.slots.reduce((m, s) => m + s.runes.length, 0), 0)}</b><span>runes</span></div><div class="stat"><b>${S.ver}</b><span>patch</span></div></div>
  <h2>Kies je lane</h2>
  <div class="lane-grid">${Object.entries(LANES).map(([k, l]) => `<a class="lane-card" href="#/lane/${k}"><div class="ic">${l.icon}</div><h3>${l.label}</h3><p>${l.desc}</p><p class="mute" style="margin-top:6px">${lanePool(k, false).length} primair · ${lanePool(k).length} totaal</p></a>`).join('')}</div>
  <div class="cols">
    <div class="panel"><h2>Champion van de dag</h2><div class="row"><img src="${portrait(pick)}" width="72" height="72" style="border-radius:14px"><div><h3 style="margin:0">${esc(pick.name)}</h3><span class="mute">${esc(pick.title)}</span><div class="pills">${lanesOf(pick).map(l => `<span class="chip gold">${LANES[l].label}</span>`).join('')}</div></div><a class="btn" style="margin-left:auto" href="#/champ/${pick.id}/${pl}">Bekijk build →</a></div></div>
    <div class="panel"><h2>Algemene tips</h2><ul class="list">${GENERIC_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
  </div>
  <h2>Beginner-vriendelijke picks per lane</h2>
  ${Object.keys(LANES).map(l => `<h3>${LANES[l].icon} ${LANES[l].label}</h3><div class="grid">${lanePool(l, false).filter(c => c.info.difficulty <= 4).sort((a, b) => a.info.difficulty - b.info.difficulty).slice(0, 6).map(c => champCard(c, l, 'Primair')).join('')}</div>`).join('')}`;
}

/* ---------- Lane / tierlist ---------- */
function renderLane(app, [lane = 'TOP']) {
  if (!LANES[lane]) lane = 'TOP';
  const roles = [...new Set(S.champList.flatMap(c => c.tags))].sort();
  app.innerHTML = `
  <h1>${LANES[lane].icon} ${LANES[lane].label}</h1><p class="mute">${LANES[lane].desc}</p>
  <div class="tabs">${Object.entries(LANES).map(([k, l]) => `<a class="tab ${k === lane ? 'on' : ''}" href="#/lane/${k}">${l.icon} ${l.label}</a>`).join('')}</div>
  <div class="toolbar">
    <input id="lq" placeholder="Filter op naam…" value="${esc(laneFilter.q)}">
    <select id="lsort"><option value="fit">Sorteer: Lane-fit</option>${S.stats ? '<option value="tier">Tier (data)</option><option value="wr">Win rate</option><option value="pr">Pick rate</option>' : ''}<option value="az">A – Z</option><option value="easy">Makkelijkst eerst</option><option value="hard">Moeilijkst eerst</option><option value="attack">Meeste aanval</option><option value="defense">Meeste defense</option><option value="magic">Meeste magie</option></select>
    <select id="lrole"><option value="">Alle rollen</option>${roles.map(r => `<option ${laneFilter.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
    <select id="ldiff"><option value="0">Elke moeilijkheid</option><option value="4">Makkelijk (≤4)</option><option value="7">Gemiddeld (≤7)</option><option value="10">Moeilijk (alles)</option></select>
    <label class="mute"><input type="checkbox" id="lflex" ${laneFilter.flex ? 'checked' : ''}> toon flex-picks</label>
    ${S.stats ? `<label class="mute"><input type="checkbox" id="lmin" ${laneFilter.min ? 'checked' : ''}> min. ${MIN_GAMES} games data</label>` : ''}
    <span class="mute" id="lcount"></span>
  </div>
  <div class="panel" style="padding:10px 14px"><span class="mute">“Primair” = standaardlane, “Flex” = ook speelbaar. ${S.stats ? `Win rates en tiers komen uit <b>${S.stats.meta.matches} echte Emerald+ matches</b> (patch ${esc(S.stats.meta.mainPatch || '?')}, ${esc(S.stats.meta.platform.toUpperCase())}). Een tier telt pas vanaf ${MIN_GAMES} games; kleine steekproeven geven ruis.` : 'Geen matchdata gevonden: dit is lane-fit op basis van champion-ontwerp. Draai <code>node collect.js</code> voor echte win rates.'}</span></div>
  <div class="grid" id="lgrid"></div>`;
  $('#lsort').value = laneFilter.sort; $('#ldiff').value = String(laneFilter.diff);
  const update = () => {
    laneFilter.q = $('#lq').value; laneFilter.sort = $('#lsort').value; laneFilter.diff = +$('#ldiff').value; laneFilter.flex = $('#lflex').checked; laneFilter.min = $('#lmin') ? $('#lmin').checked : false; laneFilter.role = $('#lrole').value;
    let list = lanePool(lane, laneFilter.flex).filter(c => !laneFilter.q || c.name.toLowerCase().includes(laneFilter.q.toLowerCase()));
    const before = list.length;
    if (S.stats && laneFilter.min) list = list.filter(c => (statOf(c.id, lane)?.g || 0) >= MIN_GAMES);
    const hidden = before - list.length;
    if (laneFilter.role) list = list.filter(c => c.tags.includes(laneFilter.role));
    if (laneFilter.diff) list = list.filter(c => c.info.difficulty <= laneFilter.diff);
    const prim = c => lanesOf(c)[0] === lane ? 0 : 1;
    const sorters = {
      fit: (a, b) => prim(a) - prim(b) || a.name.localeCompare(b.name), az: (a, b) => a.name.localeCompare(b.name),
      easy: (a, b) => a.info.difficulty - b.info.difficulty || a.name.localeCompare(b.name), hard: (a, b) => b.info.difficulty - a.info.difficulty || a.name.localeCompare(b.name),
      tier: (a, b) => (statOf(b.id, lane) ? wilson(statOf(b.id, lane).c.w, statOf(b.id, lane).g) : -1) - (statOf(a.id, lane) ? wilson(statOf(a.id, lane).c.w, statOf(a.id, lane).g) : -1),
      wr: (a, b) => (statOf(b.id, lane)?.wr ?? -1) - (statOf(a.id, lane)?.wr ?? -1), pr: (a, b) => (statOf(b.id, lane)?.g ?? -1) - (statOf(a.id, lane)?.g ?? -1),
      attack: (a, b) => b.info.attack - a.info.attack, defense: (a, b) => b.info.defense - a.info.defense, magic: (a, b) => b.info.magic - a.info.magic,
    };
    list.sort(sorters[laneFilter.sort]);
    $('#lgrid').innerHTML = list.map(c => champCard(c, lane, lanesOf(c)[0] === lane ? 'Primair' : 'Flex')).join('') || '<div class="empty">Geen champions gevonden.</div>';
    $('#lcount').textContent = `${list.length} champions` + (hidden > 0 && laneFilter.min ? ` (${hidden} verborgen: te weinig data)` : '');
  };
  ['lq', 'lsort', 'ldiff', 'lflex', 'lrole', 'lmin'].forEach(id => $('#' + id)?.addEventListener('input', update));
  update();
}

/* ---------- Alle champions ---------- */
function renderChampions(app) {
  const roles = [...new Set(S.champList.flatMap(c => c.tags))].sort();
  app.innerHTML = `<h1>Alle champions</h1>
  <div class="toolbar"><input id="cq" placeholder="Zoek champion…"><select id="cr"><option value="">Alle rollen</option>${roles.map(r => `<option>${r}</option>`).join('')}</select>
  <select id="cl"><option value="">Alle lanes</option>${Object.entries(LANES).map(([k, l]) => `<option value="${k}">${l.label}</option>`).join('')}</select><span class="mute" id="cc"></span></div>
  <div class="grid" id="cg"></div>`;
  const update = () => {
    const q = $('#cq').value.toLowerCase(), r = $('#cr').value, l = $('#cl').value;
    const list = S.champList.filter(c => c.name.toLowerCase().includes(q) && (!r || c.tags.includes(r)) && (!l || lanesOf(c).includes(l)));
    $('#cg').innerHTML = list.map(c => champCard(c, l || lanesOf(c)[0])).join('');
    $('#cc').textContent = `${list.length} champions`;
  };
  ['cq', 'cr', 'cl'].forEach(id => $('#' + id).addEventListener('input', update)); update();
}

function renderFavs(app) {
  const list = S.champList.filter(c => isFav(c.id));
  app.innerHTML = `<h1>★ Favorieten</h1>${list.length ? `<div class="grid">${list.map(c => champCard(c)).join('')}</div>` : '<div class="empty">Nog geen favorieten. Klik op de ster bij een champion om hem hier op te slaan.</div>'}`;
}

/* ---------- Champion detail ---------- */
async function renderChamp(app, [id, lane]) {
  const c = S.champs[id] || champByKey[nk(id)];
  if (!c) { app.innerHTML = '<div class="empty">Champion niet gevonden.</div>'; return; }
  const lanes = lanesOf(c); if (!lane || !LANES[lane]) lane = lanes[0] || 'MID';
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  let full = S.full[c.id];
  if (!full) {
    try { full = (await getJSON(`${CDN}/cdn/${S.ver}/data/${LOCALE}/champion/${c.id}.json`)).data[c.id]; S.full[c.id] = full; }
    catch (e) { full = null; }
  }
  if (location.hash.indexOf(c.id) < 0) return; // gebruiker is alweer weg
  const B = buildFor(c, lane), A = B.A;
  const setup = B.runes[Math.min(S.ui.setup, B.runes.length - 1)];
  const spellSet = B.spells[Math.min(S.ui.spell, B.spells.length - 1)] || [];
  const { good, bad } = matchups(c, lane);
  const skins = full?.skins || [{ num: 0, name: 'default' }];
  const prio = full ? skillPrio(full) : [];

  const runeTile = (x, cls = '') => x.r
    ? `<div class="rune ${cls}" data-rune="${x.r.id}"><img src="${runeImg(x.r)}" alt="${esc(x.r.name)}"><span class="rn">${esc(x.r.name)}</span></div>`
    : `<div class="rune miss ${cls}"><img alt=""><span class="rn">${esc(x.missing)} <span class="mute">(niet in deze patch)</span></span></div>`;
  const SH = { AdaptiveForce: ['Adaptive Force', 'AdaptiveForce'], AttackSpeed: ['+10% Attack Speed', 'AttackSpeed'], AbilityHaste: ['+8 Ability Haste', 'CDRScaling'], MovementSpeed: ['+2% Movement Speed', 'MovementSpeed'], HealthScaling: ['+Health (schaalt met level)', 'HealthScaling'], Health: ['+65 HP', 'Health'], Tenacity: ['Tenacity & Slow Resist', 'Tenacity'] };
  const shardTile = k => { const [n, f] = SH[k] || [k, k]; return `<div class="rune shard"><img src="${CDN}/cdn/img/perk-images/StatMods/StatMods${f}Icon.png" alt="" onerror="this.style.visibility='hidden'"><span class="rn">${esc(n)}</span></div>`; };

  app.innerHTML = `
  <div class="champ-hero"><div class="bg" id="chBg" style="background-image:url('${splash(c.id, 0)}')"></div>
    <div class="in"><img class="ic" src="${portrait(c)}" alt="">
      <div style="flex:1"><h1>${esc(c.name)}</h1><div class="sub">${esc(c.title)}</div>
      <div class="pills">${c.tags.map(t => `<span class="chip gold">${TAG_NL[t] || t}</span>`).join('')}${lanes.map(l => `<a class="chip" href="#/champ/${c.id}/${l}">${LANES[l].icon} ${LANES[l].label}</a>`).join('')}${diffBar(c.info.difficulty)}</div></div>
      <div class="row"><button class="btn" data-fav="${c.id}">${isFav(c.id) ? '★ Favoriet' : '☆ Favoriet'}</button></div></div></div>

  <div class="tabs">${(lanes.length ? lanes : [lane]).map(l => `<a class="tab ${l === lane ? 'on' : ''}" href="#/champ/${c.id}/${l}">${LANES[l].icon} Build voor ${LANES[l].label}</a>`).join('')}</div>

  <div class="cols"><div>
    <div class="panel"><h2>${esc(A.label)} ${dmgChip(A)}</h2><p>${esc(A.desc)}</p><p><b>Win-conditie:</b> ${esc(A.win)}</p>
      <div class="tag-title">Power spikes</div><div class="pills">${A.spikes.map(s => `<span class="chip gold">${esc(s)}</span>`).join('')}</div></div>

    ${dataPanel(c, lane)}

    <div class="panel"><h2>Runes</h2>
      <div class="setup-tabs">${B.runes.map((r, i) => `<button class="tab ${r === setup ? 'on' : ''}" data-setup="${i}">${esc(r.name)}</button>`).join('')}</div>
      <p class="mute">${esc(setup.note)}</p>
      <div class="runes">
        <div class="rcol"><div class="tag-title">${esc(setup.primaryTree?.name || 'Primair')}</div>${runeTile(setup.keystone, 'key')}${setup.primaryRunes.map(r => runeTile(r)).join('')}</div>
        <div class="rcol"><div class="tag-title">${esc(setup.secTree?.name || 'Secundair')}</div>${setup.secRunes.map(r => runeTile(r)).join('')}</div>
        <div class="rcol"><div class="tag-title">Stat shards</div>${setup.shards.map(shardTile).join('')}</div>
      </div></div>

    <div class="panel"><h2>Items</h2>
      <div class="tag-title">Start</div>${itemRow([...B.start, ...B.ward])}
      <div class="tag-title">Laarzen</div>${itemRow(B.boots)}
      <div class="tag-title">Core build (eerste 3)</div>${itemRow(B.core, true)}
      <div class="tag-title">Alternatieven / later</div>${itemRow(B.alt)}
      <div class="tag-title">Situationeel</div>
      <div class="cols2">
        <div><b>Vs. veel AD / armor nodig</b>${itemRow(B.sit.armor)}</div>
        <div><b>Vs. veel AP / MR nodig</b>${itemRow(B.sit.mr)}</div>
        <div><b>Anti-heal</b>${itemRow(B.sit.antiheal)}</div>
        <div><b>Penetratie vs. tanks</b>${itemRow(B.sit.pen)}</div>
        <div><b>Defensief / laatste item</b>${itemRow(B.sit.defensive)}</div>
      </div>
      <div class="row" style="margin-top:14px"><button class="btn primary" id="dlSet">⬇ Item set (.json) voor League client</button><button class="btn" id="cpBuild">⧉ Kopieer build als tekst</button></div>
      <p class="mute" style="font-size:.8rem">Plaats het bestand in <code>…\\League of Legends\\Config\\Champions\\${esc(c.id)}\\Recommended\\</code> en maak de map aan indien nodig.</p></div>

    <div class="panel"><h2>Skill-volgorde</h2>${full ? `
      <div class="skillrow"><div class="skill" title="${esc(full.passive.name)}"><img src="${CDN}/cdn/${S.ver}/img/passive/${full.passive.image.full}"><b>P</b></div>
      ${full.spells.map((s, i) => `<div class="skill" title="${esc(s.name)}"><img src="${CDN}/cdn/${S.ver}/img/spell/${s.image.full}"><b>${'QWER'[i]}</b></div>`).join('')}</div>
      <p><b>Suggestie max-volgorde:</b> ${prio.join(' › ')} (R altijd op level 6/11/16). Start met de skill die het beste bij je lane past.</p>
      <p class="mute" style="font-size:.8rem">Heuristiek: de skill met de laagste cooldown wordt eerst gemaxt. Controleer op het laatst of je champion-specifieke guides anders aanraden.</p>
      <div class="cols2"><div><b>P – ${esc(full.passive.name)}</b><div class="mute" style="font-size:.85rem">${esc(tr(`champ.${c.id}.P`, plain(full.passive.description)))}</div></div>${full.spells.map((s, i) => `<div><b>${'QWER'[i]} – ${esc(s.name)}</b><div class="mute" style="font-size:.85rem">${esc(tr(`champ.${c.id}.${'QWER'[i]}`, plain(s.description)))}</div><div style="font-size:.78rem" class="mute">CD: ${esc(s.cooldownBurn)} · Kost: ${esc(s.costBurn)}</div></div>`).join('')}</div>` : '<p class="mute">Kon de spelgegevens niet laden.</p>'}</div>

    ${full ? `<div class="panel cols2"><div><h3>Speel als ${esc(c.name)}</h3><ul class="list">${(full.allytips || []).map((t, n) => `<li>${esc(tr(`champ.${c.id}.a${n}`, t))}</li>`).join('') || '<li class="mute">–</li>'}</ul></div>
      <div><h3>Speel tegen ${esc(c.name)}</h3><ul class="list">${(full.enemytips || []).map((t, n) => `<li>${esc(tr(`champ.${c.id}.e${n}`, t))}</li>`).join('') || '<li class="mute">–</li>'}</ul></div></div>` : ''}
  </div>

  <div>
    <div class="panel"><h3>Summoner spells</h3>
      <div class="setup-tabs">${B.spells.map((p, i) => `<button class="tab ${p === spellSet ? 'on' : ''}" data-spell="${i}">${p.map(s => esc(s.name)).join(' + ')}</button>`).join('')}</div>
      <div class="spellset">${spellSet.map(s => `<div class="spell" title="${esc(s.name)}: ${esc(tr('spell.' + s.key, plain(s.description)))}"><img src="${CDN}/cdn/${S.ver}/img/spell/${s.image.full}"><span>${esc(s.name)}</span></div>`).join('')}</div></div>

    <div class="panel"><h3>Stats</h3>
      ${[['Aanval', c.info.attack], ['Defense', c.info.defense], ['Magie', c.info.magic], ['Moeilijkheid', c.info.difficulty]].map(([n, v]) => `<div class="row" style="justify-content:space-between"><span>${n}</span>${diffBar(v)}</div>`).join('')}
      <hr style="border-color:var(--line)"><div class="mute" style="font-size:.85rem">HP ${c.stats.hp} (+${c.stats.hpperlevel}) · Armor ${c.stats.armor} · MR ${c.stats.spellblock}<br>AD ${c.stats.attackdamage} · Bereik ${c.stats.attackrange} · MS ${c.stats.movespeed}</div></div>

    <div class="panel"><h3>Laning-tips</h3><ul class="list">${A.laning.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>

    <div class="panel"><h3>Sterk tegen (${LANES[lane].label})</h3><div class="mu good">${good.map(r => `<a href="#/champ/${r.o.id}/${lane}" title="${esc(r.why.join('; '))}"><img src="${portrait(r.o)}">${esc(r.o.name)}</a>`).join('') || '<span class="mute">–</span>'}</div>
      <h3 style="margin-top:14px">Lastig tegen</h3><div class="mu bad">${bad.map(r => `<a href="#/champ/${r.o.id}/${lane}" title="${esc(r.why.join('; '))}"><img src="${portrait(r.o)}">${esc(r.o.name)}</a>`).join('') || '<span class="mute">–</span>'}</div>
      <p class="mute" style="font-size:.78rem;margin-top:10px">Indicatief op basis van klasse en bereik, niet op echte matchup-data.</p></div>

    ${full ? `<div class="panel"><h3>Skins</h3><div class="setup-tabs">${skins.slice(0, 14).map(s => `<button class="tab" data-skin="${s.num}">${esc(s.name === 'default' ? 'Standaard' : s.name)}</button>`).join('')}</div></div>` : ''}
  </div></div>`;

  /* handlers specifiek voor deze pagina */
  $$('[data-setup]').forEach(b => b.onclick = () => { S.ui.setup = +b.dataset.setup; renderChamp(app, [id, lane]); });
  $$('[data-spell]').forEach(b => b.onclick = () => { S.ui.spell = +b.dataset.spell; renderChamp(app, [id, lane]); });
  $$('[data-skin]').forEach(b => b.onclick = () => { $('#chBg').style.backgroundImage = `url('${splash(c.id, b.dataset.skin)}')`; window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#dlSet').onclick = () => downloadItemSet(c, lane, B);
  $('#cpBuild').onclick = () => copyBuild(c, lane, B, setup, spellSet, prio);
}

function downloadItemSet(c, lane, B) {
  const blk = (type, arr) => ({ type, items: arr.filter(Boolean).map(i => ({ id: String(i.id), count: 1 })) });
  const set = {
    title: `RiftCompanion ${c.name} ${LANES[lane].label}`, type: 'custom', map: 'SR', mode: 'CLASSIC', priority: false, sortrank: 0,
    blocks: [blk('Start', [...B.start, ...B.ward]), blk('Boots', B.boots), blk('Core build', B.core), blk('Alternatieven', B.alt),
      blk('Vs. AD', B.sit.armor), blk('Vs. AP', B.sit.mr), blk('Anti-heal', B.sit.antiheal), blk('Penetratie', B.sit.pen), blk('Defensief', B.sit.defensive)].filter(b => b.items.length),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(set, null, 2)], { type: 'application/json' }));
  a.download = `${c.id}_${lane}_RiftCompanion.json`; a.click(); URL.revokeObjectURL(a.href);
  toast('Item set gedownload');
}
async function copyBuild(c, lane, B, setup, spells, prio) {
  const n = a => a.map(i => i.name).join(' → ');
  const rn = x => x.r ? x.r.name : x.missing;
  const txt = `${c.name} – ${LANES[lane].label} (${B.A.label})\nSpells: ${spells.map(s => s.name).join(' + ')}\nRunes: ${setup.keystone.r?.name || setup.key} | ${setup.primaryRunes.map(rn).join(', ')} | ${setup.secRunes.map(rn).join(', ')}\nStart: ${n(B.start)}\nLaarzen: ${n(B.boots.slice(0, 2))}\nCore: ${n(B.core)}\nSkill max: ${prio.join(' > ')}\nVs AD: ${n(B.sit.armor)}\nVs AP: ${n(B.sit.mr)}\nAnti-heal: ${n(B.sit.antiheal)}`;
  try { await navigator.clipboard.writeText(txt); toast('Build gekopieerd'); } catch { openModal(`<h3>Kopieer handmatig</h3><pre class="pre">${esc(txt)}</pre>`); }
}

/* ---------- Counter picker ---------- */
function renderCounter(app, [lane = 'MID', enemyId]) {
  if (!LANES[lane]) lane = 'MID';
  app.innerHTML = `<h1>Counter picker</h1><p class="mute">Kies de lane en de vijandelijke champion; je krijgt de meest geschikte tegenstanders in die lane.</p>
  <div class="tabs">${Object.entries(LANES).map(([k, l]) => `<a class="tab ${k === lane ? 'on' : ''}" href="#/counter/${k}${enemyId ? '/' + enemyId : ''}">${l.icon} ${l.label}</a>`).join('')}</div>
  <div class="toolbar"><input class="field" list="champNames" id="enemy" placeholder="Vijandelijke champion…" style="min-width:260px" value="${esc(S.champs[enemyId]?.name || '')}"><button class="btn primary" id="goCounter">Zoek counters</button></div>
  <datalist id="champNames">${S.champList.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist><div id="cres"></div>`;
  const go = () => { const c = findChampByName($('#enemy').value); if (c) location.hash = `#/counter/${lane}/${c.id}`; else toast('Champion niet gevonden'); };
  $('#goCounter').onclick = go; $('#enemy').addEventListener('keydown', e => e.key === 'Enter' && go());
  $('#enemy').addEventListener('change', go);
  const enemy = S.champs[enemyId]; if (!enemy) { $('#cres').innerHTML = '<div class="empty">Kies een champion om te beginnen.</div>'; return; }
  const rows = lanePool(lane).filter(c => c.id !== enemy.id).map(c => ({ c, ...duel(c, enemy, lane) })).sort((a, b) => b.s - a.s || a.c.info.difficulty - b.c.info.difficulty);
  const best = rows.slice(0, 12), worst = rows.slice(-6).reverse();
  const eA = ARCHETYPES[archFor(enemy, lane)];
  $('#cres').innerHTML = `<div class="panel"><div class="row"><img src="${portrait(enemy)}" width="56" height="56" style="border-radius:12px"><div><h2 style="margin:0">${esc(enemy.name)} <span class="chip">${esc(eA.label)}</span></h2><span class="mute">${esc(enemy.title)}</span></div><a class="btn" style="margin-left:auto" href="#/champ/${enemy.id}/${lane}">Zijn build</a></div></div>
   <h2>Beste counters in ${LANES[lane].label}</h2><div class="grid">${best.map(r => counterCard(r, lane)).join('')}</div>
   <h2 style="margin-top:20px">Vermijd (lastig tegen ${esc(enemy.name)})</h2><div class="grid">${worst.map(r => counterCard(r, lane)).join('')}</div>`;
}
function counterCard(r, lane) {
  const c = r.c;
  return `<a class="card" href="#/champ/${c.id}/${lane}"><div class="portrait" style="background-image:url('${loading(c.id)}')"></div><div class="body"><span class="nm">${esc(c.name)}</span><span class="chip ${r.s > 0 ? 'gold' : ''}">${r.s > 0 ? '+' : ''}${r.s.toFixed(1)}</span><span class="mute" style="font-size:.75rem">${esc(r.why.join('; ') || 'neutraal')}</span>${diffBar(c.info.difficulty)}</div></a>`;
}
function findChampByName(n) {
  const k = nk(n); return S.champList.find(c => nk(c.name) === k || nk(c.id) === k);
}

/* ---------- Team builder ---------- */
const teamState = { TOP: '', JUNGLE: '', MID: '', ADC: '', SUPPORT: '' };
function renderTeam(app) {
  app.innerHTML = `<h1>Team builder</h1><p class="mute">Vul je (verwachte) team in en krijg een analyse van schadebalans, frontline, engage en win-conditie.</p>
  <datalist id="champNames">${S.champList.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>
  <div class="pickrow">${Object.entries(LANES).map(([k, l]) => { const c = findChampByName(teamState[k]); return `<div class="slot"><h4>${l.icon} ${l.label}</h4>${c ? `<img src="${portrait(c)}">` : ''}<input class="field" list="champNames" data-slot="${k}" placeholder="Champion…" value="${esc(c ? c.name : teamState[k])}" style="width:100%"></div>`; }).join('')}</div>
  <div class="row" style="margin:12px 0"><button class="btn" id="tClear">Leegmaken</button></div><div id="tres"></div>`;
  $$('[data-slot]').forEach(inp => inp.addEventListener('change', () => { teamState[inp.dataset.slot] = inp.value; renderTeam(app); }));
  $('#tClear').onclick = () => { Object.keys(teamState).forEach(k => teamState[k] = ''); renderTeam(app); };
  analyseTeam($('#tres'));
}
function analyseTeam(out) {
  const picks = Object.entries(teamState).map(([lane, n]) => ({ lane, c: findChampByName(n) })).filter(p => p.c);
  if (picks.length < 2) { out.innerHTML = '<div class="empty">Kies minstens 2 champions voor een analyse.</div>'; return; }
  const W = { marksman: 1.2, mage: 1.2, mageSupport: .7, apAssassin: 1, adAssassin: 1, fighter: .8, critSkirmisher: 1, apFighter: .8, tank: .3, engage: .3, enchanter: .15 };
  let wsum = 0, ad = 0; const cls = { marksman: 0, mage: 0, assassin: 0, fighter: 0, tank: 0, enchanter: 0 }; let ranged = 0, tanks = 0, easy = 0;
  picks.forEach(({ lane, c }) => {
    const ak = archFor(c, lane), A = ARCHETYPES[ak], w = W[ak] || .5; wsum += w;
    ad += w * (A.dmg === 'ad' ? 1 : A.dmg === 'ap' ? 0 : c.info.attack / (c.info.attack + c.info.magic + 1));
    cls[ARCH_CLASS[ak]]++; if (c.stats.attackrange >= 450) ranged++; if (['tank', 'engage'].includes(ak)) tanks++;
    if (c.info.difficulty <= 4) easy++;
  });
  const adP = Math.round(100 * ad / wsum), apP = 100 - adP;
  const msgs = [];
  const bad = t => msgs.push(`<div class="warn">⚠ ${t}</div>`), good = t => msgs.push(`<div class="ok">✔ ${t}</div>`);
  if (adP > 75) bad(`Zwaar AD (${adP}%): de vijand kan armor stapelen. Overweeg een AP-damage dealer.`);
  else if (apP > 75) bad(`Zwaar AP (${apP}%): de vijand kan MR stapelen. Overweeg een AD-damage dealer.`);
  else good(`Mooie balans AD/AP (${adP}% / ${apP}%).`);
  if (picks.length >= 4) {
    if (cls.tank + cls.fighter === 0) bad('Geen frontline: je team valt snel uiteen in een teamfight.'); else good('Voldoende frontline aanwezig.');
    if (cls.tank === 0) bad('Geen echte engage/CC-tank: moeilijk om fights te starten.');
    if (cls.marksman === 0) bad('Geen marksman: weinig sustained DPS tegen tanks en objectives (Baron/Drakes).');
    if (cls.assassin >= 3) bad('Te veel assassins: vaak weinig front-to-back schade.');
    if (cls.mage + cls.marksman === 0) bad('Weinig schade: er is geen echte damage dealer.');
    if (cls.enchanter) good('Peel/enchanter aanwezig: je carry’s kunnen veilig doorspelen.');
  }
  let ident = 'Flexibel / mix';
  if (cls.assassin >= 2) ident = 'Dive / Pick-comp – vang carry’s voordat ze kunnen vechten.';
  else if (tanks >= 2 && cls.marksman) ident = 'Engage / teamfight – start en laat je carry’s schade maken.';
  else if (cls.mage >= 2 && ranged >= 3) ident = 'Poke / Siege – sloop torens van afstand en eis objectives.';
  else if (cls.marksman && cls.enchanter) ident = 'Protect the carry – bescherm je ADC en win door schalen.';
  else if (cls.fighter >= 3) ident = 'Skirmish / split-push – forceer 1v1’s over de hele map.';
  const sug = [];
  const need = cls.tank + cls.fighter === 0 ? 'tank' : cls.marksman === 0 ? 'marksman' : (adP > 70 ? 'mage' : apP > 70 ? 'fighter' : '');
  const sugList = need ? S.champList.filter(c => !picks.some(p => p.c.id === c.id) && ARCH_CLASS[archFor(c, lanesOf(c)[0] || 'MID')] === need).sort((a, b) => a.info.difficulty - b.info.difficulty).slice(0, 8) : [];
  out.innerHTML = `<div class="cols"><div class="panel"><h2>Analyse</h2>${msgs.join('') || '<p class="mute">Geen opmerkingen.</p>'}<p><b>Teamidentiteit:</b> ${esc(ident)}</p></div>
  <div class="panel"><h3>Schadeverdeling</h3><div class="bar"><i class="ad" style="width:${adP}%"></i><i class="ap" style="width:${apP}%"></i></div><div class="row" style="justify-content:space-between"><span class="chip ad">AD ${adP}%</span><span class="chip ap">AP ${apP}%</span></div>
  <div class="tag-title">Samenstelling</div><div class="pills">${Object.entries(cls).filter(([, v]) => v).map(([k, v]) => `<span class="chip gold">${v}× ${k}</span>`).join('')}</div>
  ${sugList.length ? `<div class="tag-title">Suggesties (${need})</div><div class="mu">${sugList.map(c => `<a href="#/champ/${c.id}"><img src="${portrait(c)}">${esc(c.name)}</a>`).join('')}</div>` : ''}</div></div>`;
}

/* ---------- Item browser ---------- */
const itemFilter = { q: '', tag: '', tier: 'done' };
function renderItems(app) {
  app.innerHTML = `<h1>Items</h1><div class="toolbar"><input id="iq" placeholder="Zoek item…" value="${esc(itemFilter.q)}">
  <select id="it"><option value="">Alle stats</option>${ITEM_FILTERS.map(([k, l]) => `<option value="${k}" ${itemFilter.tag === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
  <select id="itier"><option value="done">Afgerond (legendarisch)</option><option value="boots">Laarzen</option><option value="basic">Basis & epische</option><option value="starter">Starters & consumables</option><option value="all">Alles</option></select><span class="mute" id="ic"></span></div>
  <div class="grid" id="ig" style="grid-template-columns:repeat(auto-fill,minmax(88px,1fr))"></div>`;
  $('#itier').value = itemFilter.tier;
  const sr = Object.values(S.items).filter(i => i.maps && i.maps['11'] && i.gold?.purchasable !== false && i.inStore !== false);
  const update = () => {
    itemFilter.q = $('#iq').value; itemFilter.tag = $('#it').value; itemFilter.tier = $('#itier').value;
    let l = sr;
    const done = i => !i.into || !i.into.length;
    if (itemFilter.tier === 'done') l = completed;
    else if (itemFilter.tier === 'boots') l = sr.filter(i => (i.tags || []).includes('Boots'));
    else if (itemFilter.tier === 'basic') l = sr.filter(i => !done(i) && (i.gold.total || 0) > 450 && !(i.tags || []).includes('Boots'));
    else if (itemFilter.tier === 'starter') l = sr.filter(i => (i.gold.total || 0) <= 500 || (i.tags || []).some(t => ['Consumable', 'Trinket'].includes(t)));
    if (itemFilter.q) l = l.filter(i => i.name.toLowerCase().includes(itemFilter.q.toLowerCase()) || tr('item.' + i.id + '.p', plain(i.plaintext)).toLowerCase().includes(itemFilter.q.toLowerCase()));
    if (itemFilter.tag) l = l.filter(i => (i.tags || []).includes(itemFilter.tag));
    l = [...l].sort((a, b) => (b.gold.total || 0) - (a.gold.total || 0));
    $('#ig').innerHTML = l.map(i => `<div class="it" style="width:auto" data-item="${i.id}" title="${esc(i.name)}"><img src="${itemImg(i)}" loading="lazy" alt=""><small>${esc(i.name)}<br>${i.gold.total}g</small></div>`).join('');
    $('#ic').textContent = `${l.length} items`;
  };
  ['iq', 'it', 'itier'].forEach(id => $('#' + id).addEventListener('input', update)); update();
}
function itemModal(id) {
  const i = S.items[id]; if (!i) return;
  const from = (i.from || []).map(x => S.items[x]).filter(Boolean), into = (i.into || []).map(x => S.items[x]).filter(i2 => i2 && i2.maps?.['11']);
  const stats = Object.entries(i.stats || {}).map(([k, v]) => `${STAT_LABELS[k] || k}: ${v < 1 && v > 0 ? Math.round(v * 100) + '%' : v}`);
  openModal(`<div class="row"><img src="${itemImg(i)}" width="64" height="64" style="border-radius:10px;border:2px solid var(--gold)"><div><h2 style="margin:0">${esc(i.name)}</h2><span class="chip gold">${i.gold.total}g</span> <span class="chip">Verkoopwaarde ${i.gold.sell}g</span></div></div>
  <p class="mute">${esc(tr('item.' + i.id + '.p', plain(i.plaintext)))}</p>${stats.length ? `<div class="pills">${stats.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>` : ''}
  <pre class="pre" style="margin-top:12px">${esc(tr('item.' + i.id + '.d', plain(i.description)))}</pre>
  ${from.length ? `<div class="tag-title">Bestaat uit</div>${itemRow(from)}` : ''}${into.length ? `<div class="tag-title">Wordt</div>${itemRow(into)}` : ''}
  <div class="tag-title">Tags</div><div class="pills">${(i.tags || []).map(t => `<span class="chip">${esc(ITEM_FILTERS.find(f => f[0] === t)?.[1] || t)}</span>`).join('')}</div>`);
}

/* ---------- Rune browser ---------- */
function renderRunes(app) {
  app.innerHTML = `<h1>Runes</h1><p class="mute">Alle runes van de huidige patch. Klik voor details.</p>` + S.runes.map(t => `
  <div class="rt-tree"><div class="row"><img src="${runeImg(t)}" width="40" height="40"><h3 style="margin:0">${esc(t.name)}</h3></div>
  ${t.slots.map((s, si) => `<div class="rt-row">${s.runes.map(r => `<div class="rt-r" data-rune="${r.id}"><img src="${runeImg(r)}" alt="" loading="lazy"><div><b>${esc(r.name)}${si === 0 ? ' ★' : ''}</b><small>${esc(tr('rune.' + r.id + '.s', plain(r.shortDesc)).slice(0, 140))}</small></div></div>`).join('')}</div>`).join('')}</div>`).join('');
}
function runeModal(id) {
  for (const t of S.runes) for (const s of t.slots) for (const r of s.runes) if (String(r.id) === String(id)) {
    openModal(`<div class="row"><img src="${runeImg(r)}" width="64" height="64"><div><h2 style="margin:0">${esc(r.name)}</h2><span class="chip gold">${esc(t.name)}</span></div></div><pre class="pre" style="margin-top:12px">${esc(tr('rune.' + r.id + '.l', plain(r.longDesc)))}</pre>`); return;
  }
}

/* ---------- Globale events ---------- */
document.addEventListener('click', e => {
  const fav = e.target.closest('[data-fav]');
  if (fav) { e.preventDefault(); e.stopPropagation(); toggleFav(fav.dataset.fav); if (fav.classList.contains('btn')) fav.textContent = isFav(fav.dataset.fav) ? '★ Favoriet' : '☆ Favoriet'; else fav.classList.toggle('on', isFav(fav.dataset.fav)); return; }
  const it = e.target.closest('[data-item]'); if (it) { itemModal(it.dataset.item); return; }
  const ru = e.target.closest('[data-rune]'); if (ru) { runeModal(ru.dataset.rune); return; }
  if (e.target.id === 'modal' || e.target.id === 'modalClose') closeModal();
  if (!e.target.closest('.search')) $('#gresults').hidden = true;
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); $('#gsearch').focus(); }
});
$('#gsearch').addEventListener('input', () => {
  const q = $('#gsearch').value.trim().toLowerCase(), box = $('#gresults');
  if (!q) { box.hidden = true; return; }
  const l = S.champList.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8);
  box.innerHTML = l.map(c => `<a href="#/champ/${c.id}"><img src="${portrait(c)}"><span>${esc(c.name)}<br><small class="mute">${lanesOf(c).map(x => LANES[x].label).join(' · ')}</small></span></a>`).join('') || '<div class="empty" style="padding:14px">Niets gevonden</div>';
  box.hidden = false;
});
$('#gsearch').addEventListener('keydown', e => { if (e.key === 'Enter') { const a = $('#gresults a'); if (a) { location.href = a.href; $('#gresults').hidden = true; $('#gsearch').blur(); } } });
$('#gresults').addEventListener('click', () => { $('#gresults').hidden = true; $('#gsearch').value = ''; });
window.addEventListener('hashchange', route);

/* ---------- start ---------- */
loadAll().then(route).catch(err => {
  console.error(err);
  $('#app').innerHTML = `<div class="panel warn"><h2>Kon de Riot-data niet laden</h2><p>${esc(err.message)}</p><p>Controleer je internetverbinding (Data Dragon: ddragon.leagueoflegends.com) en ververs de pagina.</p></div>`;
  $('#verBadge').textContent = 'offline';
});
