/* Combo-tips. Notatie: Q W E R = skills, AA = basisaanval, P = passive.
   Het zijn basiscombo's om mee te beginnen; oefen ze in de Practice Tool (Aangepast spel → Practice Tool). */
window.RC_COMBOS = {
  Seraphine: [
    { n: 'Lane-poke', k: 'Q AA Q', t: 'Poke met Q en gebruik je passive: elke derde spell wordt dubbel gecast. Een AA tussendoor geeft bonus magische schade als je dicht bij bondgenoten staat.' },
    { n: 'Teamfight-engage', k: 'W R E Q', t: 'W voor shield en snelheid op je team, R door zoveel mogelijk champions heen (hij wordt langer en betovert iedereen die hij raakt), dan E om te vertragen (al vertraagde vijanden worden geroot) en Q als schade.' },
  ],
  Syndra: [
    { n: 'Stun-combo', k: 'Q E W R', t: 'Zet een bol met Q neer, sla hem met E tegen de vijand (vijanden die door een bol worden geraakt, worden gestund), pak dan een bol of minion met W en gooi hem, en maak af met R (die gebruikt al je bollen).' },
    { n: 'Poke / vertragen', k: 'W Q E', t: 'Een W op de vijand vertraagt hem, waardoor je Q makkelijker raakt. Houd E achter de hand om te stunnen als je een bol goed hebt liggen.' },
    { n: 'Tip', k: 'R', t: 'Hoe meer bollen er liggen wanneer je R gebruikt, hoe meer schade. Bouw dus eerst bollen op.' },
  ],
  Illaoi: [
    { n: 'Vessel-combo', k: 'E W Q AA', t: 'Trek met E de geest uit je doelwit, spring met W naar hem toe (tentakels slaan mee), Q voor extra tentakel-schade en AA ertussendoor. Vecht altijd naast je tentakels.' },
    { n: 'Teamfight', k: 'R E W Q', t: 'R eerst: elke geraakte champion krijgt een tentakel. Daarna E op de gevaarlijkste vijand en W/Q op de geest.' },
  ],
  Draven: [
    { n: 'Lane-trade', k: 'Q AA W AA E', t: 'Q voor je bijl en AA, vang elke bijl (loop ernaartoe) en gebruik W voor snelheid. E om te knocken of te vertragen als je wilt blijven staan.' },
    { n: 'Finisher', k: 'E R AA', t: 'E om te vertragen, R vanaf afstand; R executeert vijanden met minder health dan je Adoration-stacks. Reactiveer R om hem terug te laten komen.' },
  ],
  Jinx: [
    { n: 'Stoppen en afmaken', k: 'E W AA R', t: 'Plaats E voor je (wortelt vijanden die erop lopen), W voor slow en vision, AA met je minigun voor schade en R als finisher (meer schade bij weinig health).' },
  ],
  Lux: [
    { n: 'Standaard burst', k: 'E Q AA R', t: 'E vertraagt, dan raakt Q makkelijker (roott twee vijanden). AA voor je passive en R om af te maken. Laat E detonaten voor extra schade.' },
    { n: 'Lange afstand', k: 'R', t: 'R heeft enorm bereik. Houd een rode richtlijn in de gaten; vijanden met weinig health kun je vanaf de overkant van de map afmaken.' },
  ],
  Pantheon: [
    { n: 'Stun-trade', k: 'W AA Q AA E', t: 'W om te stunnen, AA, Q voor schade en AA daarna. Mortal Will (passive) maakt elke vijfde spell of aanval sterker; plan je trade zo dat hij erbij valt.' },
  ],
  Lucian: [
    { n: 'Standaard', k: 'E AA Q AA W AA', t: 'Gebruik na elke ability meteen een AA (dubbelschot van je passive). E eerst om in positie te komen, Q om te raken, W voor markering en bonus snelheid.' },
  ],
  Ahri: [
    { n: 'Burst', k: 'E Q W AA R', t: 'Charm eerst (de vijand loopt naar je toe), daarna raken Q en W bijna altijd. AA, en R om in positie te blijven of weg te springen na de kill.' },
  ],
  Yuumi: [
    { n: 'Aanvallen', k: 'Q E R', t: 'Terwijl je aan een bondgenoot zit, kun je Q met je cursor besturen. E versnelt en versterkt je carry, R voor genezing en schade wanneer het gevecht begint.' },
  ],
  MasterYi: [
    { n: 'Engage', k: 'R E Q AA', t: 'R en E voor snelheid en extra schade, spring met Q op de gevaarlijkste vijand en gebruik AA om je Q-cooldown te verkorten. Je Q laat je ook ontwijken.' },
  ],
  Kaisa: [
    { n: 'Plasma-pop', k: 'AA W AA E AA', t: 'Stapel plasma met AA en W (4 stacks laten het schade doen). E versnelt je aanvalssnelheid. Gebruik R om op een geïsoleerde vijand te landen.' },
  ],
  Yasuo: [
    { n: 'EQ-combo', k: 'E Q', t: 'Dash met E door een minion naar de vijand en druk meteen Q: de cirkel-Q raakt iedereen om je heen. Heb je 3 stacks, dan knock-upt de tornado.' },
    { n: 'Knock-up + ultimate', k: 'Q Q E Q R', t: 'Twee Q-aanvallen laden de tornado op, de derde slaat de vijand omhoog; E+Q volgt op en R werkt alleen op een vijand die in de lucht hangt.' },
  ],
  Morgana: [
    { n: 'Binding-combo', k: 'Q W R', t: 'Q (root), W op de geroote vijand en R wanneer ze binnen bereik zijn. Bewaar E (Black Shield) voor hun CC.' },
  ],
  Leona: [
    { n: 'Engage', k: 'E Q AA R', t: 'E om in te springen, Q + AA voor de stun, en R om meerdere champions vast te zetten. W geeft armor en MR tijdens het gevecht.' },
  ],
  Xerath: [
    { n: 'Stun + poke', k: 'E W Q R', t: 'E (stun) en een W in het midden raken meestal; Q laad je op naar maximaal bereik. R vuurt 3 schoten af op afstand.' },
  ],
  Zed: [
    { n: 'All-in', k: 'R W E Q AA', t: 'R eerst op je doelwit, dan W en E, en Q met je schaduwen. Wissel met W weer van plek voordat Death Mark afgaat voor een veilige ontsnapping.' },
  ],
  Thresh: [
    { n: 'Hook-combo', k: 'Q E Q', t: 'Q (hook), E om de vijand naar je toe of juist weg te slaan, en Q opnieuw om jezelf naar hem te trekken. W bewaar je voor een bondgenoot in nood.' },
  ],
  Blitzcrank: [
    { n: 'Standaard', k: 'Q E AA R', t: 'Q (grab), E voor Power Fist (knock-up) en AA terwijl hij vastzit, R voor extra schade en silence.' },
  ],
  Nautilus: [
    { n: 'Engage', k: 'Q AA W E R', t: 'Q (hook), laat je AA de vijand rooten (passive), W shield en E om te vertragen. R om af te maken.' },
  ],
  LeeSin: [
    { n: 'Basiscombo', k: 'Q Q E W', t: 'Q raakt, dan Q opnieuw om naar hem te vliegen, E voor schade en vertraging en W voor een shield. Combineer met AA tussen de spells.' },
    { n: 'Insec', k: 'W R', t: 'Spring met W (Ward Hop) achter de vijand en gebruik R om hem naar je team te schoppen.' },
  ],
  Vi: [
    { n: 'Standaard', k: 'Q R AA E W', t: 'Laad Q helemaal op, gebruik R om vast te zetten en gebruik E tussen AA’s. Je W verlaagt hun armor na drie treffers.' },
  ],
  Annie: [
    { n: 'Stun-combo', k: 'E W Q R', t: 'Elke vierde spell stunt (passive). Gebruik E en W om stacks te laden en Q/R voor schade. Houd je stun bij voor je ultimate.' },
  ],
  Veigar: [
    { n: 'Kooi-combo', k: 'E W Q R', t: 'Zet E neer zodat vijanden erin staan (de rand stunt), laat W landen, gebruik Q voor extra schade en R voor de afmaker (meer schade bij weinig health).' },
  ],
  Garen: [
    { n: 'Standaard', k: 'Q AA E R', t: 'Q voor silence en snelheid, AA, E (spin) voor schade en R wanneer de vijand laag staat voor een execute.' },
  ],
  Darius: [
    { n: 'Trade-combo', k: 'E AA W Q R', t: 'Trek vijanden met E naar je toe, W voor een versterkte aanval, Q op de rand van de bijl voor volle schade en genezing. R als je 5 Hemorrhage-stacks hebt.' },
  ],
  Malphite: [
    { n: 'Engage', k: 'R Q E W AA', t: 'R om te starten (knock-up), Q om te vertragen, E voor aanvalssnelheid-slow en W voor schade met je aanvallen.' },
  ],
  Lulu: [
    { n: 'Bescherm je carry', k: 'E W Q', t: 'E op een bondgenoot voor een shield, W op een vijand (polymorph) die op je carry duikt, Q om te vertragen. R om je tank of carry groter en taaier te maken.' },
  ],
  Jhin: [
    { n: 'Vierde schot', k: 'W AA Q', t: 'W roott vijanden die kort geleden door jou of je bondgenoten zijn geraakt. Het vierde schot (crit) is je belangrijkste moment; gebruik Q tussendoor.' },
  ],
};

