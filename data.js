/* Handmatig samengestelde kennis: lanes, archetypes, runes, items, tips.
   Champion-, item- en runedata zelf komt live uit Riot Data Dragon. */

const LANES = {
  TOP:     { label: 'Top',     icon: '⚔️', desc: 'Eilandje-lane: 1v1, side-lane druk en teleports.' },
  JUNGLE:  { label: 'Jungle',  icon: '🌲', desc: 'Kampen, objectives en ganks. De regisseur van de map.' },
  MID:     { label: 'Mid',     icon: '✨', desc: 'Centrale lane: roam, wave control en burst.' },
  ADC:     { label: 'ADC',     icon: '🏹', desc: 'Bot carry: constante schade in teamfights.' },
  SUPPORT: { label: 'Support', icon: '🛡️', desc: 'Visie, engage, peel en bescherming van de carry.' },
};

/* Eerste lane = primair, de rest = flex. Champions die hier ontbreken worden automatisch afgeleid uit hun tags. */
const CHAMP_LANES = {
  Aatrox:'TOP', Ahri:'MID', Akali:'MID,TOP', Akshan:'MID,ADC', Alistar:'SUPPORT', Ambessa:'TOP,JUNGLE', Amumu:'JUNGLE,SUPPORT',
  Anivia:'MID', Annie:'MID,SUPPORT', Aphelios:'ADC', Ashe:'ADC,SUPPORT', AurelionSol:'MID', Aurora:'MID,TOP', Azir:'MID',
  Bard:'SUPPORT', Belveth:'JUNGLE', Blitzcrank:'SUPPORT', Brand:'SUPPORT,MID,JUNGLE', Braum:'SUPPORT', Briar:'JUNGLE',
  Caitlyn:'ADC', Camille:'TOP,SUPPORT', Cassiopeia:'MID,TOP,ADC', Chogath:'TOP,MID,JUNGLE', Corki:'MID,ADC', Darius:'TOP',
  Diana:'MID,JUNGLE', Draven:'ADC', DrMundo:'TOP,JUNGLE', Ekko:'JUNGLE,MID', Elise:'JUNGLE', Evelynn:'JUNGLE', Ezreal:'ADC,MID',
  Fiddlesticks:'JUNGLE,SUPPORT', Fiora:'TOP', Fizz:'MID', Galio:'MID,SUPPORT', Gangplank:'TOP', Garen:'TOP', Gnar:'TOP',
  Gragas:'JUNGLE,TOP,SUPPORT', Graves:'JUNGLE', Gwen:'TOP,MID', Hecarim:'JUNGLE', Heimerdinger:'MID,TOP,SUPPORT', Hwei:'MID,SUPPORT',
  Illaoi:'TOP', Irelia:'TOP,MID', Ivern:'JUNGLE', Janna:'SUPPORT', JarvanIV:'JUNGLE', Jax:'TOP,JUNGLE', Jayce:'TOP,MID',
  Jhin:'ADC', Jinx:'ADC', Kaisa:'ADC', Kalista:'ADC', Karma:'SUPPORT,MID,TOP', Karthus:'JUNGLE,MID,ADC', Kassadin:'MID',
  Katarina:'MID', Kayle:'TOP,MID', Kayn:'JUNGLE', Kennen:'TOP,MID', Khazix:'JUNGLE', Kindred:'JUNGLE', Kled:'TOP',
  KogMaw:'ADC,MID', KSante:'TOP', Leblanc:'MID', LeeSin:'JUNGLE', Leona:'SUPPORT', Lillia:'JUNGLE,TOP', Lissandra:'MID,TOP',
  Lucian:'ADC,MID', Lulu:'SUPPORT,MID', Lux:'SUPPORT,MID', Malphite:'TOP,SUPPORT,MID', Malzahar:'MID', Maokai:'SUPPORT,JUNGLE,TOP',
  MasterYi:'JUNGLE', Mel:'MID,SUPPORT', Milio:'SUPPORT', MissFortune:'ADC,SUPPORT', MonkeyKing:'TOP,JUNGLE', Mordekaiser:'TOP,JUNGLE',
  Morgana:'SUPPORT,JUNGLE,MID', Naafiri:'MID,JUNGLE', Nami:'SUPPORT', Nasus:'TOP', Nautilus:'SUPPORT,TOP', Neeko:'MID,SUPPORT',
  Nidalee:'JUNGLE', Nilah:'ADC', Nocturne:'JUNGLE', Nunu:'JUNGLE', Olaf:'TOP,JUNGLE', Orianna:'MID', Ornn:'TOP', Pantheon:'TOP,SUPPORT,MID,JUNGLE',
  Poppy:'TOP,JUNGLE,SUPPORT', Pyke:'SUPPORT', Qiyana:'MID,JUNGLE', Quinn:'TOP', Rakan:'SUPPORT', Rammus:'JUNGLE', RekSai:'JUNGLE',
  Rell:'SUPPORT', Renata:'SUPPORT', Renekton:'TOP', Rengar:'JUNGLE,TOP', Riven:'TOP', Rumble:'TOP,MID,JUNGLE', Ryze:'MID,TOP',
  Samira:'ADC', Sejuani:'JUNGLE', Senna:'SUPPORT,ADC', Seraphine:'SUPPORT,MID,ADC', Sett:'TOP,SUPPORT', Shaco:'JUNGLE,SUPPORT',
  Shen:'TOP,SUPPORT', Shyvana:'JUNGLE', Singed:'TOP', Sion:'TOP', Sivir:'ADC', Skarner:'JUNGLE', Smolder:'ADC,MID,TOP', Sona:'SUPPORT',
  Soraka:'SUPPORT', Swain:'SUPPORT,MID,TOP', Sylas:'MID,JUNGLE', Syndra:'MID', TahmKench:'SUPPORT,TOP', Taliyah:'MID,JUNGLE',
  Talon:'MID,JUNGLE', Taric:'SUPPORT', Teemo:'TOP', Thresh:'SUPPORT', Tristana:'ADC,MID', Trundle:'TOP,JUNGLE', Tryndamere:'TOP',
  TwistedFate:'MID', Twitch:'ADC,JUNGLE', Udyr:'JUNGLE,TOP', Urgot:'TOP', Varus:'ADC,MID', Vayne:'ADC,TOP', Veigar:'MID,SUPPORT,ADC',
  Velkoz:'SUPPORT,MID', Vex:'MID', Vi:'JUNGLE', Viego:'JUNGLE', Viktor:'MID', Vladimir:'MID,TOP', Volibear:'TOP,JUNGLE',
  Warwick:'JUNGLE,TOP', Xayah:'ADC', Xerath:'MID,SUPPORT', XinZhao:'JUNGLE', Yasuo:'MID,TOP,ADC', Yone:'MID,TOP', Yorick:'TOP',
  Yunara:'ADC', Yuumi:'SUPPORT', Zaahen:'TOP,JUNGLE', Zac:'JUNGLE,TOP', Zed:'MID,JUNGLE', Zeri:'ADC', Ziggs:'MID,ADC,SUPPORT',
  Zilean:'SUPPORT,MID', Zoe:'MID,SUPPORT', Zyra:'SUPPORT,JUNGLE',
};

