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
  $('#footPatch').textContent = 'Gamedata: patch ' + S.ver + (S.stats ? ` · ${S.stats.meta.matches.toLocaleString('nl-NL')} geanalyseerde games` : '');
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
    <div class="pills"><span class="chip gold">${st.g} games</span><span class="chip">${st.wr.toFixed(1)}% win rate</span><span class="chip">${st.pr.toFixed(1)}% pick rate</span>${(() => { const d = dmgData(c.id, lane); return d ? `<span class="chip ad">⚔ ${Math.round(d.min)} schade/min (${k0(d.game)} per game)</span><span class="chip">🛡 ${Math.round(d.takenMin)} genomen/min</span>` : ''; })()}</div>
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
    <div class="ct">${dmgChip(A)}<span class="chip">${esc(A.label.split('(')[0].trim())}</span></div>${statLine}${lane ? `<div class="ct">${badges(c, lane)}</div>` : ''}${diffBar(c.info.difficulty)}</div></a>`;
}

function itemTile(i, label) {
  if (!i) return '';
  return `<div class="it" data-item="${i.id}" title="${esc(i.name)} – ${i.gold.total}g"><img src="${itemImg(i)}" alt="${esc(i.name)}" loading="lazy"><small>${esc(label || i.name)}</small></div>`;
}
const itemRow = (arr, sep = false) => `<div class="items">${arr.map((i, idx) => (sep && idx ? '<span class="arrow">›</span>' : '') + itemTile(i)).join('') || '<span class="mute">Geen items gevonden voor deze patch.</span>'}</div>`;

/* ---------- routes ---------- */
const routes = {
  home: renderHome, lane: renderLane, champions: renderChampions, champ: renderChamp, counter: renderCounter,
  team: renderTeam, items: renderItems, runes: renderRunes, favs: renderFavs, stats: renderStats, spelers: renderPlayers, advies: renderAdvice, leren: renderLearn, over: renderAbout, privacy: renderPrivacy, voorwaarden: renderTerms, contact: renderContact,
};

/* ---------- Gedeelde helpers (ook in de GitHub Pages-versie) ---------- */
const QNAME = { 420: 'Ranked Solo', 440: 'Ranked Flex', 400: 'Normal', 430: 'Blind', 450: 'ARAM', 480: 'Swiftplay', 490: 'Quickplay', 1700: 'Arena', 700: 'Clash' };
const champByNum = n => S.champList.find(c => c.key === String(n));
const fmtAgo = ts => { const h = (Date.now() - ts) / 36e5; return h < 1 ? 'zojuist' : h < 24 ? Math.round(h) + 'u geleden' : Math.round(h / 24) + 'd geleden'; };
const avg = (a, f) => a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : 0;
const k1 = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : Math.round(n);

/* aggregeer een lijst matches tot gemiddelden */
function aggregate(list) {
  const mins = m => m.dur / 60;
  return {
    g: list.length, w: list.filter(m => m.win).length,
    kda: list.reduce((s, m) => s + m.k + m.a, 0) / Math.max(1, list.reduce((s, m) => s + m.d, 0)),
    k: avg(list, m => m.k), d: avg(list, m => m.d), a: avg(list, m => m.a),
    dmg: avg(list, m => m.dmg), dpm: avg(list, m => m.dmg / mins(m)), taken: avg(list, m => m.taken || 0),
    cspm: avg(list, m => m.cs / mins(m)), vpm: avg(list, m => (m.vision || 0) / mins(m)), kp: avg(list, m => m.kp || 0) * 100,
    gold: avg(list, m => (m.gold || 0) / mins(m)), dur: avg(list, mins),
  };
}

/* ---------- Leer-modus: een champion echt leren spelen ---------- */
const LSTEPS = [['know', 'Ken je champion', '🧭'], ['skills', 'Leer je skills', '🎯'], ['setup', 'Je setup', '🛠'], ['combos', "Combo's", '⚡'], ['lane', 'De laningfase', '⚔️'], ['mid', 'Midgame & teamfights', '🛡'], ['practice', 'Oefenen', '🏋️'], ['quiz', 'Test jezelf', '✅']];
const learnStore = {
  load() { try { return JSON.parse(localStorage.getItem('rc_learn') || '{}'); } catch { return {}; } },
  save(o) { try { localStorage.setItem('rc_learn', JSON.stringify(o)); } catch { } },
};
const learnKey = (id, lane) => `${id}|${lane}`;
function learnProgress(rec) { const d = rec?.steps || {}; return LSTEPS.filter(([k]) => d[k]).length; }
const ringHtml = (done, total, size = 84) => { const r = 34, C = 2 * Math.PI * r, f = C * (1 - done / total);
  return `<svg class="ring" viewBox="0 0 84 84" width="${size}" height="${size}"><circle cx="42" cy="42" r="${r}" fill="none" stroke="#ffffff1c" stroke-width="7"/><circle class="rf" cx="42" cy="42" r="${r}" fill="none" stroke="url(#rg)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${f.toFixed(1)}" transform="rotate(-90 42 42)"/><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#0ac8b9"/><stop offset="1" stop-color="#c8aa6e"/></linearGradient></defs><text x="42" y="47" text-anchor="middle" fill="#fff" font-family="Georgia,serif" font-size="19">${done}/${total}</text></svg>`; };
const learnLevel = d => d >= 8 ? '🏆 Klaar voor ranked' : d >= 5 ? 'Gevorderd' : d >= 2 ? 'Op weg' : 'Beginner';

function renderLearn(app, [id, lane]) { if (!id) return learnHome(app); return learnChamp(app, id, lane); }

function learnHome(app) {
  const store = learnStore.load();
  const started = Object.entries(store).map(([k, rec]) => { const [cid, ln] = k.split('|'); return { c: S.champs[cid], ln, rec }; }).filter(x => x.c && LANES[x.ln]);
  const easy = Object.keys(LANES).map(l => ({ l, list: lanePool(l, false).filter(c => c.info.difficulty <= 3).slice(0, 4) }));
  app.innerHTML = `<section class="learn-hero"><span class="pill"><span class="dot"></span>Leer-modus</span>
    <h1>Leer een champion <span class="shimmer">echt</span> spelen</h1>
    <p class="lead">Een stappenplan van kennismaking tot ranked-klaar: skills, setup, combo's, de laningfase, teamfights, oefenopdrachten en een beslissingsquiz. Je voortgang wordt bewaard en je kunt je eigen games vergelijken met richtwaarden.</p>
    <form class="hero-search" id="lForm" style="max-width:640px"><input id="lInput" list="lNames" placeholder="Welke champion wil je leren?" aria-label="Champion" autocomplete="off"><button class="btn primary">Start</button></form>
    <datalist id="lNames">${S.champList.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist></section>
  ${started.length ? `<h2>Jouw leertrajecten</h2><div class="lgrid">${started.map(({ c, ln, rec }) => { const d = learnProgress(rec); return `<a class="lcard" href="#/leren/${c.id}/${ln}"><img src="${portrait(c)}" alt=""><div><b>${esc(c.name)}</b><small>${LANES[ln].icon} ${LANES[ln].label} · ${learnLevel(d)}</small><div class="pbar"><i style="width:${100 * d / 8}%"></i></div></div><span class="mute">${d}/8</span></a>`; }).join('')}</div>` : ''}
  <h2>Begin met een makkelijke champion</h2><p class="mute">Champions met een lage moeilijkheid, ideaal om de basis te leren.</p>
  ${easy.map(({ l, list }) => `<h3>${LANES[l].icon} ${LANES[l].label}</h3><div class="lgrid">${list.map(c => `<a class="lcard" href="#/leren/${c.id}/${l}"><img src="${portrait(c)}" alt=""><div><b>${esc(c.name)}</b><small>${esc(c.title)}</small></div>${diffBar(c.info.difficulty)}</a>`).join('')}</div>`).join('')}
  <h2>Zo werkt het</h2><div class="steps-grid">${LSTEPS.map(([k, t, ic], i) => `<div class="panel"><div style="font-size:1.6rem">${ic}</div><b>${i + 1}. ${t}</b></div>`).join('')}</div>`;
  const go = e => { e.preventDefault(); const c = findChampByName($('#lInput').value); if (c) location.hash = `#/leren/${c.id}/${lanesOf(c)[0] || 'MID'}`; else toast('Champion niet gevonden'); };
  $('#lForm').addEventListener('submit', go); $('#lInput').addEventListener('change', go);
}

async function learnChamp(app, id, lane) {
  const c = S.champs[id] || champByKey[nk(id)];
  if (!c) { app.innerHTML = '<div class="empty">Champion niet gevonden.</div>'; return; }
  const lanes = lanesOf(c); if (!lane || !LANES[lane]) lane = lanes[0] || 'MID';
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  let full = S.full[c.id];
  if (!full) { try { full = (await getJSON(`${CDN}/cdn/${S.ver}/data/${LOCALE}/champion/${c.id}.json`)).data[c.id]; S.full[c.id] = full; } catch { full = null; } }
  if (location.hash.indexOf(c.id) < 0) return;
  document.title = `Leer ${c.name} spelen (${LANES[lane].label}) | Rift Companion`;
  const L = window.RC_LEARN || { lane: {}, arch: {}, champs: {}, quiz: {}, quizGroup: {}, bench: {} };
  const B = buildFor(c, lane), A = B.A, ak = B.archKey, grp = L.quizGroup[ak] || 'fighter', G = L.champs[c.id] || {}, AR = L.arch[grp] || L.arch.fighter || {};
  const prio = full ? skillPrio(full) : [], store = learnStore.load(), key = learnKey(c.id, lane), rec = store[key] || (store[key] = { steps: {}, drills: {}, quiz: null });
  const setup = B.runes[0], spellSet = B.spells[0] || [], { good, bad } = matchups(c, lane), h = hpStats(c);
  const tags = full ? [...new Set([full.passive, ...full.spells].flatMap(s => skillTags(plain(s.description)).map(t => t[0])))] : [];
  const strengths = [], weak = [];
  if (hpRating(c) >= 4) strengths.push('Veel health (taai)'); if (dmgRating(c, lane) >= 4) strengths.push('Veel schade'); if (h.rng >= 500) strengths.push('Groot aanvalsbereik'); if (c.info.difficulty <= 3) strengths.push('Makkelijk te leren');
  if (h.ms >= 345) strengths.push('Snel'); if (tags.includes('CC')) strengths.push('Heeft crowd control'); if (tags.includes('Mobiliteit')) strengths.push('Heeft mobiliteit');
  if (hpRating(c) <= 2) weak.push('Weinig health (kwetsbaar)'); if (h.rng < 200) weak.push('Moet dichtbij komen'); if (c.info.difficulty >= 7) weak.push('Moeilijk te beheersen'); if (full && !tags.includes('Mobiliteit')) weak.push('Weinig ontsnappingsmiddelen'); if (dmgRating(c, lane) <= 2) weak.push('Weinig eigen schade');
  const li = a => `<ul class="list">${(a || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  const runeIcon = x => x.r ? `<img class="ri" src="${runeImg(x.r)}" alt="${esc(x.r.name)}" title="${esc(x.r.name)}" data-rune="${x.r.id}">` : '';
  const combos = window.RC_COMBOS?.[c.id] || [], bench = L.bench[lane] || {};

  /* persoonlijke voortgang uit echte games */
  const players = window.RC_FRIENDS?.players || [];
  const personal = who => {
    const P = players.find(p => p.account.name === who); if (!P) return '';
    const M = P.matches.filter(m => m.champ === c.id).slice(0, 20);
    if (M.length < 3) return `<p class="mute">${esc(who)} heeft nog te weinig games op ${esc(c.name)} in de data (${M.length}).</p>`;
    const T = aggregate(M), half = Math.floor(M.length / 2), newer = aggregate(M.slice(0, half)), older = aggregate(M.slice(half));
    const row = (label, v, goal, fmt, higher) => { const ok = higher ? v >= goal : v <= goal; return `<tr><td>${label}</td><td><b>${fmt(v)}</b></td><td class="mute">${higher ? '≥' : '≤'} ${fmt(goal)}</td><td class="${ok ? 'upc' : 'downc'}">${ok ? '✔ op koers' : '✖ nog te verbeteren'}</td></tr>`; };
    const arrow = (a, b, hi = true) => Math.abs(a - b) < .05 * Math.max(1, Math.abs(b)) ? '→' : (a > b) === hi ? '▲' : '▼';
    return `<p class="mute">Laatste ${M.length} games van <b>${esc(who)}</b> op ${esc(c.name)}: ${T.w}W ${T.g - T.w}L (${(100 * T.w / T.g).toFixed(0)}%).</p>
      <table class="tbl"><thead><tr><th>Maatstaf</th><th>Jij</th><th>Richtwaarde</th><th></th></tr></thead><tbody>
      ${lane === 'SUPPORT' ? '' : row('CS per minuut', T.cspm, bench.cspm, v => v.toFixed(1), true)}${row('Deaths per game', T.d, bench.deaths, v => v.toFixed(1), false)}${row('Kill participation', T.kp, bench.kp, v => v.toFixed(0) + '%', true)}${row('Vision per minuut', T.vpm, bench.vpm, v => v.toFixed(2), true)}</tbody></table>
      <p class="mute" style="font-size:.84rem">Trend (nieuwste ${half} t.o.v. oudere games): deaths ${arrow(newer.d, older.d, false)} ${newer.d.toFixed(1)} vs ${older.d.toFixed(1)} · KDA ${arrow(newer.kda, older.kda)} ${newer.kda.toFixed(2)} vs ${older.kda.toFixed(2)} · win rate ${arrow(newer.w / Math.max(1, newer.g), older.w / Math.max(1, older.g))} ${(100 * newer.w / Math.max(1, newer.g)).toFixed(0)}% vs ${(100 * older.w / Math.max(1, older.g)).toFixed(0)}%</p>`;
  };
  const whoSel = players.length ? `<div class="row" style="gap:8px;margin:8px 0"><label class="mute" for="lWho">Vergelijk met de games van:</label><select id="lWho" class="field"><option value="">– kies een speler –</option>${players.map(p => `<option ${rec.who === p.account.name ? 'selected' : ''}>${esc(p.account.name)}</option>`).join('')}</select></div><div id="lPersonal">${rec.who ? personal(rec.who) : '<p class="mute">Kies een speler om zijn echte games op deze champion met de richtwaarden te vergelijken.</p>'}</div>` : '<p class="mute">Geen spelersdata beschikbaar voor een persoonlijke vergelijking.</p>';

  /* quiz */
  const Q = L.quiz[grp] || [];
  const quizHtml = Q.length ? Q.map((q, i) => `<div class="qz" data-qi="${i}"><p><b>${i + 1}. ${esc(q.q)}</b></p>${q.o.map((o, j) => `<label class="qopt"><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join('')}<div class="qx" hidden></div></div>`).join('') + `<div class="row" style="margin-top:10px"><button class="btn primary" id="qCheck">Controleer mijn antwoorden</button><span id="qScore" class="mute">${rec.quiz ? `Beste score: ${rec.quiz.best}/${rec.quiz.total}` : ''}</span></div>` : '<p class="mute">Voor deze klasse is er nog geen quiz.</p>';

  const body = {
    know: `<p><b>${esc(A.label)}</b> — ${esc(A.desc)}</p>${G.intro ? `<p>${esc(G.intro)}</p>` : ''}<p><b>Win-conditie:</b> ${esc(A.win)}</p>
      <div class="tag-title">Power spikes</div><div class="pills">${A.spikes.map(s => `<span class="chip gold">${esc(s)}</span>`).join('')}</div>
      <div class="cols2" style="margin-top:12px"><div><div class="tag-title">Sterke punten</div><div class="pills">${strengths.map(s => `<span class="chip tg-def">${esc(s)}</span>`).join('') || '<span class="mute">–</span>'}</div></div>
      <div><div class="tag-title">Aandachtspunten</div><div class="pills">${weak.map(s => `<span class="chip tg-cc">${esc(s)}</span>`).join('') || '<span class="mute">–</span>'}</div></div></div>
      ${full?.allytips?.length ? `<div class="tag-title">Tips van Riot</div>${li(full.allytips.map((t, n) => tr(`champ.${c.id}.a${n}`, t)))}` : ''}`,
    skills: full ? `<p>Maximaliseer eerst <b>${prio[0]}</b>, dan <b>${prio[1]}</b> en daarna <b>${prio[2]}</b>. Neem je ultimate op level 6, 11 en 16.</p>${skillScheduleHtml(full, prio)}
      <div class="tag-title">Wat doet elke skill?</div><div class="skcards">${[['P', full.passive.name, plain(full.passive.description), `champ.${c.id}.P`, `${CDN}/cdn/${S.ver}/img/passive/${full.passive.image.full}`, ''], ...full.spells.map((s, i) => ['QWER'[i], s.name, plain(s.description), `champ.${c.id}.${'QWER'[i]}`, `${CDN}/cdn/${S.ver}/img/spell/${s.image.full}`, s.cooldownBurn])].map(([k, n, d, kk, img, cd]) => `
      <div class="skcard"><div class="row" style="gap:10px"><div class="skill"><img src="${img}" alt=""><b>${k}</b></div><div><b>${esc(n)}</b><div class="pills" style="margin:3px 0 0">${skillTags(d).map(([t, cl]) => `<span class="chip tg-${cl}">${t}</span>`).join('')}</div></div></div><p class="mute" style="font-size:.86rem;margin:8px 0 2px">${esc(tr(kk, d))}</p>${cd ? `<small class="mute">Cooldown ${esc(cd)} s</small>` : ''}</div>`).join('')}</div>
      <p class="mute" style="font-size:.84rem">Oefenopdracht: noem uit je hoofd bij elke skill wat hij doet en wanneer je hem gebruikt voordat je verdergaat.</p>` : '<p class="mute">Kon de spelgegevens niet laden.</p>',
    setup: `<div class="row" style="gap:18px;align-items:flex-start;flex-wrap:wrap"><div><div class="tag-title">Runes (${esc(setup.name)})</div><div class="row" style="gap:6px">${runeIcon(setup.keystone)}${setup.primaryRunes.map(runeIcon).join('')}<span class="arrow">|</span>${setup.secRunes.map(runeIcon).join('')}</div></div>
      <div><div class="tag-title">Summoner spells</div><div class="row" style="gap:6px">${spellSet.map(s => `<img class="ri" src="${CDN}/cdn/${S.ver}/img/spell/${s.image.full}" alt="${esc(s.name)}" title="${esc(s.name)}">`).join('')}</div></div></div>
      <div class="tag-title">Start</div>${itemRow([...B.start, ...B.ward])}<div class="tag-title">Laarzen</div>${itemRow(B.boots.slice(0, 2))}<div class="tag-title">Core build</div>${itemRow(B.core, true)}
      <p style="margin-top:12px"><a class="btn" href="#/champ/${c.id}/${lane}">Alle opties op de build-pagina →</a></p>`,
    combos: (combos.length ? combos.map(x => `<div class="combo"><b>${esc(x.n)}</b><div class="row" style="gap:6px;margin:6px 0">${comboSeq(x.k, full)}</div><div class="mute" style="font-size:.88rem">${esc(x.t)}</div></div>`).join('') : `<p class="mute">Voor ${esc(c.name)} staat er nog geen vaste combo. Algemene aanpak:</p>${li(window.RC_COMBO_TIPS?.[ak])}`) + `<div class="learnnote">🎮 <b>Oefenopdracht:</b> ga naar de Practice Tool en voer elke combo 10 keer foutloos uit voordat je hem in een echte game gebruikt.</div>`,
    lane: `<div class="tag-title">Algemeen voor ${LANES[lane].label}</div>${li(L.lane[lane])}<div class="tag-title">Voor jouw soort champion</div>${li(AR.early)}${G.early ? `<div class="tag-title">Specifiek voor ${esc(c.name)}</div>${li(G.early)}` : ''}
      <div class="cols2"><div><div class="tag-title">Sterk tegen</div><div class="pills">${good.slice(0, 6).map(r => `<a class="chip tg-def" href="#/champ/${r.o.id}/${lane}">${esc(r.o.name)}</a>`).join('') || '–'}</div></div><div><div class="tag-title">Lastig tegen</div><div class="pills">${bad.slice(0, 6).map(r => `<a class="chip tg-cc" href="#/champ/${r.o.id}/${lane}">${esc(r.o.name)}</a>`).join('') || '–'}</div></div></div>
      <p class="mute" style="font-size:.8rem">Matchups zijn indicatief (op klasse en bereik gebaseerd). Zoek een specifieke tegenstander in de <a href="#/counter/${lane}">counter picker</a>.</p>`,
    mid: `<div class="tag-title">Midgame</div>${li(AR.mid)}<div class="tag-title">In een teamfight</div>${li(AR.fight)}${G.mastery ? `<div class="tag-title">Specifiek voor ${esc(c.name)}</div>${li(G.mastery)}` : ''}<div class="tag-title">Veelgemaakte fouten</div>${li([...(G.mistakes || []), ...(AR.mistakes || [])])}`,
    practice: `<p>Oefen in de <b>Practice Tool</b> (Aangepast spel → Practice Tool). Vink af wat je gedaan hebt.</p>
      <div class="drills">${[...(AR.drills || []), ...(combos.length ? ['Voer je combo 10 keer foutloos uit.'] : [])].map((d, i) => `<label class="qopt"><input type="checkbox" data-drill="${i}" ${rec.drills[i] ? 'checked' : ''}> ${esc(d)}</label>`).join('')}</div>
      <div class="tag-title">Doelen voor je eerste 10 games</div>${li([lane === 'SUPPORT' ? 'Plaats minstens 1 control ward per recall.' : `Haal ongeveer ${Math.round(bench.cspm * 10)} CS op minuut 10.`, `Ga niet vaker dan ${bench.deaths} keer dood per game.`, 'Bekijk na elke game één dood en noteer wat je anders had kunnen doen.', 'Speel dezelfde champion minstens 10 games achter elkaar voordat je oordeelt.'])}
      <div class="tag-title">Hoe sta je ervoor?</div>${whoSel}`,
    quiz: `<p>Drie korte vragen over beslissingen die bij een ${esc(A.label.split('(')[0].trim().toLowerCase())} horen. Je haalt de stap bij 2 van de 3 goed.</p>${quizHtml}`,
  };

  const done = learnProgress(rec), firstOpen = (LSTEPS.find(([k]) => !rec.steps[k]) || LSTEPS[0])[0];
  app.innerHTML = `
  <section class="ch-hero small"><div class="ch-bg" style="background-image:url('${splash(c.id, 0)}')"></div><div class="ch-shade"></div>
    <div class="ch-in"><nav class="crumbs"><a href="#/leren">Leren</a> › ${esc(c.name)}</nav>
      <div class="ch-row"><img class="ch-ic" src="${portrait(c)}" alt=""><div class="ch-title"><h1>Leer ${esc(c.name)}</h1><div class="sub">${LANES[lane].icon} ${LANES[lane].label} · ${esc(c.title)}</div></div>
        <div class="ch-actions"><div id="lRing">${ringHtml(done, 8, 92)}</div><div><b id="lLevel" style="color:#fff">${learnLevel(done)}</b><div class="mute" style="font-size:.8rem">voortgang wordt in je browser bewaard</div></div><a class="btn" href="#/champ/${c.id}/${lane}">Naar de build →</a></div></div></div></section>
  <div class="ch-lanes">${lanes.map(l => `<a class="tab ${l === lane ? 'on' : ''}" href="#/leren/${c.id}/${l}">${LANES[l].icon} ${LANES[l].label}</a>`).join('')}</div>
  <div class="lsteps">${LSTEPS.map(([k, t, ic], i) => `<section class="lstep ${k === firstOpen ? 'open' : ''}" data-step="${k}"><header class="lhead" role="button" tabindex="0" aria-expanded="${k === firstOpen}"><span class="ln">${i + 1}</span><b>${ic} ${t}</b><label class="ldone" title="Markeer als klaar"><input type="checkbox" data-done="${k}" ${rec.steps[k] ? 'checked' : ''}><span>klaar</span></label><span class="chev">▾</span></header><div class="lbody"><div class="lin">${body[k]}</div></div></section>`).join('')}</div>`;

  const persist = () => { const s = learnStore.load(); s[key] = rec; learnStore.save(s); const d = learnProgress(rec); $('#lRing').innerHTML = ringHtml(d, 8, 92); $('#lLevel').textContent = learnLevel(d); };
  $$('.lhead').forEach(hd => { const tg = e => { if (e.target.closest('.ldone')) return; const sec = hd.parentElement, o = !sec.classList.contains('open'); sec.classList.toggle('open', o); hd.setAttribute('aria-expanded', String(o)); }; hd.addEventListener('click', tg); hd.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(e); } }); });
  $$('[data-done]').forEach(cb => cb.addEventListener('change', () => { rec.steps[cb.dataset.done] = cb.checked; persist(); }));
  $$('[data-drill]').forEach(cb => cb.addEventListener('change', () => { rec.drills[cb.dataset.drill] = cb.checked; persist(); }));
  $('#lWho')?.addEventListener('change', e => { rec.who = e.target.value; persist(); $('#lPersonal').innerHTML = rec.who ? personal(rec.who) : ''; });
  $('#qCheck')?.addEventListener('click', () => {
    let ok = 0; $$('.qz').forEach(z => { const q = Q[+z.dataset.qi], sel = z.querySelector('input:checked'), good = sel && +sel.value === q.a; if (good) ok++;
      const x = $('.qx', z); x.hidden = false; x.className = 'qx ' + (good ? 'ok' : 'warn'); x.innerHTML = (good ? '✔ Goed! ' : sel ? '✖ Niet helemaal. ' : 'Kies eerst een antwoord. ') + esc(q.x) + (good ? '' : ` <b>Juist antwoord:</b> ${esc(q.o[q.a])}`); });
    rec.quiz = { best: Math.max(ok, rec.quiz?.best || 0), total: Q.length }; if (ok >= Math.ceil(Q.length * .6)) { rec.steps.quiz = true; const cb = $('[data-done="quiz"]'); if (cb) cb.checked = true; }
    $('#qScore').textContent = `Score: ${ok}/${Q.length}`; persist();
  });
}