/* Algemene combo-principes per archetype (voor champions zonder eigen combo) */
window.RC_COMBO_TIPS = {
  marksman: ['Kiten: AA → bewegen → AA. Schade maak je tijdens je aanvallen, niet tijdens het lopen.', 'Gebruik eerst je slow of root (vaak W of E) en pas daarna je volle schade.', 'Bewaar je ultimate om af te maken of om een duik te stoppen.'],
  mage: ['Eerst CC (stun, root of slow), daarna je hoogste schade en dan de ultimate als finisher.', 'Houd altijd een ontsnapping of CC achter de hand voor als de vijand op je springt.', 'Poke als je mana het toelaat; ga all-in als hun cooldowns op zijn.'],
  mageSupport: ['Open met een poke-skill die ze moet laten dodgen, en volg op met je CC.', 'Gebruik je CC op de vijand die je ADC wil aanvallen of die jouw team bedreigt.'],
  apAssassin: ['Burst: dash in → belangrijkste schade → ult. Neem de kwetsbaarste vijand, niet de dichtstbijzijnde.', 'Gebruik je ontsnapping pas als de burst klaar is; reset je cooldowns met een kill.'],
  adAssassin: ['Spring in met je dash, gebruik je burst en ga eruit voordat hun CC klaarstaat.', 'Spaar je ultimate voor een kill of om te ontsnappen.'],
  fighter: ['Trade op jouw cooldown-voordeel: AA tussen je spells, en gebruik skills die je AA resetten.', 'Gebruik CC of een dash om de vijand vast te zetten voordat je je schade neerlegt.'],
  critSkirmisher: ['Combineer je dash met AA’s; je schade zit in aanvallen, dus blijf bij je doelwit.', 'Gebruik je shield of ontwijking op het moment dat hun CC komt.'],
  apFighter: ['Zet je belangrijkste skill op de vijand, gebruik daarna je AA tussen je abilities.', 'Neem een korte trade en trek terug als je cooldowns leeg zijn.'],
  tank: ['Gebruik je CC op de carry van de vijand, niet op de dichtstbijzijnde tank.', 'Open het gevecht met je engage en laat je team aansluiten; blijf niet alleen voor.'],
  engage: ['Engage met je hook, dash of knock-up en volg direct op met je tweede CC. Timing is belangrijker dan snelheid.', 'Gebruik je ultimate wanneer meerdere vijanden bij elkaar staan.'],
  enchanter: ['Bewaar shield, heal en ultimate voor het moment dat je carry wordt aangevallen.', 'Poke alleen als dat veilig is; je team heeft jou op volle mana nodig voor het gevecht.'],
};
