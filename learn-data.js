/* Leerinhoud voor de leer-modus. Algemene spelkennis; richtwaarden zijn indicaties, geen officiële Riot-cijfers. */
window.RC_LEARN = {
  /* richtwaarden per lane voor "hoe sta je ervoor" (ranked, midden van het spel) */
  bench: {
    TOP:     { cspm: 6.0, deaths: 5, kp: 45, vpm: 0.7 },
    JUNGLE:  { cspm: 5.0, deaths: 5, kp: 60, vpm: 0.9 },
    MID:     { cspm: 6.5, deaths: 5, kp: 55, vpm: 0.8 },
    ADC:     { cspm: 7.0, deaths: 5, kp: 55, vpm: 0.8 },
    SUPPORT: { cspm: 1.2, deaths: 5, kp: 60, vpm: 1.8 },
  },

  lane: {
    TOP: ['Top is een eiland: jij en je tegenstander vechten vaak 1v1. Wave management (de golf minions beheren) is belangrijker dan mechanica.',
      'Laat de eerste minionwave naar je toe komen en farm onder je eigen toren veilig; ga niet te vroeg vooruit.',
      'Een wave dichtbij je toren houden (freeze) dwingt de vijand om risico te nemen. Een wave pushen geeft je tijd om te recallen of te roamen.',
      'Je teleport heb je nodig voor objectives en om een verloren lane terug te komen; gebruik hem liever om bij een gevecht te komen dan om te vluchten.',
      'Kijk elke paar seconden op de minimap: de vijandelijke jungler kan je aanvallen, en een ward in de bush bij je lane is goud waard.'],
    JUNGLE: ['Een goede jungler plant zijn route: ruim je kampen efficiënt en weet waar de vijandelijke jungler waarschijnlijk is.',
      'Gank alleen als de lane er klaar voor is: de vijand moet gepusht staan, geen vision hebben of zijn skills hebben verbruikt.',
      'Houd objectives (draken, grubs/herald, Baron) in de gaten: begin er tijdig mee en kom met je team.',
      'Gebruik Smite bewust: oefen het raken van objectives in de Practice Tool, want een gemiste Smite kost een objective.',
      'Jungle-tempo betekent: na een gank terugkeren naar je kampen of objective, niet doelloos rondlopen.'],
    MID: ['Mid is de centrale lane: de afstand naar elke zijlane is kort, dus roamen is je kracht.',
      'Push eerst de wave (zodat je minions de toren raken) en ga dan pas roamen; zo verlies je geen farm.',
      'Houd je mana in de gaten en poke alleen als je er iets mee wint. Zonder mana kun je geen gevecht winnen.',
      'Bewaar je flash voor het ontwijken van een gank; sterf liever niet voor de vijandelijke mid.',
      'Plaats control wards in de bushes bij je lane en in de rivier om ganks te zien aankomen.'],
    ADC: ['De ADC is de schadebron van het team: jouw prioriteit is farmen en leven.',
      'Je lane is een duo: speel samen met je support, en vraag wanneer zij gaan engageren. Trade alleen als hun skills op cooldown zijn.',
      'Blijf achter je minions en kijk waar de vijandelijke jungler is voordat je naar voren stapt.',
      'Eerste afgeronde item is je grote spike: farm tot dat moment en neem dan pas meer risico.',
      'In teamfights: blijf op afstand, val de dichtstbijzijnde veilige doelwitten aan (kiten) en blijf dicht bij je team.'],
    SUPPORT: ['Als support bepaal je het tempo van je lane en bescherm je je ADC.',
      'Vision is je belangrijkste taak: koop control wards, plaats ze bij objectives en veeg wards van de vijand weg.',
      'Je skills zijn je trades: gebruik ze wanneer de vijand ze niet kan beantwoorden, en bewaar CC voor het moment dat iemand je ADC aanvalt.',
      'Na de laningfase kun je roamen naar andere lanes; laat je ADC dan niet alleen als de vijand sterk is.',
      'Weet wat je carry nodig heeft: bescherming, engage of schade, en pas je spel daarop aan.'],
  },

  arch: {
    marksman: {
      early: ['Farm veilig en laat de minions naar je toe komen; elke last-hit telt.', 'Trade alleen als de skills van de vijand op cooldown staan of als hun support niet kan reageren.', 'Haal je eerste afgeronde item zo snel mogelijk: dat is je eerste grote kracht.'],
      mid: ['Neem het voortouw bij objectives (drakes) samen met je team.', 'Blijf in beweging en kijk op de minimap voordat je een zijlane inloopt.', 'Gebruik je ultimate om af te maken of om een duik van de vijand te stoppen.'],
      fight: ['Kiten: aanvallen op maximaal bereik, bewegen tussen aanvallen.', 'Val de dichtstbijzijnde veilige doelwitten aan; wacht tot hun CC verbruikt is.', 'Blijf achter je frontline en gebruik je ontsnapping of CC op de duiker.'],
      mistakes: ['Te ver naar voren staan zonder vision.', 'Vechten zonder je support in de buurt.', 'Je ultimate op een willekeurig moment gebruiken.', 'Stoppen met farmen omdat je alleen kills wilt.'],
      drills: ['Last-hit 10 minuten lang in de Practice Tool; doel: 60 CS op minuut 10.', 'Oefen kiten op een dummy: aanvallen, bewegen, aanvallen — 2 minuten zonder te stoppen.', 'Oefen je skills op bewegende doelen (laat een bot of dummy bewegen).', 'Gebruik je ontsnapping vlak voor een inkomende skillshot — herhaal 10 keer.'],
    },
    mage: {
      early: ['Farm met je goedkoopste skill en bewaar mana voor de belangrijkste trades.', 'Gebruik je CC of poke vooral wanneer de vijand een minion wil raken.', 'Let op vijandelijke ganks: ward de bush en bewaar je flash.'],
      mid: ['Roam met een gepushte wave en help andere lanes.', 'Stel je power spikes in gedachten (level 6, eerste item) en neem op die momenten meer risico.', 'Neem objectives mee als de vijand gevochten heeft.'],
      fight: ['Open met je CC, gebruik dan je hoogste schade en maak af met je ultimate.', 'Blijf achter je frontline en gebruik skillshots die je team helpen.', 'Houd een ontsnapping of CC achter de hand tegen duikers.'],
      mistakes: ['Alles in één keer gebruiken en daarna geen verdediging meer hebben.', 'Te ver naar voren lopen om te poken.', 'Mana verspillen op minions die je ook met een basisaanval kon doden.'],
      drills: ['Oefen elke skill op een bewegend doelwit; doel: 7 van de 10 raak.', 'Oefen je combo zonder fouten (zie het blok Combo\'s), 20 keer achter elkaar.', 'Oefen last-hitten met je skills en kijk hoeveel mana je gebruikt.', 'Oefen een ontsnapping vlak voordat een duiker op je landt.'],
    },
    assassin: {
      early: ['Farm veilig tot level 3 of 6 en kies het moment van je eerste aanval; je bent sterker als je skills klaar staan.', 'Zoek de vijand met de minste health of een kwetsbare doelwit.', 'Houd je ontsnapping bewaard voor na je burst.'],
      mid: ['Roam om kills te halen: een gepushte wave en vision van de vijandelijke jungler zijn je voorwaarden.', 'Pak solo-kills en laat je team niet alleen.', 'Neem de vijandelijke carry bij een objective of als zij uit hun positie lopen.'],
      fight: ['Wacht tot de vijandelijke CC is verbruikt en duik dan op de carry.', 'Gebruik je burst volledig en ga eruit zodra je cooldowns leeg zijn.', 'Een kill die je cooldowns reset is de beste vorm van doorgaan.'],
      mistakes: ['Instappen zonder te weten waar hun CC is.', 'Je ontsnapping gebruiken om in te springen.', 'Blijven vechten terwijl je cooldowns leeg zijn.'],
      drills: ['Oefen je combo zo snel mogelijk uit te voeren (10 keer foutloos).', 'Oefen de timing: dash in, burst, dash eruit — zonder dood te gaan op de dummy.', 'Oefen een duik over een toren en kom er levend uit met een bot-doelwit.', 'Oefen het resetten van cooldowns door minions te doden voor een kill.'],
    },
    fighter: {
      early: ['Trade wanneer jouw skills klaarstaan en die van de vijand niet; je wint door timing.', 'Vecht bij je minions als je sterker bent; pas op bij vijanden die je kunnen kiten.', 'Kijk naar de wave: een grote golf bij jouw toren geeft de vijand de kans je te gankken.'],
      mid: ['Kies of je splitpusht of met je team vecht; beide kunnen, maar zorg dat het verstandig is.', 'Hou je teleport (als je die hebt) voor een belangrijk moment.', 'Neem 1v1\'s met je sterke items en laat de vijand bij je komen.'],
      fight: ['Duik in op een carry als je erbij kunt, anders sluit je aan op de dichtstbijzijnde bedreiging.', 'Gebruik je CC en schade samen: eerst vastzetten, dan hakken.', 'Blijf in de buurt van je team zodat je gesteund wordt.'],
      mistakes: ['Alleen vechten tegen meerdere vijanden.', 'Zonder vision in de rivier of bush lopen.', 'Je CC of dash verspillen.'],
      drills: ['Oefen je trade-combo: skill → aanval → skill, zonder te stoppen (10 keer).', 'Oefen het gebruiken van je dash om uit een skillshot te komen.', 'Oefen je 1v1 tegen een dummy en kijk hoe snel je hem verslaat.', 'Oefen het wisselen tussen farmen en trades zonder je HP te verliezen.'],
    },
    tank: {
      early: ['Speel solide en farm veilig; je bent geen schadebron.', 'Gebruik je CC om je team te helpen en trade alleen als je er niet voor wordt gestraft.', 'Bouw armor of MR op basis van het grootste dreigingstype.'],
      mid: ['Maak ruimte voor je team: begin gevechten waar jouw team sterk is.', 'Ward de ingangen van de jungle en bescherm je carry tegen duikers.', 'Neem frontline-positie in bij objectives.'],
      fight: ['Open met je engage zodra je team klaarstaat.', 'Zet CC op de vijandelijke carry.', 'Absorbeer schade en laat je team de schade leveren.'],
      mistakes: ['Alleen naar voren lopen zonder dat je team volgt.', 'Je CC op de eerste de beste vijand gebruiken.', 'Te veel schade-items bouwen en te weinig taai zijn.'],
      drills: ['Oefen je engage-skill op een bewegend doelwit.', 'Oefen het combineren van je CC-skills achter elkaar (10 keer).', 'Oefen positionering: sta voor je carry in een nagebootst gevecht.', 'Oefen het wegduwen of vasthouden van een vijand bij een muur.'],
    },
    enchanter: {
      early: ['Houd je ADC veilig en farm niets: jouw werk is bescherming en vision.', 'Gebruik je skills om te poken wanneer dat veilig is.', 'Ken de skills van de vijand en bewaar je shield of CC daarvoor.'],
      mid: ['Plaats vision bij objectives voordat je team ze neemt.', 'Blijf dichtbij je carry; jouw skills werken alleen als je binnen bereik bent.', 'Help bij het peilen van vijandelijke duikers.'],
      fight: ['Gebruik je shield of heal wanneer je carry wordt aangevallen, niet te vroeg.', 'Bewaar je ultimate voor het beslissende moment.', 'Blijf achter je frontline en gebruik CC op duikers.'],
      mistakes: ['Je shield of heal te vroeg gebruiken.', 'Zelf instappen in plaats van je carry te beschermen.', 'Geen control wards kopen.'],
      drills: ['Oefen je shield/heal op bewegende teamgenoten (10 raak op een rij).', 'Oefen je positionering: sta altijd binnen bereik van je carry zonder voor te lopen.', 'Oefen het plaatsen van wards in de rivier en bij objectives.', 'Oefen het gebruik van je CC op een inkomende vijand.'],
    },
  },

  /* diepere gidsen voor een paar champions */
  champs: {
    Seraphine: {
      intro: 'Seraphine is een flexibele enchanter-mage: ze pokt met Q, beschermt met W en zet vijanden vast met E en R. Ze is sterk als je teamgenoten in de buurt zijn.',
      early: ['Q is meestal je eerste skill om te pokken; W heb je nodig om je ADC te beschermen.', 'Je passive laat elke derde spell dubbel casten: tel mee en gebruik de derde cast slim.', 'Gebruik W (shield) wanneer de vijand voluit engageert; gooi hem niet meteen weg.'],
      mistakes: ['R gebruiken zonder dat de vijand erdoorheen loopt of zonder bondgenoten: hij wordt pas sterk als hij door meerdere champions gaat.', 'Te ver vooruit staan: zonder dash ben je kwetsbaar.', 'E gebruiken zonder te letten op slow (vijanden die al vertraagd zijn worden geroot).'],
      mastery: ['Je R loopt door bondgenoten heen en wordt daar langer van: stuur hem door je team naar de vijand.', 'Zet vijanden met E eerst vast; volg op met Q en bewaar R voor wanneer ze groeperen.'],
    },
    Syndra: {
      intro: 'Syndra is een controle-mage met enorme burst: ze bouwt Dark Spheres op en laat ze met E en R ontploffen. Het draait om het opbouwen van bollen voordat je gaat vechten.',
      early: ['Q is je belangrijkste skill: poke en farm ermee, maar let op je mana.', 'Zodra je E hebt, kun je vijanden stunnen die door een bol worden geraakt.', 'Breng een skill zo snel mogelijk naar rank 5 (meestal Q): die krijgt een krachtig bonus-effect.'],
      mistakes: ['R gebruiken terwijl er maar een paar bollen liggen: R is pas sterk met veel bollen.', 'Je E verspillen: zonder stun is Syndra kwetsbaar.', 'Te vroeg all-in gaan voordat je cooldowns terug zijn.'],
      mastery: ['Zet bollen neer voordat het gevecht begint, zodat je R meer schade doet.', 'Een W op een vijand vertraagt hem; volg op met Q voor een makkelijkere treffer.'],
    },
    Illaoi: {
      intro: 'Illaoi is een toplaner die haar kracht haalt uit tentakels: waar tentakels zijn, ben jij sterk. Vecht dus altijd daar.',
      early: ['Q is je belangrijkste skill: max hem eerst.', 'Begin trades vlak bij tentakels of dwing de vijand erheen.', 'Wil je een vijand tot Vessel maken (extra tentakels), breng zijn health dan eerst omlaag, zodat de geest sneller sterft.'],
      mistakes: ['Vechten zonder tentakels in de buurt.', 'Als eerste in een teamfight stappen zonder CC-verdediging.', 'R te vroeg gebruiken zonder dat meerdere vijanden geraakt worden.'],
      mastery: ['Elke geraakte champion met je R levert een tentakel op: wacht tot meerdere vijanden bij je zijn.', 'Je W laat nabije tentakels meeslaan; gebruik hem om in te stappen bij je tentakels.'],
    },
    Draven: {
      intro: 'Draven is een agressieve ADC met enorme schade, maar alleen als hij zijn bijlen vangt. Dat vangen is de kern van alles.',
      early: ['Vang elke bijl: loop er recht naartoe; laat je ze vallen, dan verlies je schade en Adoration.', 'Gebruik W om bijlen sneller te vangen en E om vijanden weg te duwen als ze op je duiken.', 'Speel agressief maar blijf bij je support: Draven wordt sterk door druk te zetten.'],
      mistakes: ['Bijlen laten vallen.', 'Te ver naar voren zonder vision.', 'R gebruiken zonder dat de vijand erdoorheen kan.'],
      mastery: ['Elke bijl die je vangt geeft Adoration; kills leveren extra goud op basis van je stacks.', 'Je R executeert vijanden met minder health dan je aantal Adoration-stacks.'],
    },
  },

  /* beslissingsquiz per klasse: { q, o:[3 opties], a:index goed, x:uitleg } */
  quiz: {
    marksman: [
      { q: 'Een vijandelijke assassin springt op je en je support staat ver weg. Wat doe je als eerste?', o: ['Blijven aanvallen en hopen dat je het overleeft', 'Je ontsnappings- of CC-skill gebruiken en richting je team bewegen', 'Je ultimate op een minion gebruiken'], a: 1, x: 'Een marksman overleeft door positionering en door zijn defensieve middelen op tijd te gebruiken. Schade maak je pas als je veilig bent.' },
      { q: 'Wat is de beste manier om schade te maken in een teamfight?', o: ['Zo dichtbij mogelijk de vijand in rennen', 'Kiten: aanvallen op maximaal bereik en bewegen tussen aanvallen', 'Alleen skills gebruiken en niet aanvallen'], a: 1, x: 'Je schade zit in je aanvallen. Door op bereik te blijven en tussen aanvallen te bewegen maak je schade én blijf je leven.' },
      { q: 'Je staat achter in de game. Wat is je belangrijkste prioriteit?', o: ['Zo veel mogelijk risico\'s nemen voor kills', 'Veilig farmen en je items bereiken, en vechten met je team', 'Alleen nog maar teamfighten'], a: 1, x: 'Items en CS maken je sterk. Door veilig te farmen bereik je je spikes zonder je team in de steek te laten.' },
    ],
    mage: [
      { q: 'Je CC-skill en je hoogste schadeskill staan klaar. Waarmee open je een gevecht?', o: ['Eerst de schadeskill', 'Eerst de CC, dan de schade en de ultimate', 'Eerst de ultimate'], a: 1, x: 'Een CC-skill zorgt dat je schade ook echt raakt en voorkomt dat de vijand je ontwijkt of op je springt.' },
      { q: 'Een assassin heeft je net gedood. Wat doe je verstandig?', o: ['Dichter bij de vijand gaan om hem te straffen', 'Je naast je team of toren positioneren en je verdediging bewaren voor de duik', 'Meer mana verbruiken in lane'], a: 1, x: 'Tegen assassins kies je veilige positionering en bewaar je een ontsnapping of shield voor wanneer hij springt.' },
      { q: 'Je wilt kunnen roamen. Wat doe je eerst?', o: ['Direct weglopen', 'De wave pushen zodat de minions de toren raken terwijl je weg bent', 'De wave laten staan'], a: 1, x: 'Een gepushte wave verliest geen CS terwijl je weg bent en geeft je tempo.' },
    ],
    assassin: [
      { q: 'Je wilt de vijandelijke carry doden maar hun frontline staat ervoor. Wat doe je?', o: ['Over de frontline duiken en meteen aanvallen', 'Wachten tot hun CC verbruikt is en dan op de carry duiken', 'De dichtstbijzijnde tank aanvallen'], a: 1, x: 'Een assassin wint door timing: duik pas als de vijand geen CC meer heeft om je te stoppen.' },
      { q: 'Na een kill zijn je cooldowns leeg. Wat doe je?', o: ['Blijven vechten', 'Terugtrekken of verstandig positioneren tot je cooldowns terug zijn', 'Je ultimate op een minion gebruiken'], a: 1, x: 'Zonder cooldowns ben je kwetsbaar. Kies je volgende gevecht als je weer burst hebt.' },
      { q: 'Wat geeft je het meeste voordeel bij roamen?', o: ['Een gepushte wave en weten waar de vijandelijke jungler is', 'Altijd roamen zonder te kijken', 'Alleen roamen bij je toren'], a: 0, x: 'Een gepushte wave houdt je farm veilig, en vision voorkomt dat je in een val loopt.' },
    ],
    fighter: [
      { q: 'Wanneer is een trade met de vijand slim?', o: ['Wanneer zijn belangrijkste skills op cooldown staan', 'Altijd, zo vaak mogelijk', 'Nooit'], a: 0, x: 'Een trade wint je voordeel als de vijand niet kan terugslaan. Kijk dus naar zijn cooldowns.' },
      { q: 'De vijandelijke jungler is waarschijnlijk in jouw buurt. Wat doe je?', o: ['De wave hard blijven pushen', 'De wave dichtbij je toren houden en vision plaatsen', 'Op je toren wachten zonder te kijken'], a: 1, x: 'Een gepushte wave maakt je kwetsbaar voor een gank. Houd de wave dichtbij en ward.' },
      { q: 'Wie val je als bruiser in een teamfight aan?', o: ['Altijd de dichtstbijzijnde tank', 'Een carry als je erbij kunt, anders de dichtstbijzijnde bedreiging', 'Altijd de support'], a: 1, x: 'Je wilt de grootste schadebron uitschakelen, maar alleen als je er levend bij komt.' },
    ],
    tank: [
      { q: 'Wanneer gebruik je je engage-skill?', o: ['Zodra je een vijand ziet', 'Wanneer je team klaarstaat om aan te sluiten en je een belangrijk doelwit kunt vangen', 'Nooit zonder ultimate'], a: 1, x: 'Een engage zonder team is een eigen dood. Timing is belangrijker dan snelheid.' },
      { q: 'Wat is je belangrijkste doel in een teamfight?', o: ['Zoveel mogelijk schade maken', 'CC op de vijandelijke carry en schade absorberen', 'Zo ver mogelijk vooruit rennen'], a: 1, x: 'Een tank maakt ruimte: hij houdt vijanden vast en beschermt zijn eigen carry.' },
      { q: 'De vijand heeft veel AD. Hoe pas je je build aan?', o: ['Veel magische weerstand halen', 'Armor-items halen', 'Alleen health bouwen'], a: 1, x: 'Armor verlaagt fysieke schade. Kijk wat het grootste dreigingstype is.' },
    ],
    enchanter: [
      { q: 'Wanneer gebruik je je shield of heal?', o: ['Zodra je mana vol is', 'Wanneer je carry wordt aangevallen of het gevecht begint', 'Op minions'], a: 1, x: 'Een shield op het juiste moment is veel meer waard dan er vroeg een weg te gooien.' },
      { q: 'Je ADC wordt gegankt. Wat doe je?', o: ['Blijven staan', 'Je CC of shield gebruiken en samen terugtrekken', 'De vijand achternarennen'], a: 1, x: 'Een enchanter keert het gevecht door te beschermen, niet door zelf te vechten.' },
      { q: 'Hoe help je het meest buiten gevechten?', o: ['Vision plaatsen en objectives voorbereiden', 'Alleen farmen', 'Niets doen'], a: 0, x: 'Vision geeft je team informatie en veiligheid; dat is jouw grootste waarde buiten fights.' },
    ],
  },
  quizGroup: { marksman: 'marksman', mage: 'mage', mageSupport: 'mage', apAssassin: 'assassin', adAssassin: 'assassin', fighter: 'fighter', critSkirmisher: 'fighter', apFighter: 'fighter', tank: 'tank', engage: 'tank', enchanter: 'enchanter' },
};