const PAGE_TITLES = { home: 'Rift Companion – League of Legends champions, runes, items en advies', advies: 'Champion-advies: wat moet ik spelen?', leren: 'Leer een champion spelen', lane: 'Tierlist en champions per lane', champions: 'Alle League of Legends champions', counter: 'Counter picker', team: 'Team builder met win rate-schatting', stats: 'Champion-statistieken: health, schade en win rate', items: 'Alle items', runes: 'Alle runes', favs: 'Favorieten', spelers: 'Spelers', me: 'Mijn account', over: 'Over ons', privacy: 'Privacybeleid', voorwaarden: 'Gebruiksvoorwaarden', contact: 'Contact' };
function setPageMeta(name, parts) {
  let t = PAGE_TITLES[name] || PAGE_TITLES.home;
  if (name === 'lane' && LANES[parts[1]]) t = `Tierlist ${LANES[parts[1]].label}: beste champions en win rates`;
  document.title = name === 'home' || !PAGE_TITLES[name] ? PAGE_TITLES.home : `${t} | Rift Companion`;
}
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const name = parts[0] || 'home';
  $$('#nav a[data-r]').forEach(a => a.classList.toggle('on', a.dataset.r === name));
  $('#ddBtn')?.classList.toggle('on', !!$('#ddMenu a.on'));
  $('#nav').classList.remove('open'); $('#ddMenu').classList.remove('open'); $('#navToggle').setAttribute('aria-expanded', 'false');
  setPageMeta(name, parts);
  const fn = routes[name] || renderHome;
  const app = $('#app');
  try { fn(app, parts.slice(1)); } catch (e) { console.error(e); app.innerHTML = `<div class="panel warn">Er ging iets mis: ${esc(e.message)}</div>`; }
  window.scrollTo(0, 0);
  window.RC_FX?.onRoute(name);
}