/* Archetype-overrides voor champions waarvan de Riot-tags geen goed beeld geven. Key mag "Id" of "Id:LANE" zijn. */
const ARCH_OVERRIDE = {
  Akali:'apAssassin', Diana:'apFighter', Ekko:'apAssassin', Elise:'apAssassin', Evelynn:'apAssassin', Fizz:'apAssassin', Kassadin:'apAssassin',
  Katarina:'apAssassin', Leblanc:'apAssassin', Nidalee:'apAssassin', Sylas:'apFighter', Qiyana:'adAssassin', Shaco:'adAssassin', Talon:'adAssassin',
  Zed:'adAssassin', Khazix:'adAssassin', Rengar:'adAssassin', Naafiri:'adAssassin', Kayn:'adAssassin', Nocturne:'adAssassin', Pyke:'adAssassin',
  MasterYi:'critSkirmisher', Tryndamere:'critSkirmisher', Yasuo:'critSkirmisher', Yone:'critSkirmisher', Kalista:'marksman',
  Gwen:'apFighter', Rumble:'apFighter', Mordekaiser:'apFighter', Singed:'apFighter', Lillia:'apFighter', Kayle:'apFighter', Teemo:'apFighter',
  Volibear:'fighter', Fiddlesticks:'mage', Karthus:'mage', Brand:'mage', Zyra:'mageSupport', Swain:'apFighter', Vladimir:'apFighter',
  Ryze:'mage', Cassiopeia:'mage', Heimerdinger:'mage', Elise_:'apAssassin', Rammus:'tank', Zac:'tank', Sejuani:'tank', Skarner:'tank',
  Maokai:'tank', Nunu:'tank', Amumu:'tank', Malphite:'tank', Ornn:'tank', Shen:'tank', Poppy:'tank', Sion:'tank', Chogath:'tank',
  Alistar:'engage', Leona:'engage', Nautilus:'engage', Rell:'engage', Braum:'engage', Thresh:'engage', Blitzcrank:'engage', Rakan:'engage', TahmKench:'engage', Taric:'engage',
  Ivern:'enchanter', Soraka:'enchanter', Janna:'enchanter', Lulu:'enchanter', Nami:'enchanter', Sona:'enchanter', Karma:'mageSupport', Yuumi:'enchanter',
  Milio:'enchanter', Renata:'enchanter', Seraphine:'mageSupport', Bard:'enchanter', Zilean:'mageSupport', Lux:'mage', Morgana:'mageSupport',
  Senna:'marksman', Ezreal:'marksman', Corki:'marksman', Jayce:'adAssassin', Graves:'adAssassin', Kindred:'marksman', Quinn:'adAssassin', Akshan:'marksman',
  Draven:'marksman', Hwei:'mage', Ziggs:'mage', Xerath:'mage', Velkoz:'mage', Neeko:'mage', Anivia:'mage', Aurora:'apAssassin', Mel:'mage',
  Smolder:'marksman', Vayne:'marksman', Kled:'fighter', Warwick:'fighter', Udyr:'fighter', Belveth:'critSkirmisher', Briar:'fighter', Viego:'critSkirmisher',
  Fiora:'fighter', Camille:'fighter', Irelia:'fighter', Jax:'fighter', Riven:'fighter', Renekton:'fighter', Darius:'fighter', Garen:'fighter',
};

/* Klasse per archetype voor matchup-berekeningen */
const ARCH_CLASS = {
  marksman:'marksman', mage:'mage', mageSupport:'mage', apAssassin:'assassin', adAssassin:'assassin',
  fighter:'fighter', critSkirmisher:'fighter', apFighter:'fighter', tank:'tank', engage:'tank', enchanter:'enchanter',
};
const CLASS_ADV = {
  assassin:{ mage:2, marksman:2, enchanter:2, fighter:-1, tank:-1, assassin:0 },
  mage:    { tank:1, fighter:0, assassin:-1, marksman:0, enchanter:1, mage:0 },
  fighter: { assassin:1, mage:1, marksman:1, tank:0, enchanter:1, fighter:0 },
  tank:    { assassin:1, marksman:0, mage:-1, fighter:-1, enchanter:0, tank:0 },
  marksman:{ tank:1, fighter:-1, assassin:-1, mage:0, enchanter:1, marksman:0 },
  enchanter:{ assassin:-1, fighter:-1, mage:0, marksman:0, tank:0, enchanter:0 },
};

const KEYSTONE_ICON_NOTE = 'Runes/items komen uit Data Dragon; aanbevelingen zijn indicatief.';