/* ---------- Spelers: vergelijking van vaste accounts (momentopname uit friends.js, gemaakt met snapshot.js) ---------- */
const playersUi = { queue: 'all', n: 0 };
function renderPlayers(app) {
  const F = window.RC_FRIENDS;
  if (!F || !F.players?.length) { app.innerHTML = '<h1>👥 Spelers</h1><div class="empty">Nog geen spelersdata. Draai <code>node snapshot.js</code> (met een geldige key in <code>.env</code>).</div>'; return; }
  const when = new Date(F.generated).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
  const qs = {}; F.players.forEach(p => p.matches.forEach(m => qs[m.queue] = (qs[m.queue] || 0) + 1));
  const qOpts = [['all', 'Alle queues'], ...Object.entries(qs).sort((a, b) => b[1] - a[1]).map(([q, n]) => [q, `${QNAME[q] || 'Queue ' + q} (${n})`])];
  if (!qOpts.some(([q]) => q === playersUi.queue)) playersUi.queue = 'all';
  app.innerHTML = `<h1>👥 Spelers</h1><p class="mute">Vergelijking van ${F.players.length} accounts op basis van hun laatste games. Momentopname van <b>${esc(when)}</b>.</p>
  <div class="toolbar"><select id="pq">${qOpts.map(([q, l]) => `<option value="${q}" ${q === playersUi.queue ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
  <select id="pn">${[[0, 'Alle games'], [20, 'Laatste 20 games'], [30, 'Laatste 30 games'], [50, 'Laatste 50 games'], [75, 'Laatste 75 games']].map(([n, l]) => `<option value="${n}" ${n === playersUi.n ? 'selected' : ''}>${l}</option>`).join('')}</select>
  <span class="mute">het aantal geldt per speler, na het queue-filter</span></div><div id="pbody"></div>`;
  const draw = () => { playersUi.queue = $('#pq').value; playersUi.n = +$('#pn').value; $('#pbody').innerHTML = playersHtml(F.players, playersUi.queue, playersUi.n); };
  $('#pq').addEventListener('input', draw); $('#pn').addEventListener('input', draw); draw();
}

function playersHtmlBase(players, queue, limit = 0) {
  const rk = r => r ? `<b>${r.tier} ${r.rank}</b> · ${r.lp} LP <span class="mute">(${r.wins}W ${r.losses}L)</span>` : '<span class="mute">Geen rank</span>';
  const data = players.map(p => {
    let M = p.matches.filter(m => queue === 'all' || String(m.queue) === queue);
    if (limit > 0) M = M.slice(0, limit); // matches staan van nieuw naar oud
    const T = aggregate(M);
    const byC = {}, byL = {};
    M.forEach(m => { (byC[m.champ] = byC[m.champ] || []).push(m); if (m.lane) (byL[m.lane] = byL[m.lane] || []).push(m); });
    return { p, M, T, byC, byL, wr: M.length ? 100 * T.w / T.g : 0 };
  });
  const METRICS = [['Games', d => d.T.g, v => v, 1], ['Win rate', d => d.wr, v => v.toFixed(0) + '%', 1], ['KDA', d => d.T.kda, v => v.toFixed(2), 1], ['Deaths per game', d => d.T.d, v => v.toFixed(1), -1],
    ['Schade per minuut', d => d.T.dpm, v => Math.round(v), 1], ['Schade per game', d => d.T.dmg, v => k1(v), 1], ['Schade genomen / game', d => d.T.taken, v => k1(v), 0],
    ['CS per minuut', d => d.T.cspm, v => v.toFixed(1), 1], ['Vision per minuut', d => d.T.vpm, v => v.toFixed(2), 1], ['Kill participation', d => d.T.kp, v => v.toFixed(0) + '%', 1], ['Goud per minuut', d => d.T.gold, v => Math.round(v), 1]];
  const best = {};
  METRICS.forEach(([l, f, , dir]) => { if (!dir) return; const vals = data.filter(d => d.M.length >= 3).map(d => f(d) * dir); if (vals.length > 1) { const m = Math.max(...vals); best[l] = data.findIndex(d => d.M.length >= 3 && f(d) * dir === m); } });
  const card = d => {
    const { p, M, T } = d, form = [...M].slice(0, 20).reverse().map(m => `<i title="${esc(m.champ)} ${m.k}/${m.d}/${m.a} – ${m.win ? 'Win' : 'Loss'}" style="display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:2px;background:${m.win ? 'var(--green)' : 'var(--red)'}"></i>`).join('');
    const solo = p.ranks.find(r => r.queue === 'RANKED_SOLO_5x5'), flex = p.ranks.find(r => r.queue === 'RANKED_FLEX_SR');
    const top = Object.entries(d.byC).sort((a, b) => b[1].length - a[1].length).slice(0, 5);
    const mainLane = Object.entries(d.byL).sort((a, b) => b[1].length - a[1].length)[0];
    return `<div class="panel"><div class="row"><img src="${CDN}/cdn/${S.ver}/img/profileicon/${p.summoner.icon}.png" width="56" height="56" style="border-radius:12px;border:2px solid var(--gold)" onerror="this.style.display='none'">
      <div><h2 style="margin:0">${esc(p.account.name)}<span class="mute">#${esc(p.account.tag)}</span></h2><span class="chip">Level ${p.summoner.level || '?'}</span> ${mainLane ? `<span class="chip gold">${LANES[mainLane[0]].icon} ${LANES[mainLane[0]].label}</span>` : ''}</div></div>
      <div class="tag-title">Solo/Duo</div>${rk(solo)}<div class="tag-title">Flex</div>${rk(flex)}
      <div class="tag-title">Vorm (laatste ${Math.min(20, M.length)}, oud → nieuw)</div>${form || '<span class="mute">–</span>'}
      <div class="tag-title">Meest gespeeld</div>${top.map(([id, l]) => { const c = S.champs[id] || champByNum(l[0].champId), a = aggregate(l);
        return `<div class="row" style="justify-content:space-between;padding:2px 0"><span>${c ? `<a href="#/champ/${c.id}/${l[0].lane || lanesOf(c)[0]}"><img src="${portrait(c)}" width="24" height="24" style="border-radius:50%;vertical-align:middle"> ${esc(c.name)}</a>` : esc(id)}</span><span class="mute" style="font-size:.8rem">${a.g}× · ${(100 * a.w / a.g).toFixed(0)}% · ${a.kda.toFixed(1)} KDA · ${k1(a.dmg)}</span></div>`; }).join('') || '<span class="mute">–</span>'}
      <div class="tag-title">Top mastery</div><div class="mu">${p.mastery.slice(0, 4).map(m => { const c = champByNum(m.champId); return c ? `<a href="#/champ/${c.id}/${lanesOf(c)[0]}"><img src="${portrait(c)}">${esc(c.name)} · ${(m.points / 1000).toFixed(0)}k</a>` : ''; }).join('')}</div></div>`;
  };
  /* gedeelde champions */
  const shared = {}; data.forEach((d, i) => Object.entries(d.byC).forEach(([id, l]) => { (shared[id] = shared[id] || {})[i] = aggregate(l); }));
  const sharedRows = Object.entries(shared).filter(([, o]) => Object.keys(o).length >= 2).sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length || Object.values(b[1]).reduce((s, x) => s + x.g, 0) - Object.values(a[1]).reduce((s, x) => s + x.g, 0)).slice(0, 8);
  /* conclusies */
  const facts = [];
  const lead = (label, f, dir = 1, min = 3, fmt = v => v.toFixed(1)) => { const c = data.filter(d => d.M.length >= min); if (c.length < 2) return; const b = c.reduce((x, y) => (f(y) * dir > f(x) * dir ? y : x)); facts.push(`<b>${label}:</b> ${esc(b.p.account.name)} (${fmt(f(b))})`); };
  lead('Hoogste win rate', d => d.wr, 1, 5, v => v.toFixed(0) + '%'); lead('Meeste schade per minuut', d => d.T.dpm, 1, 3, v => Math.round(v)); lead('Beste KDA', d => d.T.kda, 1, 3, v => v.toFixed(2));
  lead('Beste farm (CS/min)', d => d.T.cspm, 1, 3); lead('Meeste visie per minuut', d => d.T.vpm, 1, 3, v => v.toFixed(2)); lead('Minste deaths', d => d.T.d, -1, 3, v => v.toFixed(1) + ' per game'); lead('Hoogste kill participation', d => d.T.kp, 1, 3, v => v.toFixed(0) + '%');

  return `<div class="players">${data.map(card).join('')}</div>
  <div class="panel"><h2>Vergelijking</h2><div style="overflow:auto"><table class="tbl"><thead><tr><th>Statistiek</th>${data.map(d => `<th>${esc(d.p.account.name)}</th>`).join('')}</tr></thead><tbody>
  ${METRICS.map(([l, f, fmt]) => `<tr><td>${l}</td>${data.map((d, i) => `<td${best[l] === i ? ' style="color:var(--green);font-weight:700"' : ''}>${d.M.length ? fmt(f(d)) : '–'}${best[l] === i ? ' 👑' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="mute" style="font-size:.78rem">👑 = beste van de groep (alleen bij minstens 3 games; bij deaths telt laag als beter). Schade genomen is niet beoordeeld, omdat tanks dat bewust incasseren.</p></div>
  ${facts.length ? `<div class="panel"><h2>🧠 Wie is waar het beste in?</h2><ul class="list">${facts.map(f => `<li>${f}</li>`).join('')}</ul></div>` : ''}
  ${sharedRows.length ? `<div class="panel"><h2>Gedeelde champions</h2><div style="overflow:auto"><table class="tbl"><thead><tr><th>Champion</th>${data.map(d => `<th>${esc(d.p.account.name)}</th>`).join('')}</tr></thead><tbody>${sharedRows.map(([id, o]) => { const c = S.champs[id];
    return `<tr><td>${c ? `<a href="#/champ/${c.id}/${lanesOf(c)[0]}"><img src="${portrait(c)}" width="24" height="24" style="border-radius:50%;vertical-align:middle"> ${esc(c.name)}</a>` : esc(id)}</td>${data.map((d, i) => o[i] ? `<td>${o[i].g}× · ${(100 * o[i].w / o[i].g).toFixed(0)}% WR · ${o[i].kda.toFixed(1)} KDA</td>` : '<td class="mute">–</td>').join('')}</tr>`; }).join('')}</tbody></table></div></div>` : ''}`;
}

/* ---------- Advies: "Wat moet ik spelen?" met een paar simpele vragen ---------- */
const quiz = { lane: '', diff: '', style: '', dmg: '', tank: '', range: '', win: '', who: '', min: true };
const QUIZ = [
  { k: 'lane', q: 'Welke lane wil je spelen?', o: [['', 'Maakt niet uit'], ...Object.entries(LANES).map(([k, l]) => [k, `${l.icon} ${l.label}`])] },
  { k: 'diff', q: 'Hoe ervaren ben je met League?', o: [['', 'Maakt niet uit'], ['easy', 'Beginner – liever simpel'], ['mid', 'Gemiddeld'], ['hard', 'Ervaren – ik hou van uitdaging']] },
  { k: 'style', q: 'Wat is je speelstijl?', o: [['', 'Weet ik niet'], ['aggr', 'Agressief – ik zoek gevechten'], ['safe', 'Veilig – schade maken op afstand'], ['team', 'Teamspeler – anderen helpen en beschermen']] },
  { k: 'dmg', q: 'Welk type schade?', o: [['', 'Maakt niet uit'], ['ad', 'Fysiek (AD)'], ['ap', 'Magisch (AP)']] },
  { k: 'tank', q: 'Hoeveel health en taaiheid?', o: [['', 'Maakt niet uit'], ['tanky', 'Taai – veel health, ik kan incasseren'], ['squishy', 'Kwetsbaar maar veel schade']] },
  { k: 'range', q: 'Op welke afstand?', o: [['', 'Maakt niet uit'], ['melee', 'Dichtbij (melee)'], ['ranged', 'Op afstand (ranged)']] },
  { k: 'win', q: 'Hoe wil je winnen?', o: [['', 'Maakt niet uit'], ['early', 'Vroeg: snelle kills en tempo'], ['late', 'Laat: schalen en de game dragen'], ['fight', 'Teamfights'], ['solo', '1v1 en split push']] },
];
const Q_ARCH = {
  aggr: ['adAssassin', 'apAssassin', 'fighter', 'critSkirmisher', 'engage', 'apFighter'], safe: ['marksman', 'mage', 'mageSupport', 'enchanter'], team: ['enchanter', 'engage', 'tank', 'mageSupport'],
  early: ['adAssassin', 'apAssassin', 'fighter', 'engage'], late: ['marksman', 'mage', 'critSkirmisher'], fight: ['tank', 'engage', 'mage', 'apFighter', 'marksman'], solo: ['fighter', 'critSkirmisher', 'apFighter'],
};
const Q_TXT = { aggr: 'past bij agressief spel', safe: 'veilig spel op afstand', team: 'goed voor je team', early: 'sterk vroeg in het spel', late: 'schaalt goed naar de late game', fight: 'sterk in teamfights', solo: 'sterk in 1v1 en split push' };

function scoreAdvice(c, lane) {
  const ak = archFor(c, lane), A = ARCHETYPES[ak], h = hpRating(c), dr = dmgRating(c, lane), why = []; let s = 0;
  const add = (v, t) => { s += v; if (v > 0 && t) why.push(t); };
  if (lanesOf(c)[0] === lane) s += 1.5;
  if (quiz.diff === 'easy') { const d = c.info.difficulty; add(d <= 3 ? 4 : d <= 4 ? 3 : d <= 6 ? 0 : -4, d <= 4 ? 'makkelijk te leren' : ''); }
  if (quiz.diff === 'mid') { const d = c.info.difficulty; add(d >= 4 && d <= 6 ? 2 : d <= 3 ? 1 : d >= 8 ? -1 : 0, d >= 4 && d <= 6 ? 'gemiddelde moeilijkheid' : ''); }
  if (quiz.diff === 'hard') { const d = c.info.difficulty; add(d >= 7 ? 3 : d >= 5 ? 1 : -1, d >= 7 ? 'uitdagend, hoge skill ceiling' : ''); }
  if (quiz.style) add(Q_ARCH[quiz.style].includes(ak) ? 3 : -1, Q_TXT[quiz.style]);
  if (quiz.win) add(Q_ARCH[quiz.win].includes(ak) ? 3 : -1, Q_TXT[quiz.win]);
  if (quiz.dmg) { const t = A.dmg === 'ad' || A.dmg === 'ap' ? A.dmg : (c.info.magic > c.info.attack ? 'ap' : 'ad'), w = A.dmg === 'ad' || A.dmg === 'ap' ? 3 : 1.5; add(t === quiz.dmg ? w : -w, `${quiz.dmg === 'ad' ? 'fysieke' : 'magische'} schade`); }
  if (quiz.tank === 'tanky') add(h >= 4 ? 3 : h === 3 ? 1 : -2, h >= 4 ? 'veel health' : h === 3 ? 'redelijk veel health' : '');
  if (quiz.tank === 'squishy') add(dr >= 4 && h <= 3 ? 3 : dr <= 2 ? -2 : 0, dr >= 4 && h <= 3 ? 'veel schade, weinig health' : '');
  if (quiz.range === 'ranged') add(c.stats.attackrange >= 400 ? 3 : c.stats.attackrange < 300 ? -3 : 0, c.stats.attackrange >= 400 ? 'ranged' : '');
  if (quiz.range === 'melee') add(c.stats.attackrange < 300 ? 3 : c.stats.attackrange >= 400 ? -3 : 0, c.stats.attackrange < 300 ? 'melee' : '');
  const st = statOf(c.id, lane);
  if (S.stats && st && st.g >= MIN_GAMES) {
    add(st.tier === 'S' ? 2 : st.tier === 'A' ? 1 : st.tier === 'C' ? -1 : 0, st.tier === 'S' || st.tier === 'A' ? `${st.tier}-tier in de data (${st.wr.toFixed(0)}% WR)` : '');
    s += (shrunk(c.id, lane) - .5) * 15;
  }
  let mine = null;
  const P = window.RC_FRIENDS?.players?.find(p => p.account.name === quiz.who);
  if (P) {
    const ms = P.matches.filter(m => m.champ === c.id), g = ms.length, w = ms.filter(m => m.win).length;
    if (g >= 2) { s += Math.min(4, g / 4) + (100 * w / g - 50) / 25; mine = `${g}× gespeeld, ${(100 * w / g).toFixed(0)}% WR`; why.push(`jij speelt hem al (${mine})`); }
    if (P.mastery.slice(0, 10).some(m => String(m.champId) === c.key)) { s += 2; if (!mine) why.push('hoge mastery bij jou'); }
  }
  return { s, why };
}

function adviceList() {
  const lanes = quiz.lane ? [quiz.lane] : Object.keys(LANES), seen = {}, out = [];
  lanes.forEach(lane => lanePool(lane).forEach(c => {
    if (S.stats && quiz.min && (statOf(c.id, lane)?.g || 0) < MIN_GAMES) return;
    const r = scoreAdvice(c, lane); if (!seen[c.id] || r.s > seen[c.id].s) seen[c.id] = { c, lane, ...r };
  }));
  return Object.values(seen).sort((a, b) => b.s - a.s || a.c.info.difficulty - b.c.info.difficulty).slice(0, 10);
}

function renderAdvice(app) {
  const players = window.RC_FRIENDS?.players || [];
  const answered = QUIZ.filter(q => quiz[q.k]).length;
  const list = adviceList();
  app.innerHTML = `<h1>🎯 Wat moet ik spelen?</h1><p class="mute">Beantwoord een paar vragen (sla over wat je niet weet) en je krijgt direct een top 10. Het advies telt je antwoorden, de win rates uit de matchdata en optioneel wat jij al goed speelt.</p>
  <div class="panel">${QUIZ.map(q => `<div class="qrow"><div class="qq">${q.q}</div><div class="qopts">${q.o.map(([v, l]) => `<button class="tab ${quiz[q.k] === v ? 'on' : ''}" data-q="${q.k}|${v}">${esc(l)}</button>`).join('')}</div></div>`).join('')}
    ${players.length ? `<div class="qrow"><div class="qq">Voor wie? <span class="mute">(houdt rekening met wat die speler al speelt)</span></div><div class="qopts"><button class="tab ${!quiz.who ? 'on' : ''}" data-q="who|">Niemand specifiek</button>${players.map(p => `<button class="tab ${quiz.who === p.account.name ? 'on' : ''}" data-q="who|${esc(p.account.name)}">${esc(p.account.name)}</button>`).join('')}</div></div>` : ''}
    <div class="row" style="margin-top:8px"><button class="btn" id="qReset">Antwoorden wissen</button>${S.stats ? `<label class="mute"><input type="checkbox" id="qmin" ${quiz.min ? 'checked' : ''}> alleen champions met ≥ ${MIN_GAMES} games data</label>` : ''}</div></div>
  <h2>Jouw top ${list.length}</h2>${answered ? '' : '<p class="mute">Nog geen vragen beantwoord: dit is de algemene top. Kies hierboven wat bij je past.</p>'}
  <div class="advrow">${list.map((x, i) => { const st = statOf(x.c.id, x.lane);
    return `<a class="adv" href="#/champ/${x.c.id}/${x.lane}"><div class="rk">#${i + 1}</div><img src="${portrait(x.c)}" alt="">
      <div class="ab"><div class="row" style="gap:6px"><b>${esc(x.c.name)}</b><span class="chip gold">${LANES[x.lane].icon} ${LANES[x.lane].label}</span><span class="chip">${esc(ARCHETYPES[archFor(x.c, x.lane)].label.split('(')[0].trim())}</span>${diffBar(x.c.info.difficulty)}</div>
      <div class="pills" style="margin:4px 0">${badges(x.c, x.lane)}${st ? `<span class="chip">${st.wr.toFixed(0)}% WR · ${st.g} games</span>` : ''}</div>
      <div class="why2">${x.why.length ? x.why.slice(0, 5).map(w => `<span>✔ ${esc(w)}</span>`).join('') : '<span class="mute">algemene keuze voor deze lane</span>'}</div></div></a>`; }).join('') || '<div class="empty">Geen champions gevonden. Zet het vinkje voor datavereiste uit of pas je antwoorden aan.</div>'}</div>`;
  $$('[data-q]').forEach(b => b.onclick = () => { const [k, v] = b.dataset.q.split('|'); quiz[k] = v; const y = window.scrollY; renderAdvice(app); window.scrollTo(0, y); });
  $('#qReset').onclick = () => { Object.keys(quiz).forEach(k => k !== 'min' && (quiz[k] = '')); renderAdvice(app); };
  if ($('#qmin')) $('#qmin').onchange = e => { quiz.min = e.target.checked; const y = window.scrollY; renderAdvice(app); window.scrollTo(0, y); };
}

/* ---------- Spelers: extra analyses (samen spelen, matchups, speelstijl, eerste 15 minuten) ---------- */
function playersHtml(players, queue, limit = 0) { return playersHtmlBase(players, queue, limit) + playersExtra(players, queue, limit); }

function playersExtra(players, queue, limit) {
  const filt = p => { let M = p.matches.filter(m => queue === 'all' || String(m.queue) === queue); return M; };
  const data = players.map(p => { let M = filt(p); if (limit > 0) M = M.slice(0, limit); return { p, name: p.account.name, M, V: M.filter(m => m.v === 2), L: M.filter(m => m.tl) }; });
  return togetherHtml(players, filt) + styleHtml(data) + earlyHtml(data) + matchupsHtml(data);
}
const pct = (w, g) => g ? Math.round(100 * w / g) + '%' : '–';
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const per = (a, f) => a.length ? sum(a, f) / a.length : 0;

/* 1. samen spelen en tegen elkaar */
function togetherHtml(players, filt) {
  const rows = players.map(p => Object.fromEntries(filt(p).filter(m => m.team).map(m => [m.id, m])));
  const names = players.map(p => p.account.name);
  const byId = {}; rows.forEach((r, i) => Object.entries(r).forEach(([id, m]) => (byId[id] = byId[id] || {})[i] = m));
  const duo = {}, trio = { g: 0, w: 0, champs: {} }, vs = {}; let tg = 0;
  const together = players.map(() => ({ g: 0, w: 0 })), alone = players.map(() => ({ g: 0, w: 0 }));
  Object.values(byId).forEach(o => {
    const idx = Object.keys(o).map(Number);
    idx.forEach(i => { const mates = idx.some(j => j !== i && o[j].team === o[i].team); const b = mates ? together[i] : alone[i]; b.g++; if (o[i].win) b.w++; });
    for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) {
      const i = idx[a], j = idx[b], k = i + '-' + j;
      if (o[i].team === o[j].team) { const d = duo[k] = duo[k] || { i, j, g: 0, w: 0, kda: [0, 0, 0, 0], champs: {} }; d.g++; if (o[i].win) d.w++; d.kda[0] += o[i].k + o[i].a; d.kda[1] += o[i].d; d.kda[2] += o[j].k + o[j].a; d.kda[3] += o[j].d; const ck = o[i].champ + ' + ' + o[j].champ; d.champs[ck] = (d.champs[ck] || 0) + 1; }
      else { const v = vs[k] = vs[k] || { i, j, g: 0, wi: 0 }; v.g++; if (o[i].win) v.wi++; }
    }
    if (idx.length === 3 && idx.every(i => o[i].team === o[idx[0]].team)) { trio.g++; if (o[idx[0]].win) trio.w++; const ck = idx.map(i => o[i].champ).join(' + '); trio.champs[ck] = (trio.champs[ck] || 0) + 1; }
  });
  const top = c => Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  const duoRows = Object.values(duo).sort((a, b) => b.g - a.g);
  const noData = !rows.some(r => Object.keys(r).length);
  if (noData) return '';
  return `<h2 style="margin-top:24px">🤝 Samen spelen</h2>
  <div class="panel">${duoRows.length || trio.g ? `<div style="overflow:auto"><table class="tbl"><thead><tr><th>Samen</th><th>Games</th><th>Win rate</th><th>KDA (samen)</th><th>Meest gespeelde combinatie</th></tr></thead><tbody>
    ${duoRows.map(d => { const t = top(d.champs); return `<tr><td>${esc(names[d.i])} + ${esc(names[d.j])}</td><td>${d.g}</td><td>${pct(d.w, d.g)}</td><td>${(d.kda[0] / Math.max(1, d.kda[1])).toFixed(1)} / ${(d.kda[2] / Math.max(1, d.kda[3])).toFixed(1)}</td><td>${t ? esc(t[0]) + ` <span class="mute">(${t[1]}×)</span>` : '–'}</td></tr>`; }).join('')}
    ${trio.g ? `<tr><td><b>Alle drie</b></td><td>${trio.g}</td><td>${pct(trio.w, trio.g)}</td><td>–</td><td>${esc(top(trio.champs)[0])} <span class="mute">(${top(trio.champs)[1]}×)</span></td></tr>` : ''}</tbody></table></div>` : '<p class="mute">Geen games gevonden waarin twee van jullie in hetzelfde team zaten (binnen de gekozen queue).</p>'}
    <div class="tag-title">Samen of alleen: win rate per speler</div>
    <div class="pills">${players.map((p, i) => `<span class="chip">${esc(names[i])}: samen ${pct(together[i].w, together[i].g)} <span class="mute">(${together[i].g})</span> · alleen ${pct(alone[i].w, alone[i].g)} <span class="mute">(${alone[i].g})</span></span>`).join('')}</div>
    ${Object.keys(vs).length ? `<div class="tag-title">Tegen elkaar</div><div class="pills">${Object.values(vs).map(v => `<span class="chip">${esc(names[v.i])} ${v.wi}–${v.g - v.wi} ${esc(names[v.j])} <span class="mute">(${v.g} games)</span></span>`).join('')}</div>` : ''}
    <p class="mute" style="font-size:.78rem">Telt alleen games waarvan de teaminformatie is opgehaald (bij elke update komen er meer bij).</p></div>`;
}

/* 2. speelstijlprofiel */
function styleHtml(data) {
  if (!data.some(d => d.V.length >= 5)) return '';
  const S2 = data.map(d => { const V = d.V, n = V.length || 1, mins = sum(V, m => m.dur) / 60, dm = sum(V, m => m.dp + m.dm + m.dt) || 1;
    return { n: V.length, multi: sum(V, m => m.mk[0] + m.mk[1] * 2 + m.mk[2] * 3 + m.mk[3] * 4) / n, penta: sum(V, m => m.mk[3]), quadra: sum(V, m => m.mk[2]), solo: sum(V, m => m.solo) / n, fb: 100 * sum(V, m => m.fb) / n, ft: 100 * sum(V, m => m.ft) / n,
      dobj: per(V, m => m.dobj), dturr: per(V, m => m.dturr), tt: per(V, m => m.tt), wpm: sum(V, m => m.wp) / (mins || 1), cw: per(V, m => m.cw), wk: per(V, m => m.wk), dead: 100 * sum(V, m => m.dead) / (sum(V, m => m.dur) || 1),
      spree: per(V, m => m.spree), cct: per(V, m => m.cct), sk: per(V, m => m.sk), skd: per(V, m => m.skd), phys: 100 * sum(V, m => m.dp) / dm, mag: 100 * sum(V, m => m.dm) / dm, tru: 100 * sum(V, m => m.dt) / dm }; });
  const MET = [['Multikills per game (gewogen)', 'multi', v => v.toFixed(2), 1], ['Quadra / penta kills', null, (v, s) => `${s.quadra} / ${s.penta}`, 0], ['Solo kills per game', 'solo', v => v.toFixed(2), 1], ['First blood', 'fb', v => v.toFixed(0) + '%', 1], ['Eerste toren (kill/assist)', 'ft', v => v.toFixed(0) + '%', 1],
    ['Schade aan objectives / game', 'dobj', v => k1(v), 1], ['Schade aan torens / game', 'dturr', v => k1(v), 1], ['Torens gesloopt / game', 'tt', v => v.toFixed(2), 1],
    ['Wards geplaatst per minuut', 'wpm', v => v.toFixed(2), 1], ['Control wards gekocht / game', 'cw', v => v.toFixed(1), 1], ['Vijandelijke wards gedood / game', 'wk', v => v.toFixed(1), 1],
    ['Tijd dood (% van de game)', 'dead', v => v.toFixed(1) + '%', -1], ['Langste killing spree (gem.)', 'spree', v => v.toFixed(1), 1], ['Tijd CC op vijanden / game (s)', 'cct', v => Math.round(v), 1], ['Skillshots geraakt / ontweken', null, (v, s) => `${s.sk.toFixed(1)} / ${s.skd.toFixed(1)}`, 0]];
  const win = {}; MET.forEach(([l, k, , dir]) => { if (!k || !dir) return; const c = S2.filter(s => s.n >= 5); if (c.length < 2) return; const m = Math.max(...c.map(s => s[k] * dir)); win[l] = S2.findIndex(s => s.n >= 5 && s[k] * dir === m); });
  /* labels: wie is op een onderdeel duidelijk de uitschieter */
  const labels = data.map(() => []), lab = (k, dir, t) => { const c = S2.map((s, i) => [s, i]).filter(([s]) => s.n >= 5); if (c.length < 2) return; const vals = c.map(([s]) => s[k] * dir).sort((a, b) => b - a); if (vals[0] > 0 && vals[0] >= vals[1] * 1.15) labels[c.find(([s]) => s[k] * dir === vals[0])[1]].push(t); };
  lab('solo', 1, '⚔ Duelist (veel solo kills)'); lab('wpm', 1, '👁 Visiespeler'); lab('dobj', 1, '🏰 Objective-gericht'); lab('multi', 1, '💥 Multikill-jager'); lab('cct', 1, '🧊 CC-machine'); lab('dead', -1, '🛡 Blijft lang in leven'); lab('sk', 1, '🎯 Skillshot-speler');
  return `<h2 style="margin-top:24px">🎮 Speelstijl</h2><div class="panel"><div class="players" style="margin-bottom:8px">${data.map((d, i) => `<div><b>${esc(d.name)}</b> <span class="mute">(${S2[i].n} games met uitgebreide data)</span><div class="pills" style="margin-top:6px">${labels[i].map(t => `<span class="chip gold">${t}</span>`).join('') || '<span class="mute">geen duidelijke uitschieter</span>'}</div>
    <div class="tag-title">Schadeverdeling</div><div class="bar"><i class="ad" style="width:${S2[i].phys}%"></i><i class="ap" style="width:${S2[i].mag}%"></i><i style="width:${S2[i].tru}%;background:#ddd"></i></div><span class="mute" style="font-size:.78rem">fysiek ${S2[i].phys.toFixed(0)}% · magisch ${S2[i].mag.toFixed(0)}% · true ${S2[i].tru.toFixed(0)}%</span></div>`).join('')}</div>
  <div style="overflow:auto"><table class="tbl"><thead><tr><th>Statistiek</th>${data.map(d => `<th>${esc(d.name)}</th>`).join('')}</tr></thead><tbody>${MET.map(([l, k, fmt]) => `<tr><td>${l}</td>${S2.map((s, i) => `<td${win[l] === i ? ' style="color:var(--green);font-weight:700"' : ''}>${s.n >= 3 ? fmt(k ? s[k] : 0, s) : '–'}${win[l] === i ? ' 👑' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="mute" style="font-size:.78rem">Alleen games met uitgebreide gegevens. Tijd dood telt laag als beter. Het zijn gemiddelden over alle gekozen spelmodi; kies bovenaan één queue voor een eerlijkere vergelijking.</p></div>`;
}

/* 3. eerste 15 minuten (timeline) */
function earlyHtml(data) {
  if (!data.some(d => d.L.length >= 5)) return '';
  const E = data.map(d => { const L = d.L, has = k => L.filter(m => m.tl[k] != null), avgk = k => { const a = has(k); return a.length ? per(a, m => m.tl[k]) : null; };
    const ahead = has('gd15').filter(m => m.tl.gd15 > 0), behind = has('gd15').filter(m => m.tl.gd15 <= 0);
    return { n: L.length, g10: avgk('g10'), c10: avgk('c10'), g15: avgk('g15'), c15: avgk('c15'), gd10: avgk('gd10'), gd15: avgk('gd15'), cd10: avgk('cd10'), cd15: avgk('cd15'), xd15: avgk('xd15'),
      d10: per(L, m => m.tl.d10 || 0), k10: per(L, m => m.tl.k10 || 0), early: 100 * L.filter(m => (m.tl.d10 || 0) > 0).length / L.length, ahead, behind }; });
  const f = (v, d = 0, sign = false) => v == null ? '<span class="mute">–</span>' : (sign && v > 0 ? '+' : '') + v.toFixed(d);
  const colr = v => v == null ? '' : v > 0 ? 'color:var(--green)' : v < 0 ? 'color:var(--red)' : '';
  const R = [['Goud op minuut 10', e => f(e.g10)], ['CS op minuut 10', e => f(e.c10, 1)], ['Goud op minuut 15', e => f(e.g15)], ['CS op minuut 15', e => f(e.c15, 1)],
    ['Goudverschil met lane-tegenstander @10', e => `<span style="${colr(e.gd10)}">${f(e.gd10, 0, true)}</span>`], ['Goudverschil met lane-tegenstander @15', e => `<span style="${colr(e.gd15)}">${f(e.gd15, 0, true)}</span>`],
    ['CS-verschil @10', e => `<span style="${colr(e.cd10)}">${f(e.cd10, 1, true)}</span>`], ['CS-verschil @15', e => `<span style="${colr(e.cd15)}">${f(e.cd15, 1, true)}</span>`], ['XP-verschil @15', e => `<span style="${colr(e.xd15)}">${f(e.xd15, 0, true)}</span>`],
    ['Kills voor minuut 10 (gem.)', e => f(e.k10, 2)], ['Deaths voor minuut 10 (gem.)', e => f(e.d10, 2)], ['Games met een death voor minuut 10', e => e.early.toFixed(0) + '%']];
  const tips = data.map((d, i) => { const e = E[i]; if (e.ahead.length + e.behind.length < 5) return ''; const wa = 100 * e.ahead.filter(m => m.win).length / Math.max(1, e.ahead.length), wb = 100 * e.behind.filter(m => m.win).length / Math.max(1, e.behind.length);
    return `<li><b>${esc(d.name)}:</b> staat ${e.ahead.length}× voor op minuut 15 (${wa.toFixed(0)}% gewonnen) en ${e.behind.length}× achter (${wb.toFixed(0)}% gewonnen)${wa - wb >= 25 ? ' – het eerste kwartier bepaalt veel; een goede start is hier cruciaal' : wa - wb <= 10 ? ' – wint ook vaak als hij achter staat: sterke comebacks' : ''}.</li>`; }).filter(Boolean);
  return `<h2 style="margin-top:24px">⏱ De eerste 15 minuten</h2><div class="panel"><div style="overflow:auto"><table class="tbl"><thead><tr><th>Statistiek</th>${data.map((d, i) => `<th>${esc(d.name)} <span class="mute">(${E[i].n})</span></th>`).join('')}</tr></thead><tbody>
  ${R.map(([l, fn]) => `<tr><td>${l}</td>${E.map(e => `<td>${e.n >= 3 ? fn(e) : '–'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  ${tips.length ? `<ul class="list">${tips.join('')}</ul>` : ''}
  <p class="mute" style="font-size:.78rem">Uit de minuut-voor-minuut-timeline. De verschillen met de lane-tegenstander bestaan alleen voor games met een directe tegenstander in dezelfde lane (dus niet bij ARAM of Arena).</p></div>`;
}

/* 4. matchups tegen lane-tegenstanders */
function matchupsHtml(data) {
  if (!data.some(d => d.V.some(m => m.opp))) return '';
  const cards = data.map(d => {
    const O = d.V.filter(m => m.opp), by = {};
    O.forEach(m => { const b = by[m.opp.c] = by[m.opp.c] || { g: 0, w: 0, cs: 0, gold: 0, kd: 0, mine: {} }; b.g++; if (m.win) b.w++; b.cs += m.cs - m.opp.cs; b.gold += m.gold - m.opp.gold; b.kd += (m.k - m.opp.d) ; b.mine[m.champ] = (b.mine[m.champ] || 0) + 1; });
    const list = Object.entries(by).filter(([, b]) => b.g >= 2).map(([c, b]) => ({ c, ...b })).sort((a, b) => b.w / b.g - a.w / a.g || b.g - a.g);
    const avg = O.length ? { cs: per(O, m => m.cs - m.opp.cs), gold: per(O, m => m.gold - m.opp.gold), dmg: per(O, m => m.dmg - m.opp.dmg) } : null;
    const row = x => { const ch = S.champs[x.c]; return `<tr><td>${ch ? `<img src="${portrait(ch)}" width="22" height="22" style="border-radius:50%;vertical-align:middle"> ${esc(ch.name)}` : esc(x.c)}</td><td>${x.g}</td><td>${pct(x.w, x.g)}</td><td style="color:${x.cs / x.g >= 0 ? 'var(--green)' : 'var(--red)'}">${x.cs / x.g >= 0 ? '+' : ''}${(x.cs / x.g).toFixed(0)}</td></tr>`; };
    const best = list.filter(x => x.w / x.g >= .5).slice(0, 4), worst = [...list].reverse().filter(x => x.w / x.g < .5).slice(0, 4);
    return `<div class="panel"><h3 style="margin-top:0">${esc(d.name)}</h3>
      ${avg ? `<div class="pills"><span class="chip">${O.length} games met lane-tegenstander</span><span class="chip" style="color:${avg.gold >= 0 ? 'var(--green)' : 'var(--red)'}">goud ${avg.gold >= 0 ? '+' : ''}${Math.round(avg.gold)}</span><span class="chip" style="color:${avg.cs >= 0 ? 'var(--green)' : 'var(--red)'}">CS ${avg.cs >= 0 ? '+' : ''}${avg.cs.toFixed(0)}</span><span class="chip" style="color:${avg.dmg >= 0 ? 'var(--green)' : 'var(--red)'}">schade ${avg.dmg >= 0 ? '+' : ''}${k1(avg.dmg)}</span></div><p class="mute" style="font-size:.78rem">Gemiddeld verschil met je tegenstander aan het einde van de game.</p>` : ''}
      <div class="tag-title">Beste matchups (≥ 2 games)</div>${best.length ? `<table class="tbl"><thead><tr><th>Tegenstander</th><th>G</th><th>WR</th><th>CS±</th></tr></thead><tbody>${best.map(row).join('')}</tbody></table>` : '<span class="mute">nog niet genoeg games</span>'}
      <div class="tag-title">Lastigste matchups (≥ 2 games)</div>${worst.length ? `<table class="tbl"><thead><tr><th>Tegenstander</th><th>G</th><th>WR</th><th>CS±</th></tr></thead><tbody>${worst.map(row).join('')}</tbody></table>` : '<span class="mute">nog niet genoeg games</span>'}</div>`;
  });
  return `<h2 style="margin-top:24px">🆚 Matchups tegen je lane-tegenstander</h2><div class="players">${cards.join('')}</div>`;
}

/* ---------- Combo's op de champion-pagina ---------- */
function comboSeq(keys, full) {
  const idx = { Q: 0, W: 1, E: 2, R: 3 };
  return keys.split(' ').map(t => {
    if (t in idx && full) { const s = full.spells[idx[t]]; return `<div class="skill" title="${esc(t)} – ${esc(s.name)}"><img src="${CDN}/cdn/${S.ver}/img/spell/${s.image.full}" alt=""><b>${t}</b></div>`; }
    if (t === 'P' && full) return `<div class="skill" title="Passive – ${esc(full.passive.name)}"><img src="${CDN}/cdn/${S.ver}/img/passive/${full.passive.image.full}" alt=""><b>P</b></div>`;
    return `<span class="chip gold" title="${t === 'AA' ? 'basisaanval' : ''}">${esc(t)}</span>`;
  }).join('<span class="arrow">›</span>');
}
function comboPanel(c, full, archKey) {
  const own = window.RC_COMBOS?.[c.id], tips = window.RC_COMBO_TIPS?.[archKey] || [];
  return `<div class="panel"><h2>⚡ Combo's</h2>
    ${own ? own.map(x => `<div class="combo"><div class="row" style="gap:10px"><b>${esc(x.n)}</b></div><div class="row" style="gap:6px;margin:6px 0">${comboSeq(x.k, full)}</div><div class="mute" style="font-size:.88rem">${esc(x.t)}</div></div>`).join('') : `<p class="mute">Voor ${esc(c.name)} staat er nog geen vaste combo. Dit is de algemene aanpak voor deze klasse:</p>`}
    <div class="tag-title">${own ? 'Algemene combo-tips voor deze klasse' : 'Algemene aanpak'}</div><ul class="list">${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <p class="mute" style="font-size:.78rem">Q W E R zijn je skills, AA is een basisaanval. Het zijn basiscombo's; pas ze aan op je situatie en oefen ze in de Practice Tool (Aangepast spel → Practice Tool).</p></div>`;
}

/* ---------- Home (cinematische landingspagina) ---------- */
const HERO_ART = ['Ahri', 'Jinx', 'Yasuo', 'Zed', 'Seraphine', 'LeeSin', 'Syndra', 'Lux', 'Kaisa', 'Ornn', 'Thresh', 'Aatrox', 'Lucian', 'Sett'];
const homeSel = { lane: '', style: '', diff: '' };

function miniAdvice(sel) {
  const saved = { ...quiz };
  Object.assign(quiz, { lane: '', diff: '', style: '', dmg: '', tank: '', range: '', win: '', who: '', min: true }, sel);
  let r = adviceList().slice(0, 3);
  if (r.length < 3) { quiz.min = false; r = adviceList().slice(0, 3); } // te weinig data: toon alle champions
  Object.assign(quiz, saved); return r;
}
function miniResultsHtml() {
  return miniAdvice(homeSel).map((x, i) => `<a href="#/champ/${x.c.id}/${x.lane}" style="--i:${i}"><img src="${portrait(x.c)}" alt=""><b>${esc(x.c.name)}</b><small>${esc(x.why.slice(0, 2).join(' · ') || LANES[x.lane].label)}</small></a>`).join('');
}
function showcaseData(lane) {
  let list = [];
  if (S.stats?.lanes?.[lane]) list = Object.entries(S.stats.lanes[lane].champs).filter(([id, c]) => c.g >= MIN_GAMES && S.champs[id] && lanesOf(S.champs[id]).includes(lane)).map(([id, c]) => ({ c: S.champs[id], wr: 100 * c.w / c.g, g: c.g, s: wilson(c.w, c.g) })).sort((a, b) => b.s - a.s).slice(0, 5);
  if (!list.length) list = lanePool(lane, false).filter(c => c.info.difficulty <= 4).slice(0, 5).map(c => ({ c, wr: 0, g: 0 }));
  return list;
}
function showcaseHtml(lane) {
  const list = showcaseData(lane), top = list[0];
  return `<div class="sc-art swap" style="background-image:url('${CDN}/cdn/img/champion/splash/${top.c.id}_0.jpg')"><div class="who"><span>Sterkste ${LANES[lane].label}-pick</span><h3>${esc(top.c.name)}</h3><span>${esc(top.c.title)}</span></div></div>
  <div class="sc-list"><div class="sc-tabs">${Object.entries(LANES).map(([k, l]) => `<button class="tab ${k === lane ? 'on' : ''}" data-sc="${k}">${l.icon} ${l.label}</button>`).join('')}</div>
    ${list.map((x, i) => `<a class="row2" href="#/champ/${x.c.id}/${lane}" style="--i:${i}"><img src="${portrait(x.c)}" alt=""><div class="nm2"><b>${esc(x.c.name)}</b><div class="meter"><i style="--w:${x.wr ? Math.max(8, Math.min(100, (x.wr - 40) * 5)) : 40}%"></i></div></div><span class="mute">${x.wr ? x.wr.toFixed(0) + '%' : '–'}</span></a>`).join('')}
    <a class="btn primary" style="margin-top:14px" href="#/lane/${lane}">Alle ${LANES[lane].label}-champions →</a></div>`;
}

function renderHome(app) {
  const total = S.champList.length, items = completed.length, matches = S.stats?.meta?.matches || 0;
  const runesN = S.runes.reduce((n, t) => n + t.slots.reduce((m, s) => m + s.runes.length, 0), 0);
  const patch = S.ver.split('.').slice(0, 2).join('.');
  const art = HERO_ART.filter(id => S.champs[id]).map(id => { const c = S.champs[id]; return { url: `${CDN}/cdn/img/champion/splash/${id}_0.jpg`, href: `#/champ/${id}/${lanesOf(c)[0] || 'MID'}`, icon: portrait(c), name: c.name }; });
  const sorted = [...S.champList].sort((a, b) => (a.id.charCodeAt(1) * 7 + a.id.length) - (b.id.charCodeAt(1) * 7 + b.id.length));
  const row1 = sorted.slice(0, 60), row2 = sorted.slice(60, 120);
  const mq = r => r.concat(r).map(c => `<a href="#/champ/${c.id}/${lanesOf(c)[0] || 'MID'}" title="${esc(c.name)}"><img src="${portrait(c)}" alt="${esc(c.name)}" loading="lazy" width="74" height="74"></a>`).join('');
  /* tierlist-viz */
  const tier = showcaseData('MID').slice(0, 4);
  /* build-viz */
  const bc = S.champs.Ahri || S.champList[0], B = buildFor(bc, 'MID'), ks = B.runes[0]?.keystone?.r;
  const buildIcons = [...B.core.slice(0, 3), ...B.boots.slice(0, 1)];
  /* team-viz */
  const team = [['TOP', 'Ornn'], ['JUNGLE', 'Sejuani'], ['MID', 'Ahri'], ['ADC', 'Jinx'], ['SUPPORT', 'Lulu']].filter(([, id]) => S.champs[id]).map(([lane, id]) => ({ lane, c: S.champs[id] }));
  const est = estimateTeam(team).wr;
  /* statistiek-viz */
  const hpList = ['Sion', 'Malphite', 'Galio', 'Ahri', 'Jinx'].filter(id => S.champs[id]).map(id => ({ c: S.champs[id], hp: hpStats(S.champs[id]).hp })), hpMax = Math.max(...hpList.map(x => x.hp));
  const cmb = window.RC_COMBOS?.Ahri?.[0];
  const top = [];
  if (S.stats) Object.entries(S.stats.lanes).forEach(([lane, L]) => Object.entries(L.champs).forEach(([id, c]) => { if (c.g >= MIN_GAMES && S.champs[id] && lanesOf(S.champs[id]).includes(lane)) top.push({ id, lane, s: wilson(c.w, c.g) }); }));
  top.sort((a, b) => b.s - a.s);
  const seg = (k, opts) => `<div class="qq2"><small>${k}</small>${opts.map(([v, l]) => `<button class="chipb ${homeSel[k === 'Lane' ? 'lane' : k === 'Stijl' ? 'style' : 'diff'] === v ? 'on' : ''}" data-hs="${k === 'Lane' ? 'lane' : k === 'Stijl' ? 'style' : 'diff'}|${v}">${l}</button>`).join('')}</div>`;

  app.innerHTML = `
  <section class="hero3" id="hero3">
    <div class="hero-slide"></div><div class="hero-slide"></div><div class="hero-shade"></div>
    <div class="hero-aurora"><i></i><i></i><i></i></div><canvas id="fxCanvas" aria-hidden="true"></canvas>
    <svg class="hex-ring r1" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 3 91 26.5v47L50 97 9 73.5v-47z" fill="none" stroke="#c8aa6e" stroke-width=".4"/><path d="M50 12 83 31v38L50 88 17 69V31z" fill="none" stroke="#0ac8b9" stroke-width=".3" stroke-dasharray="2 3"/></svg>
    <svg class="hex-ring r2" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 3 91 26.5v47L50 97 9 73.5v-47z" fill="none" stroke="#0ac8b9" stroke-width=".4"/></svg>
    <div class="hero-inner">
      <span class="pill"><span class="dot"></span>Patch ${esc(patch)} is live · Nederlandstalig · gratis</span>
      <h1><span class="w" style="--i:0">Kies</span> <span class="w" style="--i:1">de</span> <span class="w" style="--i:2">juiste</span> <span class="w shimmer" style="--i:3">champion</span><br><span class="w" style="--i:4">voor</span> <span class="w" style="--i:5"><span class="roll shimmer"><span><b>Top</b><b>Jungle</b><b>Mid</b><b>ADC</b><b>Support</b><b>Top</b></span></span></span></h1>
      <p class="lead">Advies op maat, tierlists, runes, items en combo's voor alle ${total} champions. Zonder account, in het Nederlands en bijgewerkt per patch.</p>
      <form class="hero-search" id="heroForm"><input id="heroInput" list="heroNames" placeholder="Zoek een champion, bijvoorbeeld Ahri…" aria-label="Zoek een champion" autocomplete="off"><button class="btn primary">Zoek</button></form>
      <datalist id="heroNames">${S.champList.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>
      <div class="btnrow"><a class="btn primary lg" href="#/advies">🎯 Wat moet ik spelen?</a><a class="btn lg" href="#/lane/MID">Bekijk de tierlists</a></div>
      <div class="glass-metrics"><div class="glass"><b data-count="${total}">${total}</b><span>champions</span></div><div class="glass"><b data-count="${items}">${items}</b><span>items</span></div>${matches ? `<div class="glass"><b data-count="${matches}">${matches}</b><span>geanalyseerde games</span></div>` : ''}<div class="glass"><b>${esc(patch)}</b><span>huidige patch</span></div></div>
    </div>
    <a class="nowshow" id="nowshow" href="#/"><img src="" alt="" width="30" height="30"><span></span></a><div class="scrollcue" aria-hidden="true"></div>
  </section>

  <div class="marquee" aria-label="Alle champions"><div class="track">${mq(row1)}</div><div class="track rev">${mq(row2)}</div></div>

  <section class="sec2"><span class="kicker">Alles in één plek</span><h2>Alles wat je nodig hebt om <em>beter te kiezen</em></h2><p>Champion-keuze, builds en teamsamenstelling op basis van echte data, uitgelegd in het Nederlands.</p></section>
  <div class="bento">
    <div class="tile w4 tilt"><h3>🎯 Champion-advies</h3><p>Kies lane, stijl en niveau en zie direct welke champions bij je passen. Probeer het meteen:</p>
      <div class="viz mini-q" id="miniQ">${seg('Lane', [['', 'Alle'], ...Object.entries(LANES).map(([k, l]) => [k, l.label])])}${seg('Stijl', [['', 'Maakt niet uit'], ['aggr', 'Agressief'], ['safe', 'Veilig'], ['team', 'Teamspeler']])}${seg('Niveau', [['', 'Elk niveau'], ['easy', 'Beginner'], ['hard', 'Ervaren']])}
      <div class="mini-res" id="miniRes">${miniResultsHtml()}</div></div><a class="more" id="miniMore" href="#/advies">Volledig advies met 7 vragen →</a></div>
    <a class="tile tilt" href="#/lane/MID"><h3>📊 Tierlists per lane</h3><p>Win rates uit echte Emerald+-games.</p><div class="viz bars">${tier.map((x, i) => `<div class="b" style="--i:${i}"><img src="${portrait(x.c)}" alt=""><div class="bar2"><i style="--w:${Math.max(10, Math.min(100, (x.wr - 40) * 5))}%;--i:${i}"></i></div><span>${x.wr ? x.wr.toFixed(0) + '%' : '–'}</span></div>`).join('')}</div><span class="more">Bekijk alle tierlists →</span></a>
    <a class="tile tilt" href="#/champ/${bc.id}/MID"><h3>⚔️ Builds &amp; runes</h3><p>Runes, items en spells per champion en lane.</p><div class="viz items-row">${ks ? `<img class="ks" src="${runeImg(ks)}" alt="" style="--i:0">` : ''}${buildIcons.map((it, i) => `<img src="${itemImg(it)}" alt="${esc(it.name)}" style="--i:${i + 1}">`).join('')}</div><span class="more">Voorbeeld: ${esc(bc.name)} →</span></a>
    <a class="tile tilt" href="#/team"><h3>🧩 Team builder</h3><p>Suggesties en een win rate-schatting.</p><div class="viz" style="display:flex;align-items:center;gap:14px;justify-content:space-between"><div class="slots">${team.map((t, i) => `<img src="${portrait(t.c)}" alt="${esc(t.c.name)}" style="--i:${i}">`).join('')}</div>
      <div class="gauge" style="--off:${(264 * (1 - est / 100)).toFixed(0)}"><svg viewBox="0 0 100 100" width="96" height="96"><defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#0ac8b9"/><stop offset="1" stop-color="#c8aa6e"/></linearGradient></defs><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" cx="50" cy="50" r="42"/></svg><b>${est.toFixed(0)}%</b></div></div><span class="more">Bouw je team →</span></a>
    <a class="tile tilt" href="#/counter"><h3>🆚 Counter picker</h3><p>Zie wie het best tegen een vijand past.</p><div class="viz vs">${['Malphite', 'Yasuo'].filter(id => S.champs[id]).map((id, i) => `${i ? '<span class="x">VS</span>' : ''}<img src="${portrait(S.champs[id])}" alt="">`).join('')}</div><span class="more">Vind de counter →</span></a>
    <a class="tile w4 tilt" href="#/stats"><h3>📈 Statistieken</h3><p>Vergelijk health, armor, schade en win rate van alle champions.</p><div class="viz bars">${hpList.map((x, i) => `<div class="b" style="--i:${i}"><img src="${portrait(x.c)}" alt=""><div class="bar2"><i style="--w:${(100 * x.hp / hpMax).toFixed(0)}%;--i:${i}"></i></div><span>${k0(x.hp)}</span></div>`).join('')}</div><span class="more">Open de statistieken →</span></a>
    <a class="tile tilt" href="#/champ/Ahri/MID"><h3>⚡ Combo's</h3><p>Stap-voor-stap combo's met uitleg.</p><div class="viz items-row">${cmb ? cmb.k.split(' ').map((k, i) => `<span class="chip gold" style="--i:${i};font-size:1rem;padding:6px 12px">${k}</span>${i < cmb.k.split(' ').length - 1 ? '<span class="arrow">›</span>' : ''}`).join('') : ''}</div><span class="more">Bekijk de combo's →</span></a>
  </div>

  <section class="sec2"><span class="kicker">In drie stappen</span><h2>Van twijfel naar een <em>complete build</em></h2></section>
  <div class="stepper"><div class="st"><div class="n">1</div><h3>Kies je lane en stijl</h3><p>Geef aan wat je wilt spelen, of laat de quiz kiezen.</p></div><div class="st"><div class="n">2</div><h3>Vergelijk de opties</h3><p>Tiers, win rates, health en schade, met uitleg waarom het past.</p></div><div class="st"><div class="n">3</div><h3>Neem de build over</h3><p>Runes, items, skills en combo's, plus een item set voor de client.</p></div></div>

  <section class="sec2"><span class="kicker">Per lane</span><h2>De sterkste picks, <em>lane voor lane</em></h2><p>Op basis van win rate en aantal games in onze steekproef.</p></section>
  <div class="showcase" id="showcase">${showcaseHtml('MID')}</div>

  ${top.length ? `<section class="sec2"><span class="kicker">Deze patch</span><h2>Opvallende <em>picks</em></h2></section><div class="grid">${top.slice(0, 8).map(x => champCard(S.champs[x.id], x.lane, 'Primair')).join('')}</div>` : ''}

  <div class="bignums"><div><b data-count="${total}">${total}</b><span>champions</span></div><div><b data-count="${items}">${items}</b><span>items</span></div><div><b data-count="${runesN}">${runesN}</b><span>runes</span></div>${matches ? `<div><b data-count="${matches}">${matches}</b><span>geanalyseerde games</span></div>` : ''}</div>

  <section class="sec2"><span class="kicker">Handig om te weten</span><h2>Veelgestelde <em>vragen</em></h2></section>
  <section class="faq" style="max-width:820px;margin:0 auto">
    <details><summary>Is Rift Companion gratis?</summary><p>Ja. Je hebt geen account nodig en alles is gratis te gebruiken.</p></details>
    <details><summary>Waar komen de gegevens vandaan?</summary><p>Champions, items, runes en afbeeldingen komen rechtstreeks van Riot Games (Data Dragon) en zijn daardoor altijd van de huidige patch. De win rates komen uit een eigen steekproef van ranked games van Emerald-spelers en hoger, opgehaald via de officiële Riot API.</p></details>
    <details><summary>Hoe betrouwbaar zijn de win rates en tiers?</summary><p>Ze zijn gebaseerd op een steekproef${matches ? ` van ${matches.toLocaleString('nl-NL')} games` : ''}. Een tier tonen we pas vanaf ${MIN_GAMES} games per champion, en kleine aantallen geven altijd ruis. Zie de cijfers als een goede indicatie, niet als een garantie.</p></details>
    <details><summary>Zijn de Nederlandse teksten officieel?</summary><p>Nee. Riot levert de gamebeschrijvingen niet in het Nederlands. Wij vertalen ze zelf; namen van champions, items en skills laten we in het Engels zodat je ze in de game herkent.</p></details>
    <details><summary>Slaan jullie persoonlijke gegevens op?</summary><p>Nee. Er zijn geen accounts of tracking-cookies. Je favorieten en voorkeuren blijven in je eigen browser. Lees het <a href="#/privacy">privacybeleid</a> voor de details.</p></details>
    <details><summary>Is dit een officiële Riot Games-website?</summary><p>Nee. Rift Companion is een onafhankelijk project en is niet door Riot Games goedgekeurd. Alle handelsmerken zijn eigendom van Riot Games, Inc.</p></details></section>

  <section class="band2" style="margin-bottom:18px"><h2>Leer een champion <span class="shimmer">echt</span> spelen</h2><p>Stappenplan met skills, setup, combo's, laningfase, oefenopdrachten en een quiz. Je voortgang wordt bewaard.</p><a class="btn primary lg" href="#/leren">🎓 Start de leer-modus →</a></section>
  <section class="band2"><h2>Klaar om <span class="shimmer">slimmer</span> te kiezen?</h2><p>Beantwoord zeven korte vragen en je hebt binnen een minuut een top 10 champions die bij je passen.</p><a class="btn primary lg" href="#/advies">Start de advies-quiz →</a></section>`;

  /* interacties */
  const go = e => { e.preventDefault(); const c = findChampByName($('#heroInput').value); if (c) location.hash = `#/champ/${c.id}/${lanesOf(c)[0] || 'MID'}`; else toast('Champion niet gevonden'); };
  $('#heroForm').addEventListener('submit', go); $('#heroInput').addEventListener('change', go);
  $('#miniQ').addEventListener('click', e => {
    const b = e.target.closest('[data-hs]'); if (!b) return; const [k, v] = b.dataset.hs.split('|'); homeSel[k] = v;
    $$('[data-hs^="' + k + '|"]', $('#miniQ')).forEach(x => x.classList.toggle('on', x === b));
    const r = $('#miniRes'); r.innerHTML = miniResultsHtml();
  });
  $('#miniMore').addEventListener('click', () => { Object.assign(quiz, { lane: homeSel.lane, style: homeSel.style, diff: homeSel.diff }); });
  $('#showcase').addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (!b) return; $('#showcase').innerHTML = showcaseHtml(b.dataset.sc); });
  window.RC_FX?.hero({ art });
}


/* ---------- Tekstpagina's: over, privacy, voorwaarden, contact ---------- */
const SITE_UPDATED = '18 november 2026';
const GITHUB_ISSUES = 'https://github.com/juppejong/rift/issues';
function prose(app, html) { app.innerHTML = `<article class="prose">${html}</article>`; }

function renderAbout(app) {
  const m = S.stats?.meta?.matches;
  prose(app, `<h1>Over Rift Companion</h1><p class="meta">Laatst bijgewerkt: ${SITE_UPDATED}</p>
  <p>Rift Companion helpt je om in League of Legends de juiste champion te kiezen en daar de beste build bij te maken. Je vindt hier advies op maat, tierlists per lane, runes, items, combo's, een team builder en een counter picker, allemaal in het Nederlands.</p>
  <h2>Waar komen de gegevens vandaan?</h2>
  <ul><li><b>Champions, items, runes en afbeeldingen</b> komen rechtstreeks van Riot Games (Data Dragon). Daardoor staan nieuwe patches automatisch in de site.</li>
  <li><b>Win rates, tiers en schadecijfers</b> komen uit een eigen steekproef${m ? ` van ${m.toLocaleString('nl-NL')} ranked games` : ''} van Emerald-spelers en hoger op EUW, opgehaald via de officiële Riot API. Er worden daarbij geen spelersnamen gepubliceerd.</li>
  <li><b>Vertalingen</b> van de gamebeschrijvingen maken wij zelf. Namen van champions, items en skills blijven Engels, zoals in de game.</li></ul>
  <h2>Hoe berekenen we het advies?</h2>
  <p>De advies-quiz geeft punten per antwoord (zoals lane, moeilijkheid, schadetype, taaiheid en speelstijl) en telt de win rate uit onze data mee. De team builder schat de team win rate uit de gemiddelde win rate van de gekozen champions en kleine correcties voor de samenstelling. Builds en matchups volgen vaste regels per soort champion.</p>
  <div class="note"><b>Let op:</b> dit zijn <b>indicaties</b>, geen garanties. Een kleine steekproef geeft ruis, en builds hangen altijd af van de situatie in je game.</div>
  <h2>Onafhankelijk project</h2>
  <p>Rift Companion is niet door Riot Games goedgekeurd en weerspiegelt niet de standpunten of meningen van Riot Games of iemand die officieel betrokken is bij het produceren of beheren van Riot Games-eigendommen. Riot Games en alle bijbehorende eigendommen zijn handelsmerken of gedeponeerde handelsmerken van Riot Games, Inc.</p>
  <h2>Feedback</h2><p>Zie je een fout of heb je een idee? Laat het ons weten via de <a href="#/contact">contactpagina</a>.</p>`);
}

function renderPrivacy(app) {
  prose(app, `<h1>Privacybeleid</h1><p class="meta">Laatst bijgewerkt: ${SITE_UPDATED}</p>
  <p>Wij vinden je privacy belangrijk. Rift Companion is zo gebouwd dat we zo weinig mogelijk over je weten.</p>
  <h2>Welke gegevens verwerken wij?</h2>
  <ul><li><b>Geen account en geen formulieren.</b> Je hoeft nergens persoonlijke gegevens in te vullen om de site te gebruiken.</li>
  <li><b>Geen tracking.</b> We gebruiken geen advertentie- of analysecookies en delen geen gegevens met adverteerders.</li>
  <li><b>Voorkeuren in je browser.</b> Je favoriete champions en instellingen (zoals filters) worden alleen lokaal in je browser opgeslagen (localStorage). Deze gegevens verlaten je apparaat niet en je kunt ze zelf wissen via je browserinstellingen.</li></ul>
  <h2>Externe diensten</h2>
  <ul><li><b>Riot Games (Data Dragon).</b> Champion-, item- en runegegevens en afbeeldingen laadt je browser rechtstreeks van ddragon.leagueoflegends.com. Riot ziet daarbij technische gegevens zoals je IP-adres, volgens het eigen privacybeleid van Riot Games.</li>
  <li><b>Hosting.</b> De website wordt gehost door GitHub Pages (GitHub, Inc.). Zij verwerken technische loggegevens zoals je IP-adres voor het leveren en beveiligen van de site, volgens hun privacyverklaring.</li></ul>
  <h2>Spelersgegevens uit de Riot API</h2>
  <p>De win rates en statistieken komen uit geaggregeerde ranked-wedstrijdgegevens van de Riot API. Daarin staan geen spelersnamen. Op de pagina <i>Spelers</i> worden, met toestemming van de betrokkenen, statistieken van een kleine groep vaste spelers getoond. Wil je dat jouw gegevens daar niet meer staan, neem dan contact op; dan verwijderen we ze zo snel mogelijk.</p>
  <h2>Jouw rechten</h2>
  <p>Onder de AVG heb je recht op inzage, rectificatie, verwijdering en bezwaar. Omdat wij vrijwel geen persoonsgegevens verwerken, zijn er meestal weinig gegevens om in te zien, maar je kunt altijd een verzoek indienen via de <a href="#/contact">contactpagina</a>. Heb je een klacht? Dan kun je die indienen bij de Autoriteit Persoonsgegevens.</p>
  <h2>Wijzigingen</h2><p>We kunnen dit beleid aanpassen, bijvoorbeeld als we functies toevoegen. De datum bovenaan laat zien wanneer het voor het laatst is gewijzigd.</p>`);
}

function renderTerms(app) {
  prose(app, `<h1>Gebruiksvoorwaarden</h1><p class="meta">Laatst bijgewerkt: ${SITE_UPDATED}</p>
  <p>Door Rift Companion te gebruiken ga je akkoord met deze voorwaarden.</p>
  <h2>1. Gebruik van de website</h2><p>Je mag de website gratis gebruiken voor persoonlijk, niet-commercieel gebruik. Het is niet toegestaan de website te verstoren, te overbelasten of de inhoud geautomatiseerd in bulk over te nemen.</p>
  <h2>2. Indicatieve informatie</h2><p>Alle adviezen, tiers, win rates, builds, combo's en schattingen zijn <b>indicaties</b> op basis van onze steekproef en eigen regels. Ze zijn geen garantie voor succes in een game. De cijfers kunnen afwijken van de werkelijkheid en niet alle patches zijn direct verwerkt.</p>
  <h2>3. Geen garanties en aansprakelijkheid</h2><p>De website wordt aangeboden "zoals hij is". Wij geven geen garantie op juistheid, volledigheid of beschikbaarheid en zijn niet aansprakelijk voor schade die voortvloeit uit het gebruik van de website, voor zover de wet dit toestaat.</p>
  <h2>4. Intellectuele eigendom</h2><p>League of Legends, alle champions, items, runes en bijbehorende namen, afbeeldingen en teksten zijn eigendom van Riot Games, Inc. Rift Companion is niet door Riot Games goedgekeurd en niet met Riot Games verbonden. De eigen inhoud, vertalingen en code van deze website mag niet zonder toestemming worden hergebruikt.</p>
  <h2>5. Wijzigingen</h2><p>Wij kunnen de website en deze voorwaarden op elk moment aanpassen. Voortgezet gebruik betekent dat je de nieuwe voorwaarden accepteert.</p>
  <h2>6. Toepasselijk recht</h2><p>Op deze voorwaarden is Nederlands recht van toepassing.</p>`);
}

function renderContact(app) {
  prose(app, `<h1>Contact</h1><p class="meta">Laatst bijgewerkt: ${SITE_UPDATED}</p>
  <p>Een fout gevonden, een idee voor een nieuwe functie of een vraag over je gegevens? We horen het graag.</p>
  <div class="panel"><h3 style="margin-top:0">Melding of idee doorgeven</h3><p>Maak een melding aan op GitHub. Dat is de snelste manier om ons te bereiken.</p>
  <a class="btn primary" href="${GITHUB_ISSUES}" target="_blank" rel="noopener">Open een melding op GitHub →</a></div>
  <h2>Privacyverzoeken</h2><p>Wil je dat jouw gegevens van de pagina <i>Spelers</i> worden verwijderd, of heb je een ander verzoek over privacy? Meld dat via dezelfde link, dan handelen we het zo snel mogelijk af.</p>`);
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
    <select id="lsort"><option value="fit">Sorteer: Lane-fit</option><option value="hp">Meeste health (lvl 18)</option><option value="hplow">Minste health (lvl 18)</option><option value="dpm">Meeste schade</option>${S.stats ? '<option value="tier">Tier (data)</option><option value="wr">Win rate</option><option value="pr">Pick rate</option>' : ''}<option value="az">A – Z</option><option value="easy">Makkelijkst eerst</option><option value="hard">Moeilijkst eerst</option><option value="attack">Meeste aanval</option><option value="defense">Meeste defense</option><option value="magic">Meeste magie</option></select>
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
      hp: (a, b) => hpStats(b).hp - hpStats(a).hp, hplow: (a, b) => hpStats(a).hp - hpStats(b).hp,
      dpm: (a, b) => (dmgData(b.id, lane)?.min ?? -1) - (dmgData(a.id, lane)?.min ?? -1) || dmgRating(b, lane) - dmgRating(a, lane) || hpStats(a).hp - hpStats(b).hp,
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
/* ---------- Champion-pagina (hoofdgerecht): header, radar, win rate-grafiek, tabbladen, skill-schema ---------- */
let statPct = null;
function statPercentile(c, key) {
  if (!statPct) { const all = S.champList.map(hpStats); statPct = {}; ['hp', 'ar', 'mr', 'ad', 'rng', 'ms'].forEach(k => statPct[k] = all.map(a => a[k]).sort((a, b) => a - b)); }
  const v = hpStats(c)[key], A = statPct[key]; return Math.round(100 * A.filter(x => x <= v).length / A.length);
}
function radarHtml(c) {
  const AX = [['Health', 'hp'], ['Armor', 'ar'], ['Magische weerstand', 'mr'], ['Aanvalskracht', 'ad'], ['Bereik', 'rng'], ['Loopsnelheid', 'ms']];
  const cx = 130, cy = 130, R = 88, pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / AX.length; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
  const vals = AX.map(([, k]) => Math.max(8, statPercentile(c, k)));
  const poly = vs => vs.map((v, i) => pt(i, v).map(n => n.toFixed(1)).join(',')).join(' ');
  const h = hpStats(c), raw = [Math.round(h.hp), Math.round(h.ar), Math.round(h.mr), Math.round(h.ad), h.rng, h.ms];
  return `<svg class="radar" viewBox="0 0 260 260" role="img" aria-label="Profiel van ${esc(c.name)}">
    ${[25, 50, 75, 100].map(r => `<polygon points="${poly(AX.map(() => r))}" fill="none" stroke="#ffffff${r === 100 ? '26' : '14'}" stroke-width="1"/>`).join('')}
    ${AX.map((_, i) => { const [x, y] = pt(i, 100); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#ffffff14"/>`; }).join('')}
    <polygon points="${poly(AX.map(() => 50))}" fill="none" stroke="#0ac8b9aa" stroke-width="1" stroke-dasharray="3 4"/>
    <polygon class="rpoly" points="${poly(vals)}" fill="#c8aa6e55" stroke="#e8c880" stroke-width="2" stroke-linejoin="round"/>
    ${vals.map((v, i) => { const [x, y] = pt(i, v); return `<circle class="rdot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="#f0e6d2" style="--i:${i}"><title>${AX[i][0]}: ${raw[i]} (hoger dan ${statPercentile(c, AX[i][1])}% van de champions)</title></circle>`; }).join('')}
    ${AX.map(([l], i) => { const [x, y] = pt(i, 122); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="#9fb2c6" font-size="9.5">${l}</text>`; }).join('')}
  </svg>`;
}

function wrChartHtml(c, lanes, lane) {
  if (!S.stats) return '<p class="mute">Nog geen matchdata beschikbaar.</p>';
  const rows = lanes.map(l => ({ l, st: statOf(c.id, l) })).filter(x => x.st);
  if (!rows.length) return `<p class="mute">Nog geen games van ${esc(c.name)} in onze steekproef. Draai <code>update.bat data</code> voor meer data.</p>`;
  const pos = v => Math.max(2, Math.min(98, (v - 40) * 5));
  const bars = rows.map(({ l, st }) => `<div class="wrow ${l === lane ? 'cur' : ''}"><span class="wl">${LANES[l].icon} ${LANES[l].label}</span>
      <div class="wtrack"><i class="wmid"></i><i class="wfill ${st.wr >= 50 ? 'up' : 'down'}" style="--w:${pos(st.wr)}%"></i></div><b class="${st.wr >= 50 ? 'upc' : 'downc'}">${st.wr.toFixed(1)}%</b><small>${st.g} games</small></div>`).join('');
  /* positie t.o.v. alle champions in deze lane */
  const L = S.stats.lanes[lane], all = L ? Object.entries(L.champs).filter(([, x]) => x.g >= MIN_GAMES).map(([id, x]) => ({ id, wr: 100 * x.w / x.g })) : [];
  const me = statOf(c.id, lane); let dist = '';
  if (all.length >= 8 && me && me.g >= MIN_GAMES) {
    const wrs = all.map(x => x.wr).sort((a, b) => a - b), lo = wrs[0], hi = wrs[wrs.length - 1], avg = wrs.reduce((s, x) => s + x, 0) / wrs.length;
    const rel = v => hi === lo ? 50 : 100 * (v - lo) / (hi - lo), beat = Math.round(100 * wrs.filter(x => x <= me.wr).length / wrs.length);
    dist = `<div class="tag-title">Positie in ${LANES[lane].label}</div><div class="dist"><i class="dg"></i>${wrs.map(w => `<s style="left:${rel(w).toFixed(1)}%"></s>`).join('')}<i class="davg" style="left:${rel(avg).toFixed(1)}%" title="Gemiddeld ${avg.toFixed(1)}%"></i><i class="dme" style="left:${rel(me.wr).toFixed(1)}%"></i></div>
      <div class="dl"><span>${lo.toFixed(0)}%</span><span>${esc(c.name)}: <b>${me.wr.toFixed(1)}%</b> · beter dan ${beat}% van de ${LANES[lane].label}-champions</span><span>${hi.toFixed(0)}%</span></div>`;
  }
  return `<div class="wr">${bars}</div>${dist}<p class="mute" style="font-size:.76rem;margin:8px 0 0">Emerald+ ${esc(S.stats.meta.platform.toUpperCase())}, patch ${esc(S.stats.meta.mainPatch || '?')}. Een trend per patch volgt zodra er meerdere patches zijn verzameld.</p>`;
}

/* wat doet een skill? (afgeleid uit de Engelse beschrijving) */
function skillTags(desc) {
  const d = (desc || '').toLowerCase(), t = [];
  if (/stun|root|knock|airborne|silence|fear|charm|taunt|suppress|slow|immobiliz|pull|sleep|ground/.test(d)) t.push(['CC', 'cc']);
  if (/dash|leap|blink|teleport|jump|move speed|movement speed|untargetable/.test(d)) t.push(['Mobiliteit', 'mob']);
  if (/shield|heal|restor|damage reduction|invulnerable|stasis|armor and magic resist/.test(d)) t.push(['Verdediging / heal', 'def']);
  if (/damage|deal/.test(d)) t.push(['Schade', 'dmg']);
  return t;
}
/* standaard levelvolgorde op basis van de max-volgorde (p[0] eerst, dan p[1], dan p[2]; R op 6/11/16) */
function skillSchedule(prio) {
  const [a, b, c2] = prio, plan = [a, b, c2, a, a, 'R', a, b, a, b, 'R', b, b, c2, c2, 'R', c2, c2];
  return plan;
}
function skillScheduleHtml(full, prio) {
  const plan = skillSchedule(prio);
  const rows = ['Q', 'W', 'E', 'R'].map((k, i) => { const s = full.spells[i];
    return `<div class="srow"><div class="sk"><img src="${CDN}/cdn/${S.ver}/img/spell/${s.image.full}" alt="" title="${esc(s.name)}"><b>${k}</b></div>${plan.map((p, lv) => `<span class="cell ${p === k ? 'on ' + (k === 'R' ? 'ult' : '') : ''}" style="--i:${lv}">${p === k ? lv + 1 : ''}</span>`).join('')}</div>`; }).join('');
  return `<div class="sched"><div class="srow head"><div class="sk"></div>${plan.map((_, lv) => `<span class="cell hd">${lv + 1}</span>`).join('')}</div>${rows}</div>`;
}

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
  const B = buildFor(c, lane), A = B.A, st = statOf(c.id, lane);
  document.title = `${c.name} – beste runes, items en combo's (${LANES[lane].label}) | Rift Companion`;
  document.querySelector('meta[name=description]')?.setAttribute('content', `${c.name} (${c.title}) in ${LANES[lane].label}: runes, items, summoner spells, skill-volgorde en combo's, met win rate uit echte games.`);
  const setup = B.runes[Math.min(S.ui.setup, B.runes.length - 1)];
  const spellSet = B.spells[Math.min(S.ui.spell, B.spells.length - 1)] || [];
  const { good, bad } = matchups(c, lane);
  const skins = full?.skins || [{ num: 0, name: 'default' }];
  const prio = full ? skillPrio(full) : [];
  const tab = ['build', 'combos', 'matchups', 'skills', 'tips'].includes(S.ui.ctab) ? S.ui.ctab : 'build';
  const h = hpStats(c);

  const runeTile = (x, cls = '') => x.r
    ? `<div class="rune ${cls}" data-rune="${x.r.id}"><img src="${runeImg(x.r)}" alt="${esc(x.r.name)}"><span class="rn">${esc(x.r.name)}</span></div>`
    : `<div class="rune miss ${cls}"><img alt=""><span class="rn">${esc(x.missing)} <span class="mute">(niet in deze patch)</span></span></div>`;
  const SH = { AdaptiveForce: ['Adaptive Force', 'AdaptiveForce'], AttackSpeed: ['+10% Attack Speed', 'AttackSpeed'], AbilityHaste: ['+8 Ability Haste', 'CDRScaling'], MovementSpeed: ['+2% Movement Speed', 'MovementSpeed'], HealthScaling: ['+Health (schaalt met level)', 'HealthScaling'], Health: ['+65 HP', 'Health'], Tenacity: ['Tenacity & Slow Resist', 'Tenacity'] };
  const shardTile = k => { const [n, f] = SH[k] || [k, k]; return `<div class="rune shard"><img src="${CDN}/cdn/img/perk-images/StatMods/StatMods${f}Icon.png" alt="" onerror="this.style.visibility='hidden'"><span class="rn">${esc(n)}</span></div>`; };
  const mcard = (r, cls) => `<a class="mcard ${cls}" href="#/champ/${r.o.id}/${lane}"><img src="${portrait(r.o)}" alt=""><div><b>${esc(r.o.name)}</b><small>${esc(r.why.join(' · ') || 'neutraal')}</small></div></a>`;

  const buildPane = `
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
    <div class="panel"><h3 style="margin-top:0">Summoner spells</h3>
      <div class="setup-tabs">${B.spells.map((p, i) => `<button class="tab ${p === spellSet ? 'on' : ''}" data-spell="${i}">${p.map(s => esc(s.name)).join(' + ')}</button>`).join('')}</div>
      <div class="spellset">${spellSet.map(s => `<div class="spell" title="${esc(s.name)}: ${esc(tr('spell.' + s.key, plain(s.description)))}"><img src="${CDN}/cdn/${S.ver}/img/spell/${s.image.full}"><span>${esc(s.name)}</span></div>`).join('')}</div></div>
    <div class="panel"><h2>Items</h2>
      <div class="tag-title">Start</div>${itemRow([...B.start, ...B.ward])}
      <div class="tag-title">Laarzen</div>${itemRow(B.boots)}
      <div class="tag-title">Core build (eerste 3)</div>${itemRow(B.core, true)}
      <div class="tag-title">Alternatieven / later</div>${itemRow(B.alt)}
      <div class="tag-title">Situationeel</div>
      <div class="cols2">
        <div><b>Vs. veel AD / armor nodig</b>${itemRow(B.sit.armor)}</div><div><b>Vs. veel AP / MR nodig</b>${itemRow(B.sit.mr)}</div>
        <div><b>Anti-heal</b>${itemRow(B.sit.antiheal)}</div><div><b>Penetratie vs. tanks</b>${itemRow(B.sit.pen)}</div><div><b>Defensief / laatste item</b>${itemRow(B.sit.defensive)}</div>
      </div>
      <div class="row" style="margin-top:14px"><button class="btn primary" id="dlSet">⬇ Item set (.json) voor League client</button><button class="btn" id="cpBuild">⧉ Kopieer build als tekst</button></div>
      <p class="mute" style="font-size:.8rem">Plaats het bestand in <code>…\\League of Legends\\Config\\Champions\\${esc(c.id)}\\Recommended\\</code> en maak de map aan indien nodig.</p></div>`;

  const skillsPane = full ? `
    <div class="panel"><h2>Skill-volgorde</h2>
      <p>Max-volgorde: <b>${prio.join(' › ')}</b> <span class="mute">(R op level 6, 11 en 16)</span></p>${skillScheduleHtml(full, prio)}
      <p class="mute" style="font-size:.8rem;margin-top:10px">Schema op basis van cooldowns: de skill met de laagste cooldown wordt eerst gemaxt. Controleer of je ook voor deze lane een andere start nodig hebt.</p></div>
    <div class="panel"><h2>Wat doet elke skill?</h2><div class="skcards">
      ${[['P', full.passive.name, plain(full.passive.description), `champ.${c.id}.P`, `${CDN}/cdn/${S.ver}/img/passive/${full.passive.image.full}`, '', ''],
      ...full.spells.map((s, i) => ['QWER'[i], s.name, plain(s.description), `champ.${c.id}.${'QWER'[i]}`, `${CDN}/cdn/${S.ver}/img/spell/${s.image.full}`, s.cooldownBurn, s.costBurn])].map(([k, n, d, key, img, cd, cost]) => `
        <div class="skcard"><div class="row" style="gap:10px"><div class="skill"><img src="${img}" alt=""><b>${k}</b></div><div><b>${esc(n)}</b><div class="pills" style="margin:3px 0 0">${skillTags(d).map(([t, cl]) => `<span class="chip tg-${cl}">${t}</span>`).join('')}</div></div></div>
          <p class="mute" style="font-size:.88rem;margin:8px 0 4px">${esc(tr(key, d))}</p>${cd ? `<small class="mute">Cooldown ${esc(cd)} s · kost ${esc(cost)}</small>` : ''}</div>`).join('')}</div></div>` : '<div class="panel"><p class="mute">Kon de spelgegevens niet laden.</p></div>';

  const tipsPane = `
    <div class="panel cols2"><div><h3 style="margin-top:0">Speel als ${esc(c.name)}</h3><ul class="list">${(full?.allytips || []).map((t, n) => `<li>${esc(tr(`champ.${c.id}.a${n}`, t))}</li>`).join('') || '<li class="mute">–</li>'}</ul></div>
      <div><h3 style="margin-top:0">Speel tegen ${esc(c.name)}</h3><ul class="list">${(full?.enemytips || []).map((t, n) => `<li>${esc(tr(`champ.${c.id}.e${n}`, t))}</li>`).join('') || '<li class="mute">–</li>'}</ul></div></div>
    <div class="panel"><h3 style="margin-top:0">Laning-tips (${LANES[lane].label})</h3><ul class="list">${A.laning.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    <div class="panel learncta"><div><h3 style="margin:0 0 4px">🎓 Wil je ${esc(c.name)} echt leren spelen?</h3><p class="mute" style="margin:0">Een stappenplan met oefenopdrachten, een beslissingsquiz en een vergelijking met je eigen games.</p></div><a class="btn primary" href="#/leren/${c.id}/${lane}">Start de leer-modus →</a></div>`;

  app.innerHTML = `
  <section class="ch-hero" id="chHero">
    <div class="ch-bg" id="chBg" style="background-image:url('${splash(c.id, 0)}')"></div><div class="ch-shade"></div>
    <div class="ch-in">
      <nav class="crumbs" aria-label="Kruimelpad"><a href="#/champions">Champions</a> › <a href="#/lane/${lane}">${LANES[lane].label}</a> › ${esc(c.name)}</nav>
      <div class="ch-row"><img class="ch-ic" src="${portrait(c)}" alt="">
        <div class="ch-title"><h1>${esc(c.name)}</h1><div class="sub">${esc(c.title)}</div>
          <div class="pills">${c.tags.map(t => `<span class="chip gold">${TAG_NL[t] || t}</span>`).join('')}${(() => { const al = A.label.split('(')[0].trim(); return c.tags.some(t => (TAG_NL[t] || t).toLowerCase() === al.toLowerCase()) ? '' : `<span class="chip">${esc(al)}</span>`; })()}${diffBar(c.info.difficulty)}</div></div>
        <div class="ch-actions"><button class="btn" data-fav="${c.id}">${isFav(c.id) ? '★ Favoriet' : '☆ Favoriet'}</button><a class="btn primary" href="#/leren/${c.id}/${lane}">🎓 Leer deze champion</a>
          ${skins.length > 1 ? `<select id="skinSel" class="field" aria-label="Kies een skin">${skins.slice(0, 40).map(s => `<option value="${s.num}">${esc(s.name === 'default' ? 'Standaard skin' : s.name)}</option>`).join('')}</select>` : ''}</div></div>
      <div class="ch-metrics">
        ${st ? `<div class="glass"><b>${st.tier ? `<span class="tier-label t-${st.tier}" style="width:32px;height:32px">${st.tier}</span>` : st.wr.toFixed(0) + '%'}</b><span>${st.tier ? 'tier ' + LANES[lane].label : 'win rate'}</span></div><div class="glass"><b>${st.wr.toFixed(1)}%</b><span>win rate</span></div><div class="glass"><b>${st.g}</b><span>games in data</span></div>` : '<div class="glass"><b>–</b><span>nog geen matchdata</span></div>'}
        <div class="glass"><b>${k0(h.hp)}</b><span>health lvl 18</span></div><div class="glass"><b>${c.info.difficulty}/10</b><span>moeilijkheid</span></div></div>
    </div></section>

  <div class="ch-lanes">${(lanes.length ? lanes : [lane]).map(l => `<a class="tab ${l === lane ? 'on' : ''}" href="#/champ/${c.id}/${l}">${LANES[l].icon} ${LANES[l].label}</a>`).join('')}</div>

  <div class="ch-layout"><div class="ch-main">
    <div class="ch-tabs" role="tablist">${[['build', '🛠 Build'], ['combos', "⚡ Combo's"], ['matchups', '🆚 Matchups'], ['skills', '🎯 Skills'], ['tips', '💡 Tips']].map(([k, l]) => `<button role="tab" class="ctab ${k === tab ? 'on' : ''}" data-ctab="${k}">${l}</button>`).join('')}</div>
    <div class="tabpane ${tab === 'build' ? 'on' : ''}" data-pane="build">${buildPane}</div>
    <div class="tabpane ${tab === 'combos' ? 'on' : ''}" data-pane="combos">${comboPanel(c, full, B.archKey)}</div>
    <div class="tabpane ${tab === 'matchups' ? 'on' : ''}" data-pane="matchups">
      <div class="panel"><h2>Sterk tegen (${LANES[lane].label})</h2><div class="mgrid">${good.map(r => mcard(r, 'good')).join('') || '<span class="mute">–</span>'}</div></div>
      <div class="panel"><h2>Lastig tegen</h2><div class="mgrid">${bad.map(r => mcard(r, 'bad')).join('') || '<span class="mute">–</span>'}</div>
        <p class="mute" style="font-size:.78rem;margin-top:10px">Indicatief op basis van klasse en bereik, niet op echte matchup-data. Zoek een specifieke tegenstander in de <a href="#/counter/${lane}">counter picker</a>.</p></div></div>
    <div class="tabpane ${tab === 'skills' ? 'on' : ''}" data-pane="skills">${skillsPane}</div>
    <div class="tabpane ${tab === 'tips' ? 'on' : ''}" data-pane="tips">${tipsPane}</div>
  </div>

  <aside class="ch-side">
    <div class="panel"><h3 style="margin-top:0">Profiel</h3>${radarHtml(c)}<p class="mute" style="font-size:.76rem;margin:0">Stipellijn = gemiddelde champion. Hoe verder naar buiten, hoe hoger dan andere champions (op level 18).</p></div>
    <div class="panel"><h3 style="margin-top:0">Win rate</h3>${wrChartHtml(c, lanes, lane)}</div>
    <div class="panel"><h3 style="margin-top:0">Basisstats</h3>
      <table class="tbl" style="font-size:.84rem"><thead><tr><th></th><th>Lvl 1</th><th>Lvl 18</th></tr></thead><tbody>
        <tr><td>Health</td><td>${c.stats.hp}</td><td>${Math.round(h.hp)}</td></tr><tr><td>Armor</td><td>${c.stats.armor}</td><td>${Math.round(h.ar)}</td></tr><tr><td>Magische weerstand</td><td>${c.stats.spellblock}</td><td>${Math.round(h.mr)}</td></tr>
        <tr><td>Aanvalskracht</td><td>${c.stats.attackdamage}</td><td>${Math.round(h.ad)}</td></tr><tr><td>Bereik</td><td colspan="2">${c.stats.attackrange}</td></tr><tr><td>Loopsnelheid</td><td colspan="2">${c.stats.movespeed}</td></tr></tbody></table>
      <div class="tag-title">Ratings</div><div class="mute" style="font-size:.85rem">Health ${dots(hpRating(c))}<br>Schade ${dots(dmgRating(c, lane))}</div></div>
  </aside></div>`;

  /* tabbladen */
  $$('[data-ctab]').forEach(b => b.onclick = () => {
    S.ui.ctab = b.dataset.ctab;
    $$('[data-ctab]').forEach(x => x.classList.toggle('on', x === b)); $$('.tabpane').forEach(p => p.classList.toggle('on', p.dataset.pane === S.ui.ctab));
    $('.ch-tabs').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  $$('[data-setup]').forEach(b => b.onclick = () => { S.ui.setup = +b.dataset.setup; renderChamp(app, [id, lane]); });
  $$('[data-spell]').forEach(b => b.onclick = () => { S.ui.spell = +b.dataset.spell; renderChamp(app, [id, lane]); });
  const sel = $('#skinSel'); if (sel) sel.onchange = () => { const bg = $('#chBg'); bg.style.opacity = 0; setTimeout(() => { bg.style.backgroundImage = `url('${splash(c.id, sel.value)}')`; bg.style.opacity = ''; }, 250); };
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

/* ---------- Basisstats, schade & health ---------- */
const hpStats = c => { const s = c.stats, L = 17; return { hp1: s.hp, hp: s.hp + s.hpperlevel * L, ar: s.armor + s.armorperlevel * L, mr: s.spellblock + s.spellblockperlevel * L, ad: s.attackdamage + s.attackdamageperlevel * L, rng: s.attackrange, ms: s.movespeed }; };
let hpRank = null;
function hpRating(c) {
  if (!hpRank) hpRank = S.champList.map(x => hpStats(x).hp).sort((a, b) => a - b);
  const h = hpStats(c).hp; return Math.min(5, Math.max(1, Math.ceil(hpRank.filter(x => x <= h).length / hpRank.length * 5)));
}
const DMG_RATING = { marksman: 5, mage: 5, apAssassin: 5, adAssassin: 5, critSkirmisher: 5, fighter: 4, apFighter: 4, mageSupport: 3, tank: 2, engage: 2, enchanter: 1 };
const dmgRating = (c, lane) => DMG_RATING[archFor(c, lane)] || 3;
const dots = n => '●'.repeat(n) + '○'.repeat(5 - n);
const k0 = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n));
/* echte schadecijfers uit de steekproef (alleen beschikbaar voor matches die met de nieuwe collect.js zijn opgehaald) */
function dmgData(id, lane) {
  const c = S.stats?.lanes?.[lane]?.champs?.[id]; if (!c || !c.dn || !c.min) return null;
  return { n: c.dn, game: c.dmg / c.dn, min: c.dmg / c.min, takenGame: c.taken / c.dn, takenMin: c.taken / c.min };
}
const badges = (c, lane) => {
  const h = hpStats(c), d = dmgData(c.id, lane);
  return `<span class="chip" title="Health op level 18">❤ ${k0(h.hp)}</span><span class="chip ${d ? 'ad' : ''}" title="${d ? `Gemiddelde schade aan champions: ${Math.round(d.min)} per minuut (${d.n} games)` : 'Schade-inschatting op basis van klasse (nog geen matchdata)'}">${d ? '⚔ ' + Math.round(d.min) + '/min' : '⚔ ' + dots(dmgRating(c, lane))}</span>`;
};

/* ---------- Team builder ---------- */
const teamState = { TOP: '', JUNGLE: '', MID: '', ADC: '', SUPPORT: '' };
const teamOpts = { min: true };
const K_SHRINK = 30; // hoe sterk we win rates naar 50% trekken bij weinig games
const teamPicks = () => Object.entries(teamState).map(([lane, n]) => ({ lane, c: findChampByName(n) })).filter(p => p.c);
function shrunk(id, lane) { const st = statOf(id, lane); return st ? (st.c.w + K_SHRINK * .5) / (st.c.g + K_SHRINK) : .5; }

function compProfile(picks) {
  const W = { marksman: 1.2, mage: 1.2, mageSupport: .7, apAssassin: 1, adAssassin: 1, fighter: .8, critSkirmisher: 1, apFighter: .8, tank: .3, engage: .3, enchanter: .15 };
  let wsum = 0, ad = 0, hp = 0, ranged = 0, tanks = 0; const cls = { marksman: 0, mage: 0, assassin: 0, fighter: 0, tank: 0, enchanter: 0 };
  picks.forEach(({ lane, c }) => {
    const ak = archFor(c, lane), A = ARCHETYPES[ak], w = W[ak] || .5; wsum += w;
    ad += w * (A.dmg === 'ad' ? 1 : A.dmg === 'ap' ? 0 : c.info.attack / (c.info.attack + c.info.magic + 1));
    cls[ARCH_CLASS[ak]]++; if (c.stats.attackrange >= 450) ranged++; if (['tank', 'engage'].includes(ak)) tanks++;
    hp += hpStats(c).hp;
  });
  const adP = wsum ? Math.round(100 * ad / wsum) : 50;
  return { adP, apP: 100 - adP, cls, ranged, tanks, hp, n: picks.length };
}

/* Schatting: gemiddelde (naar 50% getrokken) win rate van de champions in hun lane + kleine correcties voor de samenstelling.
   Dit is een inschatting, geen voorspelling: echte synergie tussen champions zit er niet in. */
function estimateTeam(picks) {
  const P = compProfile(picks), adj = {}, n = picks.length;
  let base = 0, games = 0;
  picks.forEach(({ lane, c }) => { base += shrunk(c.id, lane) - .5; const st = statOf(c.id, lane); if (st) games += st.g; });
  base = n ? base / n * 100 : 0;
  const set = (k, v, t) => adj[k] = { v, t };
  if (n >= 2) {
    const m = Math.max(P.adP, P.apP);
    set('dmg', m > 85 ? -3 : m > 75 ? -1.5 : m <= 65 ? .5 : 0, m > 75 ? `te veel ${P.adP > P.apP ? 'AD' : 'AP'}` : 'goede AD/AP-balans');
  }
  if (n >= 3) set('front', P.cls.tank + P.cls.fighter === 0 ? -1.5 : P.tanks >= 1 ? .5 : 0, P.cls.tank + P.cls.fighter === 0 ? 'geen frontline' : 'geeft frontline');
  if (n >= 4) set('carry', P.cls.marksman === 0 ? -1 : 0, 'geeft een marksman');
  if (P.cls.assassin >= 3) set('assn', -1, 'te veel assassins');
  if (P.cls.marksman && P.cls.enchanter) set('peel', .5, 'marksman + enchanter (peel)');
  const wr = Math.max(38, Math.min(62, 50 + base + Object.values(adj).reduce((s, a) => s + a.v, 0)));
  return { wr, base, adj, games, n, P };
}

function suggestFor(lane, picks) {
  const base = estimateTeam(picks), taken = new Set(picks.map(p => p.c.id));
  return lanePool(lane).filter(c => !taken.has(c.id))
    .filter(c => !S.stats || !teamOpts.min || (statOf(c.id, lane)?.g || 0) >= MIN_GAMES)
    .map(c => {
      const e = estimateTeam([...picks, { lane, c }]);
      const reasons = Object.entries(e.adj).filter(([k, a]) => a.v > (base.adj[k]?.v || 0)).map(([, a]) => a.t);
      return { c, lane, e, delta: e.wr - base.wr, reasons, st: statOf(c.id, lane) };
    }).sort((a, b) => b.e.wr - a.e.wr || a.c.info.difficulty - b.c.info.difficulty).slice(0, 8);
}

function renderTeam(app) {
  const picks = teamPicks();
  app.innerHTML = `<h1>Team builder</h1><p class="mute">Vul één of meer champions in. Voor de lege lanes krijg je suggesties; klik op een suggestie om hem in te vullen en direct een win rate-schatting te zien.</p>
  <datalist id="champNames">${S.champList.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>
  <div class="pickrow">${Object.entries(LANES).map(([k, l]) => { const c = findChampByName(teamState[k]); const h = c && hpStats(c);
    return `<div class="slot"><h4>${l.icon} ${l.label}${c ? ` <button class="btn" data-clear="${k}" style="padding:0 8px;float:right" title="Leegmaken">×</button>` : ''}</h4>${c ? `<a href="#/champ/${c.id}/${k}"><img src="${portrait(c)}"></a>` : ''}
      <input class="field" list="champNames" data-slot="${k}" placeholder="Champion…" value="${esc(c ? c.name : teamState[k])}" style="width:100%">
      ${c ? `<div class="pills" style="margin-top:6px">${badges(c, k)}</div>` : ''}</div>`; }).join('')}</div>
  <div class="row" style="margin:12px 0"><button class="btn" id="tClear">Alles leegmaken</button>
   ${S.stats ? `<label class="mute"><input type="checkbox" id="tmin" ${teamOpts.min ? 'checked' : ''}> alleen suggesties met ≥ ${MIN_GAMES} games data</label>` : ''}</div>
  <div id="tsug"></div><div id="tres"></div>`;
  $$('[data-slot]').forEach(inp => inp.addEventListener('change', () => { const c = findChampByName(inp.value); teamState[inp.dataset.slot] = c ? c.name : inp.value; renderTeam(app); }));
  $$('[data-clear]').forEach(b => b.onclick = () => { teamState[b.dataset.clear] = ''; renderTeam(app); });
  $('#tClear').onclick = () => { Object.keys(teamState).forEach(k => teamState[k] = ''); renderTeam(app); };
  if ($('#tmin')) $('#tmin').onchange = e => { teamOpts.min = e.target.checked; renderTeam(app); };
  renderSuggestions($('#tsug'), picks);
  analyseTeam($('#tres'), picks);
}

function renderSuggestions(out, picks) {
  const empty = Object.keys(LANES).filter(l => !teamState[l] || !findChampByName(teamState[l]));
  if (!picks.length) { out.innerHTML = '<div class="empty">Kies hierboven eerst een champion; dan verschijnen hier suggesties voor de andere lanes.</div>'; return; }
  if (!empty.length) { out.innerHTML = ''; return; }
  const cur = estimateTeam(picks);
  out.innerHTML = `<h2>Suggesties voor de lege lanes</h2><p class="mute">Gerangschikt op de geschatte team win rate als je hem kiest (huidig: <b>${cur.wr.toFixed(1)}%</b>). Klik om in te vullen.</p>` +
    empty.map(lane => {
      const s = suggestFor(lane, picks);
      return `<div class="panel"><h3>${LANES[lane].icon} ${LANES[lane].label}</h3>${s.length ? `<div class="sugrow">${s.map(x => `
        <button class="sug" data-pick="${lane}|${x.c.id}"><img src="${portrait(x.c)}" alt=""><div class="sb"><b>${esc(x.c.name)}</b>
          <span class="est">~${x.e.wr.toFixed(1)}% <span class="${x.delta >= 0 ? 'up' : 'down'}">${x.delta >= 0 ? '▲' : '▼'}${Math.abs(x.delta).toFixed(1)}</span></span>
          <span class="mute" style="font-size:.72rem">${x.st ? `${x.st.wr.toFixed(0)}% WR · ${x.st.g} games` : 'geen data'}</span>
          <span class="pills">${badges(x.c, lane)}</span>
          ${x.reasons.length ? `<span class="why">+ ${esc(x.reasons.join(', '))}</span>` : ''}</div></button>`).join('')}</div>` : '<p class="mute">Geen champions met genoeg data in deze lane (zet het vinkje hierboven uit om alles te zien).</p>'}</div>`;
    }).join('');
}

function analyseTeam(out, picks) {
  if (picks.length < 2) { out.innerHTML = picks.length ? '<div class="empty">Kies minstens 2 champions voor een volledige analyse.</div>' : ''; return; }
  const P = compProfile(picks), E = estimateTeam(picks), { adP, apP, cls } = P;
  const msgs = [], bad = t => msgs.push(`<div class="warn">⚠ ${t}</div>`), good = t => msgs.push(`<div class="ok">✔ ${t}</div>`);
  if (adP > 75) bad(`Zwaar AD (${adP}%): de vijand kan armor stapelen. Overweeg een AP-damage dealer.`);
  else if (apP > 75) bad(`Zwaar AP (${apP}%): de vijand kan MR stapelen. Overweeg een AD-damage dealer.`);
  else good(`Mooie balans AD/AP (${adP}% / ${apP}%).`);
  if (picks.length >= 3) { if (cls.tank + cls.fighter === 0) bad('Geen frontline: je team valt snel uiteen in een teamfight.'); else good('Voldoende frontline aanwezig.'); }
  if (picks.length >= 4) {
    if (cls.tank === 0) bad('Geen echte engage/CC-tank: moeilijk om fights te starten.');
    if (cls.marksman === 0) bad('Geen marksman: weinig sustained DPS tegen tanks en objectives (Baron/Drakes).');
    if (cls.assassin >= 3) bad('Te veel assassins: vaak weinig front-to-back schade.');
    if (cls.mage + cls.marksman === 0) bad('Weinig schade: er is geen echte damage dealer.');
    if (cls.enchanter) good('Peel/enchanter aanwezig: je carry’s kunnen veilig doorspelen.');
  }
  let ident = 'Flexibel / mix';
  if (cls.assassin >= 2) ident = 'Dive / Pick-comp – vang carry’s voordat ze kunnen vechten.';
  else if (P.tanks >= 2 && cls.marksman) ident = 'Engage / teamfight – start en laat je carry’s schade maken.';
  else if (cls.mage >= 2 && P.ranged >= 3) ident = 'Poke / Siege – sloop torens van afstand en eis objectives.';
  else if (cls.marksman && cls.enchanter) ident = 'Protect the carry – bescherm je ADC en win door schalen.';
  else if (cls.fighter >= 3) ident = 'Skirmish / split-push – forceer 1v1’s over de hele map.';

  /* tabel met health & schade per champion */
  const rows = picks.map(({ lane, c }) => { const h = hpStats(c), d = dmgData(c.id, lane), st = statOf(c.id, lane), A = ARCHETYPES[archFor(c, lane)];
    return `<tr><td><img src="${portrait(c)}" width="24" height="24" style="border-radius:50%;vertical-align:middle"> ${esc(c.name)} <span class="mute">${LANES[lane].label}</span></td><td>${esc(A.label.split('(')[0].trim())}</td>
    <td>${Math.round(h.hp)} <span class="mute">${dots(hpRating(c))}</span></td><td>${Math.round(h.ar)}</td><td>${Math.round(h.mr)}</td><td>${Math.round(h.ad)}</td>
    <td>${d ? `${Math.round(d.min)}/min <span class="mute">(${d.n}g)</span>` : `<span class="mute">${dots(dmgRating(c, lane))}</span>`}</td><td>${d ? Math.round(d.takenMin) + '/min' : '–'}</td>
    <td>${st ? `${st.wr.toFixed(0)}% <span class="mute">(${st.g}g)</span>` : '–'}</td></tr>`; }).join('');
  const totHp = P.hp, avgAr = picks.reduce((s, p) => s + hpStats(p.c).ar, 0) / picks.length, avgMr = picks.reduce((s, p) => s + hpStats(p.c).mr, 0) / picks.length;
  const withD = picks.map(p => dmgData(p.c.id, p.lane)).filter(Boolean), totDpm = withD.reduce((s, d) => s + d.min, 0);
  const conf = E.games >= 150 * picks.length ? 'hoog' : E.games >= 40 * picks.length ? 'middel' : 'laag';

  out.innerHTML = `<div class="cols"><div class="panel"><h2>Analyse</h2>${msgs.join('')}<p><b>Teamidentiteit:</b> ${esc(ident)}</p></div>
  <div class="panel"><h2>📈 Geschatte win rate</h2><div style="font-size:2.2rem;font-family:Georgia,serif;color:var(--gold2)">${E.wr.toFixed(1)}%</div>
   <div class="pills"><span class="chip">basis uit champion-WR’s: ${(50 + E.base).toFixed(1)}%</span>${Object.values(E.adj).map(a => `<span class="chip ${a.v > 0 ? 'gold' : a.v < 0 ? 'ad' : ''}">${a.v > 0 ? '+' : ''}${a.v.toFixed(1)} ${esc(a.t)}</span>`).join('')}</div>
   <p class="mute" style="font-size:.8rem;margin-top:8px">Betrouwbaarheid: <b>${conf}</b> (${E.games} games in de steekproef). Dit is een <b>schatting</b>: gemiddelde win rate per champion in zijn lane (naar 50% getrokken bij weinig games) plus kleine correcties voor samenstelling. Echte synergie tussen specifieke champions zit er niet in.</p></div></div>
  <div class="panel"><h2>Health &amp; schade per champion</h2><div style="overflow:auto"><table class="tbl"><thead><tr><th>Champion</th><th>Klasse</th><th>HP lvl 18</th><th>Armor</th><th>MR</th><th>AD</th><th>Schade</th><th>Schade genomen</th><th>Win rate</th></tr></thead><tbody>${rows}</tbody></table></div>
   <div class="stats-row" style="margin:12px 0 0"><div class="stat"><b>${k0(totHp)}</b><span>totale health (lvl 18)</span></div><div class="stat"><b>${Math.round(avgAr)} / ${Math.round(avgMr)}</b><span>gem. armor / MR</span></div>
   ${withD.length ? `<div class="stat"><b>${Math.round(totDpm)}</b><span>schade/min (${withD.length} van ${picks.length} met data)</span></div>` : ''}
   <div class="stat" style="min-width:220px"><div class="bar"><i class="ad" style="width:${adP}%"></i><i class="ap" style="width:${apP}%"></i></div><span>AD ${adP}% · AP ${apP}%</span></div></div>
   <p class="mute" style="font-size:.78rem">Schade en schade genomen komen uit je matchdata (alleen voor games die met de nieuwste collect.js zijn opgehaald). Zonder data zie je een inschatting op basis van de klasse (●●●●●).</p></div>`;
}

/* ---------- Statistiekenpagina: health & schade van alle champions ---------- */
const statsUi = { lane: '', q: '', sort: 'hp', dir: -1, min: true };
function renderStats(app, [lane = '']) {
  statsUi.lane = LANES[lane] ? lane : statsUi.lane;
  const hasD = S.stats && Object.values(S.stats.lanes).some(L => Object.values(L.champs).some(c => c.dn));
  app.innerHTML = `<h1>Statistieken</h1><p class="mute">Vergelijk champions op health, defense en schade om te kiezen wat bij je past: veel health = taai, weinig health = kwetsbaar maar vaak meer schade.${hasD ? '' : ' <b>Schade-cijfers uit matchdata</b> verschijnen zodra je nieuwe games ophaalt met <code>refresh.bat</code>.'}</p>
  <div class="toolbar"><select id="sl"><option value="">Alle lanes</option>${Object.entries(LANES).map(([k, l]) => `<option value="${k}" ${statsUi.lane === k ? 'selected' : ''}>${l.label}</option>`).join('')}</select>
  <input id="sq" placeholder="Zoek champion…" value="${esc(statsUi.q)}">${S.stats ? `<label class="mute"><input type="checkbox" id="smin" ${statsUi.min ? 'checked' : ''}> min. ${MIN_GAMES} games data</label>` : ''}<span class="mute" id="sc"></span></div>
  <div style="overflow:auto"><table class="tbl" id="stbl"></table></div>`;
  const COLS = [['name', 'Champion'], ['lane', 'Lane'], ['cls', 'Klasse'], ['hp', 'HP lvl 18'], ['ar', 'Armor'], ['mr', 'MR'], ['ehp', 'Eff. HP (fys.)'], ['ad', 'AD lvl 18'], ['rng', 'Bereik'], ['ms', 'MS'], ['g', 'Games'], ['wr', 'Win rate'], ['dpm', 'Schade/min'], ['tpm', 'Genomen/min']];
  const draw = () => {
    statsUi.lane = $('#sl').value; statsUi.q = $('#sq').value; statsUi.min = $('#smin') ? $('#smin').checked : false;
    let rows = [];
    S.champList.filter(c => c.name.toLowerCase().includes(statsUi.q.toLowerCase())).forEach(c => (statsUi.lane ? (lanesOf(c).includes(statsUi.lane) ? [statsUi.lane] : []) : lanesOf(c).slice(0, 1)).forEach(l => {
      const h = hpStats(c), st = statOf(c.id, l), d = dmgData(c.id, l);
      rows.push({ c, l, name: c.name, lane: LANES[l].label, cls: ARCHETYPES[archFor(c, l)].label.split('(')[0].trim(), hp: h.hp, ar: h.ar, mr: h.mr, ehp: h.hp * (1 + h.ar / 100), ad: h.ad, rng: h.rng, ms: h.ms, g: st?.g ?? -1, wr: st?.wr ?? -1, dpm: d?.min ?? -1, tpm: d?.takenMin ?? -1 });
    }));
    if (S.stats && statsUi.min) rows = rows.filter(r => r.g >= MIN_GAMES);
    const k = statsUi.sort, dir = statsUi.dir;
    rows.sort((a, b) => (typeof a[k] === 'string' ? a[k].localeCompare(b[k]) : a[k] - b[k]) * dir || a.name.localeCompare(b.name));
    const f = v => v < 0 ? '<span class="mute">–</span>' : v;
    $('#stbl').innerHTML = `<thead><tr>${COLS.map(([key, label]) => `<th data-sort="${key}" style="cursor:pointer">${label}${statsUi.sort === key ? (dir < 0 ? ' ▼' : ' ▲') : ''}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>
      <td><a href="#/champ/${r.c.id}/${r.l}"><img src="${portrait(r.c)}" width="24" height="24" style="border-radius:50%;vertical-align:middle"> ${esc(r.name)}</a></td><td>${r.lane}</td><td>${esc(r.cls)}</td>
      <td>${Math.round(r.hp)}</td><td>${Math.round(r.ar)}</td><td>${Math.round(r.mr)}</td><td>${Math.round(r.ehp)}</td><td>${Math.round(r.ad)}</td><td>${r.rng}</td><td>${r.ms}</td>
      <td>${f(r.g)}</td><td>${r.wr < 0 ? '<span class="mute">–</span>' : r.wr.toFixed(1) + '%'}</td><td>${r.dpm < 0 ? '<span class="mute">–</span>' : Math.round(r.dpm)}</td><td>${r.tpm < 0 ? '<span class="mute">–</span>' : Math.round(r.tpm)}</td></tr>`).join('')}</tbody>`;
    $('#sc').textContent = `${rows.length} rijen`;
    $$('#stbl th').forEach(th => th.onclick = () => { const key = th.dataset.sort; if (statsUi.sort === key) statsUi.dir *= -1; else { statsUi.sort = key; statsUi.dir = (key === 'name' || key === 'lane' || key === 'cls') ? 1 : -1; } draw(); });
  };
  ['sl', 'sq', 'smin'].forEach(id => $('#' + id)?.addEventListener('input', draw)); draw();
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
  const pk = e.target.closest('[data-pick]');
  if (pk) { const [lane, id] = pk.dataset.pick.split('|'); teamState[lane] = S.champs[id].name; renderTeam($('#app')); return; }
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

/* ---------- Menu, footer ---------- */
$('#navToggle').addEventListener('click', () => { const o = $('#nav').classList.toggle('open'); $('#navToggle').setAttribute('aria-expanded', String(o)); });
$('#ddBtn').addEventListener('click', e => { e.stopPropagation(); const o = $('#ddMenu').classList.toggle('open'); $('#ddBtn').setAttribute('aria-expanded', String(o)); });
document.addEventListener('click', e => { if (!e.target.closest('.dd')) $('#ddMenu').classList.remove('open'); });
$('#year').textContent = new Date().getFullYear();