/* Archetypes: playstyle, tips, item- en runekeuzes (op naam – wordt tegen de live data opgezocht). */
const ARCHETYPES = {
  marksman: {
    label:'Marksman / ADC', dmg:'ad',
    desc:'Constante fysieke (of on-hit) schade op afstand. Zwak in het begin van een fight, dodelijk als hij beschermd wordt.',
    win:'Farm veilig, bereik je power spikes en blijf leven in teamfights; focus altijd de dichtstbijzijnde veilige target.',
    spikes:['Level 2 & 3 (lane-trade)', 'Eerste afgeronde item', 'Level 11 (ult) en 2 afgeronde items', '3 items = hoofdrol in teamfights'],
    laning:['Last-hit consequent; CS is je belangrijkste bron van goud.','Kijk waar de vijandelijke jungler is voor je pusht.','Trade als hun support een cooldown mist, niet op goed geluk.','Freeze de wave in je eigen torenzone als je achterstaat.'],
    weights:{ AttackSpeed:3, CriticalStrike:3, Damage:2.5, LifeSteal:1, OnHit:1.5, ArmorPenetration:1.5, SpellDamage:-4, Armor:-1, Health:-0.5, Mana:-1, AbilityHaste:-0.5 },
    boots:["Berserker's Greaves","Boots of Swiftness","Plated Steelcaps","Mercury's Treads"],
    core:["Kraken Slayer","Infinity Edge","Phantom Dancer","Immortal Shieldbow","Bloodthirster","Lord Dominik's Regards","Rapid Firecannon","Runaan's Hurricane","Navori Flickerblade","Navori Quickblades","Statikk Shiv","Guardian Angel","Mortal Reminder","Essence Reaver"],
    sit:{ armor:["Guardian Angel","Randuin's Omen"], mr:["Maw of Malmortius","Mercurial Scimitar","Quicksilver Sash"], antiheal:["Mortal Reminder","Chempunk Chainsword","Executioner's Calling"], pen:["Lord Dominik's Regards","Mortal Reminder","Serylda's Grudge"], defensive:["Guardian Angel","Immortal Shieldbow","Maw of Malmortius"] },
    runes:[
      { name:'Lethal Tempo – standaard', key:'Lethal Tempo', primary:['Triumph','Legend: Alacrity','Coup de Grace'], sec:['Taste of Blood','Treasure Hunter'], shards:['AttackSpeed','AdaptiveForce','HealthScaling'], note:'Sterkste all-round keuze voor langdurige fights en tanks.' },
      { name:'Press the Attack – burst', key:'Press the Attack', primary:['Presence of Mind','Legend: Bloodline','Cut Down'], sec:['Sudden Impact','Relentless Hunter'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Voor agressieve lanes met veel korte trades.' },
      { name:'Fleet Footwork – veilig', key:'Fleet Footwork', primary:['Presence of Mind','Legend: Alacrity','Last Stand'], sec:['Bone Plating','Second Wind'], shards:['AttackSpeed','AdaptiveForce','HealthScaling'], note:'Voor lanes waar je veel schade incasseert (poke / early agressie).' },
    ],
  },
  mage: {
    label:'Mage (AP burst / control)', dmg:'ap',
    desc:'Magische schade met skillshots en crowd control. Kwetsbaar voor assassins en dives, sterk in wave control.',
    win:'Beheer de wave, push als je weg wilt roamen, en combineer burst met je team voor picks en objectives.',
    spikes:['Level 6 (ult)', 'Eerste afgeronde item', 'Level 9-11', 'Rabadon\'s Deathcap / 3 items'],
    laning:['Stack minions vóór je wegloopt: roamen met een grote wave in de vijandelijke torenzone dwingt tempo.','Houd je mana in de gaten; poke alleen als je er wat mee wint.','Kijk naar de minimap voor gank-timers; buy een Control Ward.','Spaar je flash voor het ontwijken van een gank.'],
    weights:{ SpellDamage:3.5, MagicPenetration:2, AbilityHaste:1.2, Mana:1, ManaRegen:0.5, Health:0.3, Damage:-4, AttackSpeed:-2, CriticalStrike:-3, Armor:-0.5 },
    boots:["Sorcerer's Shoes","Ionian Boots of Lucidity","Boots of Swiftness","Mercury's Treads"],
    core:["Luden's Companion","Luden's Echo","Liandry's Torment","Liandry's Anguish","Shadowflame","Rabadon's Deathcap","Cosmic Drive","Horizon Focus","Zhonya's Hourglass","Void Staff","Banshee's Veil","Stormsurge","Rod of Ages","Archangel's Staff","Rylai's Crystal Scepter","Seraph's Embrace","Hextech Rocketbelt","Cryptbloom","Morellonomicon"],
    sit:{ armor:["Zhonya's Hourglass"], mr:["Banshee's Veil","Cosmic Drive"], antiheal:["Morellonomicon","Oblivion Orb"], pen:["Void Staff","Cryptbloom","Shadowflame"], defensive:["Zhonya's Hourglass","Banshee's Veil","Seraph's Embrace"] },
    runes:[
      { name:'Electrocute – burst', key:'Electrocute', primary:['Sudden Impact','Grisly Mementos','Ultimate Hunter'], sec:['Manaflow Band','Gathering Storm'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Voor snelle burst-combo’s en picks.' },
      { name:'Arcane Comet – poke', key:'Arcane Comet', primary:['Manaflow Band','Transcendence','Scorch'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Voor artillery-mages die op afstand pokken.' },
      { name:'Deathfire Touch – DoT', key:'Deathfire Touch', primary:['Axiom Arcanist','Absolute Focus','Gathering Storm'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Nieuwe keystone: brandschade over tijd, sterk voor mages met veel ability-hits.' },
      { name:"Stormraider's Surge – mobiliteit", key:"Stormraider's Surge", primary:['Nimbus Cloak','Transcendence','Gathering Storm'], sec:['Hextech Flashtraption','Biscuit Delivery'], shards:['AdaptiveForce','MovementSpeed','HealthScaling'], note:'Goed tegen melee-champions die je willen bereiken.' },
    ],
  },
  mageSupport: {
    label:'Mage Support (poke / pick)', dmg:'ap',
    desc:'Agressieve support met schade en crowd control. Perfect voor poke-lanes en picks in de rivier.',
    win:'Zet druk op de lane, win de wave-war en bied vision/picks voor objectives.',
    spikes:['Level 2 & 3', 'Level 6', 'Eerste afgeronde item'],
    laning:['Poke alleen als hun support geen engage-cooldown heeft.','Pak vision rond objectives; sweep voor de spawn.','Spel samen met je ADC: jouw CC = hun kill.'],
    weights:{ SpellDamage:3, MagicPenetration:1.5, AbilityHaste:1.5, Mana:1, ManaRegen:1, Health:0.3, Damage:-4, AttackSpeed:-2 },
    boots:["Sorcerer's Shoes","Ionian Boots of Lucidity","Boots of Swiftness"],
    core:["Luden's Companion","Luden's Echo","Shadowflame","Horizon Focus","Cosmic Drive","Zhonya's Hourglass","Liandry's Torment","Liandry's Anguish","Staff of Flowing Water","Imperial Mandate","Banshee's Veil"],
    sit:{ armor:["Zhonya's Hourglass"], mr:["Banshee's Veil"], antiheal:["Morellonomicon"], pen:["Void Staff","Shadowflame"], defensive:["Zhonya's Hourglass","Banshee's Veil"] },
    runes:[
      { name:'Arcane Comet – poke', key:'Arcane Comet', primary:['Manaflow Band','Transcendence','Scorch'], sec:['Hextech Flashtraption','Cosmic Insight'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Standaard voor supports met veel poke.' },
      { name:'Electrocute – burst', key:'Electrocute', primary:['Sudden Impact','Grisly Mementos','Relentless Hunter'], sec:['Manaflow Band','Transcendence'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Voor kill-lanes met veel burst.' },
      { name:'Summon Aery – hybride', key:'Summon Aery', primary:['Manaflow Band','Transcendence','Scorch'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Als je schade én bescherming wilt.' },
    ],
  },
  apAssassin: {
    label:'AP Assassin', dmg:'ap',
    desc:'Burst in een paar seconden, hoge mobiliteit, kwetsbaar zonder cooldowns.',
    win:'Snowball met kills, rol door de map en vang cruciale doelwitten (carry’s, mages).',
    spikes:['Level 3 (combo compleet)', 'Level 6', 'Eerste afgeronde item'],
    laning:['Wacht met trades tot je skills klaar zijn.','Zoek openingen voor roams; je mobiliteit is je wapen.','Respecteer pull-ganks: ga niet alleen over de map zonder wards.'],
    weights:{ SpellDamage:3, MagicPenetration:2.5, AbilityHaste:1.5, Health:0.5, Damage:-4, AttackSpeed:-3, CriticalStrike:-3 },
    boots:["Sorcerer's Shoes","Ionian Boots of Lucidity","Boots of Swiftness"],
    core:["Hextech Rocketbelt","Luden's Companion","Luden's Echo","Shadowflame","Rabadon's Deathcap","Void Staff","Zhonya's Hourglass","Night Harvester","Lich Bane","Nashor's Tooth","Cryptbloom","Stormsurge","Banshee's Veil","Rod of Ages"],
    sit:{ armor:["Zhonya's Hourglass"], mr:["Banshee's Veil"], antiheal:["Morellonomicon"], pen:["Void Staff","Cryptbloom"], defensive:["Zhonya's Hourglass","Banshee's Veil"] },
    runes:[
      { name:'Electrocute', key:'Electrocute', primary:['Sudden Impact','Grisly Mementos','Ultimate Hunter'], sec:['Manaflow Band','Gathering Storm'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Standaard voor burst-assassins.' },
      { name:'Dark Harvest', key:'Dark Harvest', primary:['Sudden Impact','Grisly Mementos','Ultimate Hunter'], sec:['Magical Footwear','Cosmic Insight'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Wordt beter naarmate de game vordert (kills / souls).' },
      { name:'Hail of Blades', key:'Hail of Blades', primary:['Sudden Impact','Grisly Mementos','Relentless Hunter'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AttackSpeed','AdaptiveForce','HealthScaling'], note:'Voor all-in trades vroeg in de lane.' },
    ],
  },
  adAssassin: {
    label:'AD Assassin / Lethality', dmg:'ad',
    desc:'Fysieke burst met veel mobiliteit. Dode lijn op squishy targets.',
    win:'Win door tempo, picks en vroege pressure; sluit games af voordat tanks te sterk worden.',
    spikes:['Level 3', 'Level 6', 'Eerste afgeronde item (lethality)'],
    laning:['Gebruik je mobiliteit om te wisselen en weg te lopen.','Roam bij eerste voordeel; je ult maakt je dodelijk.','Koop Control Ward en duik pas na het kijken naar vijandelijke cooldowns.'],
    weights:{ Damage:3, ArmorPenetration:3, AbilityHaste:1, Health:0.3, SpellDamage:-4, AttackSpeed:0.3, CriticalStrike:-1, Mana:-1 },
    boots:["Ionian Boots of Lucidity","Plated Steelcaps","Boots of Swiftness","Mercury's Treads"],
    core:["Youmuu's Ghostblade","Opportunity","Edge of Night","Serylda's Grudge","Profane Hydra","Axiom Arc","Hubris","Eclipse","Voltaic Cyclosword","Duskblade of Draktharr","Serpent's Fang","Ravenous Hydra","Black Cleaver","Maw of Malmortius"],
    sit:{ armor:["Guardian Angel","Randuin's Omen"], mr:["Maw of Malmortius","Edge of Night"], antiheal:["Mortal Reminder","Chempunk Chainsword","Executioner's Calling"], pen:["Serylda's Grudge","Mortal Reminder","Black Cleaver"], defensive:["Guardian Angel","Maw of Malmortius","Edge of Night"] },
    runes:[
      { name:'Electrocute', key:'Electrocute', primary:['Sudden Impact','Grisly Mementos','Ultimate Hunter'], sec:['Magical Footwear','Biscuit Delivery'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Standaard burst voor assassins.' },
      { name:'Hail of Blades', key:'Hail of Blades', primary:['Sudden Impact','Grisly Mementos','Relentless Hunter'], sec:['Magical Footwear','Biscuit Delivery'], shards:['AttackSpeed','AdaptiveForce','HealthScaling'], note:'Aggro lane-fases of jungle-ganks.' },
      { name:'First Strike', key:'First Strike', primary:['Magical Footwear','Biscuit Delivery','Cosmic Insight'], sec:['Sudden Impact','Relentless Hunter'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Biedt goud + schade bij tempo-picks.' },
    ],
  },
  fighter: {
    label:'Fighter / Bruiser', dmg:'ad',
    desc:'Schade en uithoudingsvermogen in één. Sterk in 1v1 en skirmishes, flexibel voor side-lane of dive.',
    win:'Win 1v1-lanes, wissel schade met zelfvertrouwen en gebruik je power spikes om te snowballen.',
    spikes:['Level 2-3', 'Level 6', 'Eerste afgeronde item', 'Twee items'],
    laning:['Trade met ability-cooldown voordeel, niet bij een vuist-op-vuist.','Gebruik je hogere levelkracht om side-lane te forceren.','Weet wanneer je moet teleporteren vs. split pushen.'],
    weights:{ Damage:2, Health:2, AbilityHaste:1.5, ArmorPenetration:1, AttackSpeed:1, LifeSteal:1, Armor:0.7, SpellBlock:0.7, SpellDamage:-3, CriticalStrike:-0.5 },
    boots:["Plated Steelcaps","Mercury's Treads","Ionian Boots of Lucidity","Boots of Swiftness"],
    core:["Trinity Force","Black Cleaver","Sterak's Gage","Death's Dance","Spear of Shojin","Ravenous Hydra","Titanic Hydra","Maw of Malmortius","Steraks Gage","Eclipse","Iceborn Gauntlet","Hullbreaker","Overlord's Bloodmail","Sundered Sky","Cyclosword","Voltaic Cyclosword"],
    sit:{ armor:["Frozen Heart","Randuin's Omen","Thornmail"], mr:["Maw of Malmortius","Spirit Visage","Force of Nature"], antiheal:["Mortal Reminder","Chempunk Chainsword","Executioner's Calling","Thornmail"], pen:["Black Cleaver","Serylda's Grudge","Lord Dominik's Regards"], defensive:["Death's Dance","Sterak's Gage","Guardian Angel","Maw of Malmortius"] },
    runes:[
      { name:'Conqueror – standaard', key:'Conqueror', primary:['Triumph','Legend: Haste','Last Stand'], sec:['Bone Plating','Unflinching'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Meest veelzijdig voor lange fights.' },
      { name:"Stormraider's Surge – kiten", key:"Stormraider's Surge", primary:['Nimbus Cloak','Celerity','Gathering Storm'], sec:['Bone Plating','Second Wind'], shards:['AdaptiveForce','MovementSpeed','HealthScaling'], note:'Als je ranged tegenstanders wilt aanvallen / ontsnappen.' },
      { name:'Grasp of the Undying – sustain', key:'Grasp of the Undying', primary:['Shield Bash','Conditioning','Overgrowth'], sec:['Triumph','Legend: Haste'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Veilige lane tegen poke-matchups.' },
    ],
  },
  critSkirmisher: {
    label:'Crit / AS Skirmisher', dmg:'ad',
    desc:'Snelle aanvaller die op crits en attack speed schaalt. Hoge skill ceiling, enorme schade als je veilig blijft.',
    win:'Win vroege duels, pak kills en schaal in de late game tot een onstopbare carry.',
    spikes:['Eerste afgeronde item (spike!)', 'Level 6', 'Twee items'],
    laning:['Ken je spikes: speel passief tot je item klaar is.','Gebruik wave management om vroege dives te bufferen.','Pas je builds aan op vijandelijke tanks.'],
    weights:{ AttackSpeed:3, CriticalStrike:3, Damage:2, LifeSteal:1, ArmorPenetration:1.5, MovementSpeed:0.5, SpellDamage:-4 },
    boots:["Berserker's Greaves","Plated Steelcaps","Boots of Swiftness","Mercury's Treads"],
    core:["Immortal Shieldbow","Infinity Edge","Phantom Dancer","Statikk Shiv","Navori Flickerblade","Navori Quickblades","Bloodthirster","Guardian Angel","Rapid Firecannon","Runaan's Hurricane","Lord Dominik's Regards","Mortal Reminder","Kraken Slayer","Terminus"],
    sit:{ armor:["Guardian Angel","Randuin's Omen"], mr:["Maw of Malmortius","Mercurial Scimitar"], antiheal:["Mortal Reminder","Chempunk Chainsword"], pen:["Lord Dominik's Regards","Mortal Reminder"], defensive:["Guardian Angel","Immortal Shieldbow","Maw of Malmortius"] },
    runes:[
      { name:'Conqueror', key:'Conqueror', primary:['Triumph','Legend: Alacrity','Last Stand'], sec:['Bone Plating','Unflinching'], shards:['AdaptiveForce','AttackSpeed','HealthScaling'], note:'Aanbevolen voor lange 1v1’s.' },
      { name:'Lethal Tempo', key:'Lethal Tempo', primary:['Triumph','Legend: Alacrity','Coup de Grace'], sec:['Taste of Blood','Treasure Hunter'], shards:['AttackSpeed','AdaptiveForce','HealthScaling'], note:'Voor snelle DPS en crit-build.' },
      { name:'Press the Attack', key:'Press the Attack', primary:['Presence of Mind','Legend: Bloodline','Cut Down'], sec:['Bone Plating','Second Wind'], shards:['AdaptiveForce','AttackSpeed','HealthScaling'], note:'Burst-trade voor snelle winst.' },
    ],
  },
  apFighter: {
    label:'AP Bruiser / Battlemage', dmg:'ap',
    desc:'Magische schade met genoeg HP/duurzaamheid om fights te forceren. Sterk in langdurige skirmishes.',
    win:'Bepaal het tempo, wissel op cooldown-voordeel en gebruik je sustain in teamfights.',
    spikes:['Level 3', 'Level 6', 'Eerste afgeronde item', 'Twee items'],
    laning:['Gebruik je sustain om in lane te blijven; trade met ability-cooldown.','Bouw bij tanks penetratie, bij squishies burst.','Respecteer kiters; houd altijd Flash achter de hand.'],
    weights:{ SpellDamage:3, Health:1.5, AbilityHaste:1.5, MagicPenetration:1.5, Mana:0.5, Armor:0.4, SpellBlock:0.4, Damage:-3, AttackSpeed:-1 },
    boots:["Sorcerer's Shoes","Mercury's Treads","Ionian Boots of Lucidity","Plated Steelcaps"],
    core:["Liandry's Torment","Liandry's Anguish","Rod of Ages","Riftmaker","Zhonya's Hourglass","Cosmic Drive","Rylai's Crystal Scepter","Demonic Embrace","Rabadon's Deathcap","Seraph's Embrace","Void Staff","Banshee's Veil","Hextech Rocketbelt","Nashor's Tooth","Spirit Visage","Lich Bane"],
    sit:{ armor:["Zhonya's Hourglass","Frozen Heart"], mr:["Banshee's Veil","Spirit Visage","Force of Nature"], antiheal:["Morellonomicon","Oblivion Orb"], pen:["Void Staff","Cryptbloom"], defensive:["Zhonya's Hourglass","Banshee's Veil"] },
    runes:[
      { name:"Stormraider's Surge", key:"Stormraider's Surge", primary:['Nimbus Cloak','Celerity','Gathering Storm'], sec:['Second Wind','Bone Plating'], shards:['AdaptiveForce','MovementSpeed','HealthScaling'], note:'Hit-and-run bruisers.' },
      { name:'Electrocute', key:'Electrocute', primary:['Sudden Impact','Grisly Mementos','Ultimate Hunter'], sec:['Manaflow Band','Gathering Storm'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Voor burst-builds.' },
      { name:'Conqueror', key:'Conqueror', primary:['Triumph','Legend: Haste','Last Stand'], sec:['Bone Plating','Unflinching'], shards:['AdaptiveForce','AdaptiveForce','HealthScaling'], note:'Lange skirmishes.' },
    ],
  },
  tank: {
    label:'Tank / Frontline', dmg:'tank',
    desc:'Veel HP en weerstanden, harde CC. De muur waar je team achter schuilt.',
    win:'Absorbeer damage, start fights, bescherm je carry’s en zorg dat de vijand cooldowns verspilt.',
    spikes:['Level 3', 'Level 6', 'Eerste afgeronde item', 'Armor/MR-items afhankelijk van vijand'],
    laning:['Speel solide, farm veilig en wacht tot je jungler komt.','Bouw armor of MR op basis van het grootste dreigingstype.','Zoek engage-timings: wanneer vijandelijke cooldowns op zijn.'],
    weights:{ Health:2.5, Armor:2, SpellBlock:2, AbilityHaste:1, Tenacity:1, HealthRegen:0.5, SpellDamage:-1.5, Damage:-1, CriticalStrike:-3, AttackSpeed:-2 },
    boots:["Plated Steelcaps","Mercury's Treads","Ionian Boots of Lucidity","Boots of Swiftness"],
    core:["Sunfire Aegis","Heartsteel","Thornmail","Randuin's Omen","Jak'Sho, The Protean","Warmog's Armor","Spirit Visage","Force of Nature","Kaenic Rookern","Unending Despair","Frozen Heart","Gargoyle Stoneplate","Abyssal Mask","Iceborn Gauntlet","Hollow Radiance","Dead Man's Plate","Knight's Vow","Locket of the Iron Solari","Zeke's Convergence","Anathema's Chains"],
    sit:{ armor:["Thornmail","Randuin's Omen","Frozen Heart","Dead Man's Plate"], mr:["Force of Nature","Spirit Visage","Kaenic Rookern","Abyssal Mask","Hollow Radiance"], antiheal:["Thornmail","Chempunk Chainsword"], pen:["Black Cleaver","Serylda's Grudge"], defensive:["Warmog's Armor","Gargoyle Stoneplate","Locket of the Iron Solari"] },
    runes:[
      { name:'Grasp of the Undying', key:'Grasp of the Undying', primary:['Shield Bash','Conditioning','Overgrowth'], sec:['Triumph','Legend: Haste'], shards:['AdaptiveForce','HealthScaling','HealthScaling'], note:'Ideaal voor top lane en sustainable trades.' },
      { name:'Aftershock', key:'Aftershock', primary:['Font of Life','Conditioning','Unflinching'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AdaptiveForce','HealthScaling','HealthScaling'], note:'Engage-tanks die willen starten en overleven.' },
      { name:'Guardian', key:'Guardian', primary:['Font of Life','Bone Plating','Revitalize'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AdaptiveForce','HealthScaling','HealthScaling'], note:'Voor protect-kracht en support-tanks.' },
    ],
  },
  engage: {
    label:'Engage Support', dmg:'tank',
    desc:'Initiatie met harde CC en bescherming. Zet fights op en kan carry’s redden.',
    win:'Start picks bij vijandelijke carry’s en zorg voor vision; synchroniseer met je ADC.',
    spikes:['Level 2', 'Level 6', 'Eerste afgeronde item'],
    laning:['Zoek de juiste engage-timing, anders sta je blootgesteld.','Houd vision bij de rivier en plaats Control Wards.','Communiceer met je ADC: wanneer jij gaat, gaan ze mee.'],
    weights:{ Health:2, Armor:2, SpellBlock:2, AbilityHaste:2, Aura:1, Tenacity:1, HealthRegen:0.5, Damage:-1.5, SpellDamage:-1, CriticalStrike:-3 },
    boots:["Plated Steelcaps","Mercury's Treads","Ionian Boots of Lucidity","Boots of Swiftness"],
    core:["Locket of the Iron Solari","Zeke's Convergence","Knight's Vow","Redemption","Sunfire Aegis","Frozen Heart","Thornmail","Randuin's Omen","Gargoyle Stoneplate","Unending Despair","Mikael's Blessing","Shurelya's Battlesong","Imperial Mandate","Abyssal Mask","Hollow Radiance"],
    sit:{ armor:["Thornmail","Randuin's Omen","Frozen Heart"], mr:["Abyssal Mask","Spirit Visage","Force of Nature"], antiheal:["Thornmail"], pen:[], defensive:["Locket of the Iron Solari","Knight's Vow","Redemption"] },
    runes:[
      { name:'Aftershock', key:'Aftershock', primary:['Font of Life','Conditioning','Unflinching'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AdaptiveForce','HealthScaling','HealthScaling'], note:'Standaard voor engage-supports.' },
      { name:'Guardian', key:'Guardian', primary:['Font of Life','Bone Plating','Overgrowth'], sec:['Hextech Flashtraption','Cosmic Insight'], shards:['AdaptiveForce','HealthScaling','HealthScaling'], note:'Bescherming bij ADC’s die veel schade incasseren.' },
      { name:'Glacial Augment', key:'Glacial Augment', primary:['Hextech Flashtraption','Magical Footwear','Cosmic Insight'], sec:['Font of Life','Bone Plating'], shards:['AdaptiveForce','HealthScaling','HealthScaling'], note:'Meer controle met slows, lekker tegen mobiele targets.' },
    ],
  },
  enchanter: {
    label:'Enchanter / Healer', dmg:'sup',
    desc:'Heals, shields en buffs. Maakt je carry onstuitbaar, maar heeft weinig eigen veiligheid.',
    win:'Houd je carry levend, win via sustain en bescherm tegen dives.',
    spikes:['Level 2', 'Level 6', 'Eerste afgeronde item', 'Mikael’s/Redemption timing'],
    laning:['Zorg dat je ADC veilig kan farmen; jouw shield/heal bepaalt trades.','Positioneer achter je team en wacht op de dive.','Houd vision bij objectives en rond je jungle.'],
    weights:{ AbilityHaste:3, ManaRegen:2, Aura:2, SpellDamage:1, Health:0.5, Mana:1, Damage:-3, AttackSpeed:-1, CriticalStrike:-3 },
    boots:["Ionian Boots of Lucidity","Boots of Swiftness","Mercury's Treads","Plated Steelcaps"],
    core:["Moonstone Renewer","Staff of Flowing Water","Ardent Censer","Redemption","Mikael's Blessing","Shurelya's Battlesong","Imperial Mandate","Locket of the Iron Solari","Dawncore","Echoes of Helia","Chemtech Putrifier","Harmonic Echo","Zhonya's Hourglass","Banshee's Veil"],
    sit:{ armor:["Zhonya's Hourglass","Locket of the Iron Solari"], mr:["Banshee's Veil","Mikael's Blessing"], antiheal:["Chemtech Putrifier","Morellonomicon"], pen:["Shadowflame"], defensive:["Mikael's Blessing","Redemption","Locket of the Iron Solari"] },
    runes:[
      { name:'Guardian', key:'Guardian', primary:['Font of Life','Bone Plating','Revitalize'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AbilityHaste','AdaptiveForce','HealthScaling'], note:'Meest veilig als je een kwetsbare ADC beschermt.' },
      { name:'Summon Aery', key:'Summon Aery', primary:['Manaflow Band','Transcendence','Gathering Storm'], sec:['Font of Life','Revitalize'], shards:['AbilityHaste','AdaptiveForce','HealthScaling'], note:'Voor supports die veel poke- en shield-synergie hebben.' },
      { name:'Arcane Comet', key:'Arcane Comet', primary:['Manaflow Band','Transcendence','Scorch'], sec:['Biscuit Delivery','Cosmic Insight'], shards:['AbilityHaste','AdaptiveForce','HealthScaling'], note:'Als je meer schade wilt bijdragen.' },
    ],
  },
};

/* Summoner spells per lane/archetype */
const SPELLS = {
  TOP:     [['Flash','Teleport'], ['Flash','Ignite'], ['Flash','Ghost']],
  JUNGLE:  [['Smite','Flash'], ['Smite','Ghost']],
  MID:     [['Flash','Ignite'], ['Flash','Teleport'], ['Flash','Barrier']],
  ADC:     [['Flash','Heal'], ['Flash','Barrier'], ['Flash','Cleanse'], ['Flash','Ignite']],
  SUPPORT: [['Flash','Ignite'], ['Flash','Exhaust'], ['Flash','Heal'], ['Flash','Cleanse']],
};
const SPELL_BY_ARCH = {
  enchanter:[['Flash','Heal'], ['Flash','Ignite'], ['Flash','Exhaust']],
  engage:[['Flash','Ignite'], ['Flash','Exhaust'], ['Flash','Cleanse']],
};

/* Starters */
const STARTER_BY_DMG = { ad:'Doran\'s Blade', ap:'Doran\'s Ring', tank:'Doran\'s Shield', sup:'World Atlas' };
const JUNGLE_PETS = ['Gustwalker Hatchling','Mosstomper Seedling','Scorchclaw Pup'];

/* Specifieke item-voorkeuren per champion (naam → eigen kernbuild) */
const CHAMP_CORE = {
  Ezreal:["Muramana","Manamune","Trinity Force","Sundered Sky","Essence Reaver","Black Cleaver","Serylda's Grudge"],
  Kaisa:["Kraken Slayer","Nashor's Tooth","Rabadon's Deathcap","Guinsoo's Rageblade","Void Staff","Zhonya's Hourglass"],
  Vayne:["Kraken Slayer","Blade of the Ruined King","Guinsoo's Rageblade","Phantom Dancer","Infinity Edge","Bloodthirster"],
  Lucian:["Trinity Force","Infinity Edge","Navori Flickerblade","Navori Quickblades","Essence Reaver","Lord Dominik's Regards"],
  Jhin:["Infinity Edge","Rapid Firecannon","Collector","Shadowflame","Lord Dominik's Regards","Fimbulwinter"],
  Draven:["Infinity Edge","Bloodthirster","Phantom Dancer","Lord Dominik's Regards","Rapid Firecannon"],
  KogMaw:["Guinsoo's Rageblade","Blade of the Ruined King","Wit's End","Runaan's Hurricane","Terminus","Nashor's Tooth"],
  Yasuo:["Immortal Shieldbow","Infinity Edge","Statikk Shiv","Navori Flickerblade","Navori Quickblades","Death's Dance","Bloodthirster"],
  Yone:["Immortal Shieldbow","Infinity Edge","Navori Flickerblade","Navori Quickblades","Death's Dance","Bloodthirster"],
  Kayle:["Nashor's Tooth","Guinsoo's Rageblade","Blade of the Ruined King","Wit's End","Rabadon's Deathcap","Lich Bane"],
  Teemo:["Liandry's Torment","Liandry's Anguish","Nashor's Tooth","Rabadon's Deathcap","Cosmic Drive","Zhonya's Hourglass"],
  Jayce:["Trinity Force","Hubris","Youmuu's Ghostblade","Sundered Sky","Black Cleaver","Serylda's Grudge"],
  Veigar:["Rod of Ages","Rabadon's Deathcap","Shadowflame","Void Staff","Cosmic Drive","Zhonya's Hourglass"],
  Ryze:["Rod of Ages","Archangel's Staff","Seraph's Embrace","Rabadon's Deathcap","Cosmic Drive","Zhonya's Hourglass"],
  Karthus:["Luden's Companion","Luden's Echo","Liandry's Torment","Shadowflame","Rabadon's Deathcap","Void Staff"],
  Cassiopeia:["Rod of Ages","Archangel's Staff","Rabadon's Deathcap","Zhonya's Hourglass","Void Staff"],
  Tryndamere:["Immortal Shieldbow","Infinity Edge","Phantom Dancer","Navori Flickerblade","Bloodthirster"],
  MasterYi:["Kraken Slayer","Guinsoo's Rageblade","Blade of the Ruined King","Phantom Dancer","Infinity Edge","Bloodthirster"],
  Gangplank:["Trinity Force","Infinity Edge","Navori Flickerblade","Navori Quickblades","Phantom Dancer","Statikk Shiv"],
  Fiora:["Ravenous Hydra","Titanic Hydra","Trinity Force","Sterak's Gage","Death's Dance","Maw of Malmortius"],
  Garen:["Sunfire Aegis","Trinity Force","Sterak's Gage","Spirit Visage","Death's Dance","Black Cleaver"],
  Olaf:["Black Cleaver","Sterak's Gage","Death's Dance","Spirit Visage","Titanic Hydra","Ravenous Hydra"],
  Nasus:["Sundered Sky","Trinity Force","Spirit Visage","Titanic Hydra","Sunfire Aegis","Randuin's Omen"],
};

/* Gedeelde skill-tips */
const GENERIC_TIPS = [
  'Koop Control Wards: elke recall minstens één (en gebruik ze).',
  'Check de minimap elke paar seconden, zeker na elke fight.',
  'Speel rond objectives: Dragon/Baron/Torens zijn belangrijker dan kills.',
  'Pas je build aan op wat de vijand speelt – niet elk spel is hetzelfde.',
];

/* Item-categorieën voor de item-browser */
const ITEM_FILTERS = [
  ['Damage','Aanvalskracht'], ['SpellDamage','Magisch vermogen'], ['CriticalStrike','Crit'], ['AttackSpeed','Aanvalssnelheid'],
  ['LifeSteal','Life steal'], ['SpellVamp','Spell vamp'], ['ArmorPenetration','Armor pen'], ['MagicPenetration','Magic pen'],
  ['Armor','Armor'], ['SpellBlock','Magische weerstand'], ['Health','Health'], ['HealthRegen','HP regen'],
  ['AbilityHaste','Ability haste'], ['Mana','Mana'], ['ManaRegen','Mana regen'], ['NonbootsMovement','Beweging'],
  ['Boots','Laarzen'], ['OnHit','On-hit'], ['Active','Actief'], ['Aura','Aura'], ['Slow','Slow'], ['Consumable','Consumable'],
  ['Trinket','Trinket'], ['Vision','Vision'], ['Jungle','Jungle'], ['Lane','Lane'],
];

const STAT_LABELS = {
  FlatPhysicalDamageMod:'AD', FlatMagicDamageMod:'AP', FlatHPPoolMod:'HP', FlatMPPoolMod:'Mana',
  FlatArmorMod:'Armor', FlatSpellBlockMod:'MR', PercentAttackSpeedMod:'AS', FlatCritChanceMod:'Crit',
  PercentLifeStealMod:'Life steal', FlatMovementSpeedMod:'MS', PercentMovementSpeedMod:'MS%', FlatHPRegenMod:'HP regen',
};
