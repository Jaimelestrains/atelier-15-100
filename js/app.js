(function () {
  const E = window.NFC15100;
  const KEY = "atelier-15100";

  const state = {
    view: "home",
    step: "profil",
    chapter: "intro",
    selectedRoom: null,
    project: load() || seeded(),
  };

  function seeded() {
    const p = E.defaultProject();
    E.applyTemplate(p, "t3");
    return p;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state.project));
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function showView(name) {
    state.view = name;
    $$(".view").forEach((v) => v.classList.toggle("is-on", v.dataset.view === name));
    $$(".nav button").forEach((b) => b.classList.toggle("is-on", b.dataset.view === name));
    if (name === "atelier") renderAtelier();
    if (name === "guide") renderGuide();
    window.scrollTo(0, 0);
  }

  function setStep(step) {
    state.step = step;
    renderAtelier();
  }

  /* ---------- Guide ---------- */
  const CHAPTERS = [
    { id: "intro", title: "C'est quoi, la 15-100 ?" },
    { id: "2024", title: "Ce qui change en 2024" },
    { id: "pieces", title: "Pièce par pièce" },
    { id: "circuits", title: "Circuits et câbles" },
    { id: "ddr", title: "Se protéger (DDR)" },
    { id: "tableau", title: "Le tableau électrique" },
    { id: "compteur", title: "Le compteur, en kVA" },
    { id: "sdb", title: "Salle de bain" },
    { id: "lexique", title: "Lexique" },
  ];

  const GUIDE = {
    intro: `
      <div class="kicker">Chapitre 1</div>
      <h2>Une règle du jeu, pas un grimoire</h2>
      <p>La NF C 15-100 est la norme française des installations électriques basse tension. Depuis 2024, ce n'est plus un pavé unique : c'est une série de 21 normes. Pour un logement, on lit surtout la partie 1 (règles générales) et la <b>partie 10</b> (habitations).</p>
      <div class="callout">Elle a trois buts : <b>protéger les personnes</b>, <b>protéger les biens</b>, et <b>prévoir le confort de demain</b> (prises, réseau, recharge de voiture, efficacité énergétique).</div>
      <div class="grid-2">
        <div class="card"><h3>Neuf et rénovation lourde</h3><p>Elle s'applique aux installations neuves et aux rénovations totales. La date à retenir est celle du permis, de la déclaration préalable, ou du marché.</p></div>
        <div class="card"><h3>Le Consuel</h3><p>Avant la mise sous tension, un organisme (souvent Consuel) vérifie la conformité. Cette app vous prépare : elle ne délivre pas le visa.</p></div>
      </div>
    `,
    "2024": `
      <div class="kicker">Chapitre 2</div>
      <h2>La version 2024, en clair</h2>
      <p>La nouvelle édition (août 2024, obligatoire après la période transitoire de 12 mois) rattrape vingt ans d'usages : pompes à chaleur, bornes de recharge, variateurs, réseau numérique.</p>
      <div class="grid-2">
        <div class="card"><h3>DDR type F</h3><p>Obligatoire devant les appareils à variateur monophasé : PAC, clim, pompe de piscine. Il évite les déclenchements intempestifs tout en protégeant aussi bien qu'un type A.</p></div>
        <div class="card"><h3>Moins de prises par circuit</h3><p>Édition 2024 : 5 socles max en 1,5 mm² / 16 A, 8 socles max en 2,5 mm² / 20 A. Cuisine : 6 socles sur un circuit dédié 2,5 mm².</p></div>
        <div class="card"><h3>RJ45 plutôt que coaxial</h3><p>Le réseau du logement impose des prises Ethernet. La TV coaxiale devient un choix, plus une obligation.</p></div>
        <div class="card"><h3>IRVE</h3><p>Circuit dédié pour la recharge, DDR 30 mA qui ne protège que ce point. Type A (mode 1/2) ou A/F/B selon le mode 3.</p></div>
      </div>
    `,
    pieces: `
      <div class="kicker">Chapitre 3</div>
      <h2>Le minimum, pièce par pièce</h2>
      <p>La norme ne dit pas « mettez des prises partout ». Elle fixe un <b>plancher de confort</b> pour éviter les rallonges — première cause d'incendie domestique.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Pièce</th><th>Prises 16 A</th><th>Éclairage</th><th>Réseau</th></tr></thead>
          <tbody>
            <tr><td>Séjour ≤ 28 m²</td><td>1 par 4 m², mini 5</td><td>1 point</td><td>2 × RJ45</td></tr>
            <tr><td>Séjour > 28 m²</td><td>mini 7 (souvent 1 / 4 m²)</td><td>1 point</td><td>2 × RJ45</td></tr>
            <tr><td>Chambre / bureau</td><td>3</td><td>1 point</td><td>1 RJ45 (selon T2 / T3)</td></tr>
            <tr><td>Cuisine > 4 m²</td><td>6 dont 4 plan de travail</td><td>1 point</td><td>—</td></tr>
            <tr><td>Salle de bain</td><td>1 hors volume</td><td>1 point (pas de prise commandée)</td><td>—</td></tr>
            <tr><td>Dégagement > 4 m²</td><td>1</td><td>1 point</td><td>—</td></tr>
            <tr><td>WC</td><td>0 obligatoire</td><td>1 point</td><td>—</td></tr>
          </tbody>
        </table>
      </div>
      <div class="callout">Cuisine ouverte : on décompte 8 m² du séjour pour calculer les prises du salon. Interrupteurs entre 0,90 m et 1,30 m. Prises à 1,30 m max.</div>
    `,
    circuits: `
      <div class="kicker">Chapitre 4</div>
      <h2>Un circuit = un calibre + une section</h2>
      <p>Chaque « départ » du tableau a un disjoncteur (qui coupe si trop de courant) et un câble assez gros pour ne pas chauffer.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Usage</th><th>Disjoncteur</th><th>Cuivre</th><th>Remarque</th></tr></thead>
          <tbody>
            <tr><td>Éclairage</td><td>C 16 A</td><td>1,5 mm²</td><td>2 circuits mini (sauf studio)</td></tr>
            <tr><td>Prises générales</td><td>C 16 / C 20 A</td><td>1,5 / 2,5 mm²</td><td>5 ou 8 socles max</td></tr>
            <tr><td>Prises cuisine</td><td>C 20 A</td><td>2,5 mm²</td><td>Circuit dédié, 6 socles</td></tr>
            <tr><td>Four, LV, LL…</td><td>C 20 A</td><td>2,5 mm²</td><td>1 appareil = 1 circuit</td></tr>
            <tr><td>Plaque</td><td>C 32 A</td><td>6 mm²</td><td>ou 20 A tri 2,5 mm²</td></tr>
            <tr><td>Chauffage convecteurs</td><td>B 16 A</td><td>1,5 mm²</td><td>Charge résistive</td></tr>
            <tr><td>Chauffe-eau résistance</td><td>B 20 A</td><td>2,5 mm²</td><td>+ contacteur HC</td></tr>
            <tr><td>PAC / clim / pompe</td><td>D 16–32 A</td><td>selon puissance</td><td>Fort courant d'appel</td></tr>
            <tr><td>VMC</td><td>C 2 A</td><td>1,5 mm²</td><td>Dédié, ne coupe pas avec l'éclairage</td></tr>
            <tr><td>Borne 3,7 kW</td><td>C 20 A</td><td>2,5 mm²</td><td>Circuit IRVE dédié</td></tr>
            <tr><td>Borne 7,4 kW</td><td>C 40 A</td><td>10 mm²</td><td>DDR dédié</td></tr>
          </tbody>
        </table>
      </div>
      <p>Le chiffre (16 A, 20 A…) est le calibre. La lettre devant est la <b>courbe</b> : à quel pic le disjoncteur accepte de ne pas claquer.</p>
      <div class="grid-2">
        <div class="card"><h3>Courbe B</h3><p>Déclenche entre 3 et 5 fois le calibre. Pour les <b>résistances pures</b> : convecteurs, ballon électrique. Plus sensible, donc plus protecteur quand il n'y a pas d'appel au démarrage.</p></div>
        <div class="card"><h3>Courbe C</h3><p>5 à 10 fois. Le <b>couteau suisse du logement</b> : prises, éclairage LED, four, lave-linge, plaque, VMC, borne. Un petit moteur ne le fait pas sauter.</p></div>
        <div class="card"><h3>Courbe D</h3><p>10 à 20 fois. Pour les <b>compresseurs</b> : PAC, clim, pompe de piscine. Au démarrage ils tirent un énorme pic ; une C partirait, une D laisse passer.</p></div>
        <div class="card"><h3>1P+N · 4,5 kA</h3><p>En maison monophasée : un pôle + neutre. Pouvoir de coupure 4,5 kA suffit en général en bout de ligne Enedis ; 6 kA si vous êtes près du transformateur.</p></div>
      </div>
    `,
    ddr: `
      <div class="kicker">Chapitre 5</div>
      <h2>Le différentiel, c'est la vie</h2>
      <p>Le disjoncteur protège les fils. Le <b>DDR 30 mA</b> protège les personnes : il coupe si une fuite de courant part vers la terre — par exemple à travers vous.</p>
      <div class="grid-2">
        <div class="card"><h3>Type AC</h3><p>Usages généraux : éclairage, prises classiques.</p></div>
        <div class="card"><h3>Type A</h3><p>Plaque, lave-linge, IRVE. Au moins un par logement. Détecte aussi les défauts « redressés ».</p></div>
        <div class="card"><h3>Type F</h3><p>PAC, clim, pompe de piscine (variateur). Moins de déclenchements bêtes.</p></div>
        <div class="card"><h3>Type B</h3><p>Surtout triphasé / certaines bornes mode 3. Plus rare en maison simple.</p></div>
      </div>
      <div class="callout">Règles d'or : 2 DDR minimum, 8 disjoncteurs max derrière chacun, calibre du DDR ≥ disjoncteur de branchement (AGCP), et circuits d'une même pièce répartis pour qu'une fuite n'éteigne pas toute la pièce.</div>
    `,
    tableau: `
      <div class="kicker">Chapitre 6</div>
      <h2>Le tableau, dans la GTL</h2>
      <p>Le tableau de répartition vit dans la <b>gaine technique du logement</b> (GTL), à l'entrée, dans un dégagement — jamais dans la salle de bain, jamais au-dessus de l'évier.</p>
      <div class="grid-2">
        <div class="card"><h3>20 % de vide</h3><p>Maison individuelle : garder 20 % de modules libres pour demain (borne, PAC, alarme). Collectif : 6 modules mini.</p></div>
        <div class="card"><h3>Hauteur</h3><p>Organes de manœuvre accessibles, disjoncteurs ≤ 1,80 m. Accessibilité PMR : 0,90 à 1,30 m pour la coupure d'urgence.</p></div>
      </div>
    `,
    compteur: `
      <div class="kicker">Chapitre 7</div>
      <h2>kVA : la taille du tuyau</h2>
      <p>L'abonnement Enedis n'est pas « combien vous consommez dans l'année ». C'est <b>la puissance max au même instant</b>. Trop petit : le disjoncteur de branchement saute. Trop gros : vous payez l'abonnement pour rien.</p>
      <div class="grid-2">
        <div class="card"><h3>kW vs kVA</h3><p>Le compteur parle en kVA (puissance apparente). Dans un logement, kW ≈ kVA. 9 kVA ≈ 39 A en monophasé 230 V.</p></div>
        <div class="card"><h3>Foisonnement</h3><p>On ne additionne pas four + plaque + sèche-linge + chauffage à 100 %. L'atelier compare un pic du soir et un pic d'hiver le matin, puis garde le plus haut — sans marge « pour rire ».</p></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Abonnement</th><th>Intensité mono</th><th>Profil typique</th></tr></thead>
          <tbody>
            <tr><td>6 kVA</td><td>30 A</td><td>T2 / T3, PAC, induction — le cas le plus fréquent</td></tr>
            <tr><td>9 kVA</td><td>45 A</td><td>Maison plus grande, convecteurs, ou usage soutenu</td></tr>
            <tr><td>12 kVA</td><td>60 A</td><td>Tout électrique ancien, borne 7,4 kW en journée</td></tr>
            <tr><td>Triphasé 15–18 kVA</td><td>—</td><td>Gros chauffage électrique, atelier, piscine + IRVE</td></tr>
          </tbody>
        </table>
      </div>
    `,
    sdb: `
      <div class="kicker">Chapitre 8</div>
      <h2>L'eau et l'électricité ne se croisent pas</h2>
      <p>Autour de la baignoire ou de la douche, l'espace est découpé en volumes. Plus on est près de l'eau, plus le matériel doit être étanche — ou interdit.</p>
      <div class="volumes">
        <svg class="bath-draw" viewBox="0 0 160 220" aria-hidden="true">
          <rect x="18" y="70" width="124" height="70" rx="8" fill="#c45c26" opacity=".25"/>
          <text x="80" y="110" text-anchor="middle" font-size="12" fill="#8f3d16">Vol. 0</text>
          <rect x="8" y="40" width="144" height="130" rx="12" fill="none" stroke="#2c4a3c" stroke-dasharray="4 3"/>
          <text x="80" y="58" text-anchor="middle" font-size="11" fill="#2c4a3c">Volume 1</text>
          <rect x="2" y="20" width="156" height="170" rx="14" fill="none" stroke="#1b1713" opacity=".4"/>
          <text x="80" y="36" text-anchor="middle" font-size="11" fill="#5c5348">Volume 2 / hors vol.</text>
          <text x="80" y="200" text-anchor="middle" font-size="10" fill="#5c5348">prise ici →</text>
        </svg>
        <div>
          <div class="card"><h3>Volume 0</h3><p>Dans l'eau. Rien d'électrique, sauf matériels TBTS très spécifiques.</p></div>
          <div class="card" style="margin-top:8px"><h3>Volume 1</h3><p>Au-dessus du bac. Pas de prises. DCL interdit. Luminaires IPX4 min. si autorisés.</p></div>
          <div class="card" style="margin-top:8px"><h3>Hors volume</h3><p>La prise 16 A obligatoire vit ici. Lave-linge / sèche-linge : circuit dédié, hors volume.</p></div>
        </div>
      </div>
    `,
    lexique: `
      <div class="kicker">Chapitre 9</div>
      <h2>Les mots qu'on croise partout</h2>
      <div class="card"><h3>AGCP</h3><p>Appareil général de commande et de protection : le disjoncteur de branchement Enedis, celui qui coupe tout le logement.</p></div>
      <div class="card" style="margin-top:8px"><h3>Courbe B / C / D</h3><p>Le disjoncteur a une lettre : B (résistances), C (logement courant), D (compresseurs PAC / clim / pompe). Sans la bonne courbe, soit ça saute au démarrage, soit ça protège trop mollement.</p></div>
      <div class="card" style="margin-top:8px"><h3>DDR</h3><p>Dispositif différentiel résiduel. Le 30 mA sauve des vies. Type AC, A ou F selon la charge.</p></div>
      <div class="card" style="margin-top:8px"><h3>DCL</h3><p>Dispositif de connexion pour luminaire : la « prise » du plafond, pour changer un lustre sans toucher aux fils.</p></div>
      <div class="card" style="margin-top:8px"><h3>GTL / ETEL</h3><p>Gaine technique et espace technique du logement : le placard du tableau + de la box.</p></div>
      <div class="card" style="margin-top:8px"><h3>IRVE</h3><p>Infrastructure de recharge pour véhicule électrique.</p></div>
      <div class="card" style="margin-top:8px"><h3>Consuel</h3><p>Attestation de conformité avant mise sous tension du neuf / rénové.</p></div>
    `,
  };

  function renderGuide() {
    const nav = $("#guide-nav-list");
    nav.innerHTML = CHAPTERS.map(
      (c) => `<button type="button" data-ch="${c.id}" class="${state.chapter === c.id ? "is-on" : ""}">${c.title}</button>`
    ).join("");
    $("#guide-body").innerHTML = `<article class="chapter">${GUIDE[state.chapter]}</article>`;
  }

  /* ---------- Atelier ---------- */
  function renderAtelier() {
    $$(".step-tab").forEach((b) => b.classList.toggle("is-on", b.dataset.step === state.step));
    const form = $("#atelier-form");
    const preview = $("#atelier-preview");
    const bilan = $("#bilan");
    const grid = $("#atelier-grid");
    const footer = $("#atelier-footer");

    const isBilan = state.step === "bilan";
    grid.style.display = isBilan ? "none" : "grid";
    bilan.style.display = isBilan ? "grid" : "none";
    footer.style.display = "flex";

    if (!isBilan) {
      if (state.step === "profil") form.innerHTML = formProfil();
      if (state.step === "pieces") form.innerHTML = formPieces();
      if (state.step === "equip") form.innerHTML = formEquip();
      preview.innerHTML = renderPreview();
    } else {
      bilan.innerHTML = renderBilan();
    }
    bindAtelier();
    if (!isBilan && state.step === "pieces" && state.selectedRoom) renderEditor();
  }

  function formProfil() {
    const p = state.project;
    const choice = (key, val, title, sub) =>
      `<button type="button" class="choice ${p[key] === val ? "is-on" : ""}" data-set="${key}" data-val="${val}">${title}<small>${sub}</small></button>`;
    return `
      <h2>Le logement</h2>
      <p class="help">On commence par le portrait : type, isolation, énergies. Ça change le compteur plus que le nombre de lampes.</p>
      <div class="field"><label>Type</label>
        <div class="choice-grid">
          ${choice("housing", "house", "Maison", "Individuelle")}
          ${choice("housing", "apartment", "Appartement", "Collectif")}
        </div>
      </div>
      <div class="field"><label>Période de construction</label>
        <div class="choice-grid">
          ${choice("era", "re2020", "RE2020", "~35 W/m² si tout élec")}
          ${choice("era", "rt2012", "RT2012", "~45 W/m²")}
          ${choice("era", "y2000", "2000–2012", "~70 W/m²")}
          ${choice("era", "old", "Avant 2000", "~100 W/m²")}
        </div>
      </div>
      <div class="field"><label>Chauffage</label>
        <div class="choice-grid">
          ${choice("heating", "pac-air", "Pompe à chaleur air", "Peu de kVA électriques")}
          ${choice("heating", "pac-eau", "PAC air/eau", "Un peu plus gourmande")}
          ${choice("heating", "electric", "Convecteurs / rayonnant", "Ça gonfle le compteur")}
          ${choice("heating", "gas", "Gaz / fioul / bois", "0 kW chauffage sur le Linky")}
        </div>
      </div>
      <div class="field"><label>Cuisine ouverte sur le séjour</label>
        <button type="button" class="switch ${p.openKitchen ? "is-on" : ""}" data-toggle="openKitchen" aria-pressed="${p.openKitchen}"><i></i></button>
      </div>
    `;
  }

  function formPieces() {
    const p = state.project;
    const rows = p.rooms
      .map((r) => {
        const st = E.roomStatus(r, p);
        return `<div class="room-item" data-id="${r.id}">
          <div><b>${r.name}</b><span>${E.KINDS[r.kind].label} · ${r.area} m² · ${r.sockets} prises ${st.ok ? "✓" : "⚠"}</span></div>
          <button type="button" class="icon-btn" data-edit="${r.id}" title="Modifier">✎</button>
          <button type="button" class="icon-btn" data-del="${r.id}" title="Retirer">✕</button>
        </div>`;
      })
      .join("");
    const kinds = Object.entries(E.KINDS)
      .map(([k, v]) => `<option value="${k}">${v.label}</option>`)
      .join("");
    return `
      <h2>Les pièces</h2>
      <p class="help">Un modèle pour démarrer, puis vous ajustez surfaces et prises. La norme impose un minimum : vous pouvez toujours en mettre plus.</p>
      <div class="templates">
        ${Object.entries(E.TEMPLATES)
          .map(([k, t]) => `<button type="button" class="chip" data-tpl="${k}">${t.label}</button>`)
          .join("")}
      </div>
      <div class="room-list">${rows || "<p class='muted'>Aucune pièce. Choisissez un modèle ou ajoutez.</p>"}</div>
      <div class="field" style="margin-top:16px"><label>Ajouter une pièce</label>
        <div style="display:grid;grid-template-columns:1fr 90px 44px;gap:8px">
          <select id="new-kind">${kinds}</select>
          <input id="new-area" type="number" min="1" value="12" />
          <button type="button" class="icon-btn" id="add-room">+</button>
        </div>
      </div>
      <div id="room-editor"></div>
    `;
  }

  function formEquip() {
    const p = state.project;
    const row = (key, label, sub) => `
      <div class="check-row">
        <div><b>${label}</b><div class="small muted">${sub}</div></div>
        <button type="button" class="switch ${p[key] ? "is-on" : ""}" data-toggle="${key}"><i></i></button>
      </div>`;
    const choice = (key, val, title, sub) =>
      `<button type="button" class="choice ${p[key] === val ? "is-on" : ""}" data-set="${key}" data-val="${val}">${title}<small>${sub}</small></button>`;
    return `
      <h2>Les gros appareils</h2>
      <p class="help">Ce sont eux qui écrivent le tableau : chaque gros électroménager a son propre disjoncteur.</p>
      <div class="field"><label>Cuisson</label>
        <div class="choice-grid">
          ${choice("cooking", "induction", "Induction", "32 A · 6 mm²")}
          ${choice("cooking", "vitro", "Vitrocéramique", "32 A · 6 mm²")}
          ${choice("cooking", "gas", "Gaz", "Pas de circuit 32 A")}
        </div>
      </div>
      <div class="field"><label>Eau chaude</label>
        <div class="choice-grid">
          ${choice("dhw", "electric", "Ballon électrique", "20 A dédié")}
          ${choice("dhw", "thermo", "Thermodynamique", "Petit appel de puissance")}
          ${choice("dhw", "gas", "Gaz / collectif", "0 kW")}
        </div>
      </div>
      ${row("oven", "Four indépendant", "Circuit 20 A")}
      ${row("dishwasher", "Lave-vaisselle", "Circuit 20 A")}
      ${row("washer", "Lave-linge", "Circuit 20 A · DDR type A")}
      ${row("dryer", "Sèche-linge", "Circuit 20 A")}
      ${row("freezer", "Congélateur dédié", "Circuit séparé recommandé")}
      ${row("shutters", "Volets roulants", "Un circuit 16 A")}
      ${row("dhwOffPeak", "ECS en heures creuses", "Moins de coincidence avec le pic")}
      <div class="field" style="margin-top:16px"><label>Recharge véhicule</label>
        <div class="choice-grid">
          ${choice("ev", "none", "Pas de borne", "Vous pourrez pré-câbler plus tard")}
          ${choice("ev", "3.7", "3,7 kW", "Prise / borne 16 A")}
          ${choice("ev", "7.4", "7,4 kW", "Borne 32 A · gros câble")}
        </div>
      </div>
      ${row("evOffPeak", "Recharge de nuit", "Le compteur n'a pas besoin d'être taillé pour la borne + le four")}
      ${row("pool", "Pompe de piscine", "DDR type F")}
      ${row("ac", "Climatisation", "DDR type F")}
    `;
  }

  function meterSvg(power) {
    const max = 36;
    const t = Math.min(1, power.kvaRaw / max);
    const ang = -180 + t * 180;
    const r = 70;
    const cx = 80;
    const cy = 88;
    const rad = (ang * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    return `<svg class="meter-svg" viewBox="0 0 160 110" role="img" aria-label="Jauge ${power.subscription} kVA">
      <path d="M10 88 A70 70 0 0 1 150 88" fill="none" stroke="#d4cbb8" stroke-width="10" stroke-linecap="round"/>
      <path d="M10 88 A70 70 0 0 1 150 88" fill="none" stroke="#c45c26" stroke-width="10" stroke-linecap="round" stroke-dasharray="${t * 220} 220"/>
      <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#1b1713" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="5" fill="#1b1713"/>
    </svg>`;
  }

  function renderPreview() {
    const p = state.project;
    const power = E.powerBalance(p);
    const tiles = p.rooms
      .map((r) => {
        const st = E.roomStatus(r, p);
        const flex = Math.max(1, Math.round((r.area || 8) / 4));
        const dots = [
          ...Array(Math.min(r.sockets, 12)).fill('<i class="dot" title="Prise"></i>'),
          ...Array(Math.min(r.lights, 4)).fill('<i class="dot light" title="Éclairage"></i>'),
          ...Array(Math.min(r.rj45, 3)).fill('<i class="dot net" title="RJ45"></i>'),
        ].join("");
        return `<button type="button" class="room-tile ${st.ok ? "is-ok" : "is-bad"} ${state.selectedRoom === r.id ? "is-on" : ""}" data-pick="${r.id}" style="flex-grow:${flex}">
          <div class="kind">${E.KINDS[r.kind].label}</div>
          <b>${r.name}</b>
          <div class="area">${r.area} m²</div>
          <div class="dots">${dots}</div>
        </button>`;
      })
      .join("");
    return `
      <div class="panel meter-card">
        ${meterSvg(power)}
        <div>
          <div class="kva-big">${power.subscription}<small>kVA</small></div>
          <div class="meter-meta">
            Besoin estimé <strong>${power.kvaRaw.toFixed(1)} kVA</strong>
            · ${power.phase === "mono" ? "Monophasé" : "Triphasé"}
            · AGCP <strong>${power.agcp} A</strong>
            ${power.tight ? " · un peu juste" : ""}<br>
            ${power.peakLabel} · ${Math.round(power.area)} m² chauffés · ${power.sockets} prises
          </div>
        </div>
      </div>
      <div class="panel">
        <h2>Plan du logement</h2>
        <p class="help">Chaque point cuivre est une prise, or un éclairage, vert une RJ45. Rouge = sous le minimum de la norme.</p>
        <div class="house">${tiles || '<div class="house-empty">Ajoutez des pièces pour voir la maison se dessiner.</div>'}</div>
      </div>
    `;
  }

  function renderBilan() {
    const p = state.project;
    const power = E.powerBalance(p);
    const panel = E.buildPanel(p, power);
    const comp = E.compliance(p);
    const why = power.groups
      .filter((g) => g.emploi > 40)
      .sort((a, b) => b.emploi - a.emploi)
      .map(
        (g) =>
          `<li><b>${g.label}</b> — ${Math.round(g.emploi)} W en emploi <span class="muted">(${g.detail})</span></li>`
      )
      .join("");

    const rows = panel.ddrs
      .map((d) => {
        const mods = [
          `<div class="mod ${d.type === "F" ? "mod-f" : d.type === "A" ? "mod-a" : "mod-ddr"}">${d.type} ${d.in}A</div>`,
          ...d.circuits.map((c) => `<div class="mod mod-br curve-${c.curve || "C"}">${c.breaker || c.calibre + "A"}<br>${escapeHtml(c.name)}</div>`),
        ].join("");
        return `<div><div class="small muted" style="margin:0 0 4px">${d.label} · ${d.circuits.length} départ${d.circuits.length > 1 ? "s" : ""}</div><div class="board-row">${mods}</div></div>`;
      })
      .join("");

    const empty = Array.from({ length: panel.reserve }, () => `<div class="mod mod-empty">réserve</div>`).join("");

    const table = panel.circuits
      .map(
        (c) =>
          `<tr><td>${escapeHtml(c.name)}</td><td><b>${c.breaker}</b> ${c.poles}</td><td>${c.section} mm²</td><td>DDR ${c.type}</td><td>${escapeHtml(c.breakerWhy || c.note || "—")}</td></tr>`
      )
      .join("");

    const checks = comp
      .map(
        (c) =>
          `<div class="check-row"><span>${escapeHtml(c.label)}<div class="small muted">${escapeHtml(c.detail)}</div></span><span class="badge ${c.ok ? "badge-ok" : "badge-bad"}">${c.ok ? "Conforme" : "À reprendre"}</span></div>`
      )
      .join("");

    return `
      <div class="bilan-hero">
        <div class="panel">
          <div class="kicker" style="color:var(--copper-deep);letter-spacing:.14em;text-transform:uppercase;font-size:.75rem">Abonnement recommandé</div>
          <div class="kva-big">${power.subscription}<small>kVA · ${power.phase === "mono" ? "monophasé" : "triphasé"}</small></div>
          <p class="muted">${power.peakLabel} : ${Math.round(power.emploiW)} W ≈ ${power.kvaRaw.toFixed(1)} kVA. On ne cumule pas plaque, machines et chauffage à fond — c'est un pic de vie réelle, pas un worst-case.${power.tight ? " Abonnement un peu juste : si vous rechargez une voiture aux heures de pointe, passez au palier du dessus." : ""}</p>
          <div class="stat-row">
            <div class="stat"><div class="v">${power.agcp} A</div><div class="l">Disjoncteur de branchement</div></div>
            <div class="stat"><div class="v">${panel.circuits.length}</div><div class="l">Départs au tableau</div></div>
            <div class="stat"><div class="v">${panel.totalModules}</div><div class="l">Modules (dont ${panel.reserve} de réserve)</div></div>
          </div>
        </div>
        <div class="panel">
          <h2>Pourquoi ce compteur ?</h2>
          <ul class="why-list">${why}</ul>
        </div>
      </div>
      <div class="panel">
        <h2>Tableau de répartition</h2>
        <p class="help">Chaque disjoncteur s'écrit <b>courbe + calibre</b> : C16, B20, D20. B = résistif, C = général, D = compresseur. À gauche le DDR (cuivre = A, vert = A, bleu = F).</p>
        <div class="board">${rows}<div><div class="small muted" style="margin:0 0 4px">Réserve 20 %</div><div class="board-row">${empty}</div></div></div>
        <p class="small muted" style="margin-top:10px">Légende modules : <span style="color:#7a9a6e">vert = courbe B</span> · <span style="color:#b8860b">or = courbe C</span> · <span style="color:#6b8cce">bleu = courbe D</span></p>
      </div>
      <div class="panel">
        <h2>Nomenclature des circuits</h2>
        <div class="table-wrap">
          <table class="circuit-table">
            <thead><tr><th>Circuit</th><th>Disjoncteur</th><th>Section</th><th>Différentiel</th><th>Pourquoi cette courbe</th></tr></thead>
            <tbody>${table}</tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Contrôle NF C 15-100</h2>
        ${checks}
        <p class="disclaimer">Lecture pédagogique de la NF C 15-100 éd. 2024 et d'un bilan de puissance type UTE. Faites valider par un électricien qualifié avant travaux. Ne pas intervenir hors tension sans compétence.</p>
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  const LABELS = {
    housing: { house: "Maison individuelle", apartment: "Appartement" },
    era: { re2020: "RE2020", rt2012: "RT2012", y2000: "2000–2012", old: "Avant 2000" },
    heating: {
      "pac-air": "Pompe à chaleur air/air",
      "pac-eau": "PAC air/eau",
      electric: "Convecteurs / rayonnant",
      gas: "Gaz / bois / fioul",
    },
    dhw: { electric: "Ballon électrique", thermo: "Thermodynamique", gas: "Gaz / collectif" },
    cooking: { induction: "Induction", vitro: "Vitrocéramique", gas: "Gaz" },
    ev: { none: "Pas de borne", "3.7": "IRVE 3,7 kW", "7.4": "IRVE 7,4 kW" },
  };

  function kitList(p) {
    const items = [];
    if (p.oven) items.push("four indépendant");
    if (p.dishwasher) items.push("lave-vaisselle");
    if (p.washer) items.push("lave-linge");
    if (p.dryer) items.push("sèche-linge");
    if (p.freezer) items.push("congélateur dédié");
    if (p.shutters) items.push("volets roulants");
    if (p.pool) items.push("pompe piscine");
    if (p.ac) items.push("climatisation");
    if (p.dhwOffPeak && p.dhw === "electric") items.push("ECS heures creuses");
    if (p.evOffPeak && p.ev !== "none") items.push("recharge de nuit");
    return items;
  }

  function extractPayload() {
    const p = state.project;
    const power = E.powerBalance(p);
    const panel = E.buildPanel(p, power);
    const comp = E.compliance(p);
    const date = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return { p, power, panel, comp, date };
  }

  function buildExtractText() {
    const { p, power, panel, comp, date } = extractPayload();
    const kit = kitList(p);
    const rooms = p.rooms
      .map((r) => {
        const st = E.roomStatus(r, p);
        return `· ${r.name} (${E.KINDS[r.kind].label}) — ${r.area} m² · ${r.sockets} prises · ${r.lights} éclairage · ${r.rj45} RJ45 ${st.ok ? "OK" : "sous le minimum"}`;
      })
      .join("\n");
    const circuits = panel.circuits
      .map((c) => `· ${c.name} — ${c.breaker} ${c.poles} · ${c.section} mm² · DDR ${c.type} · ${c.breakerWhy}`)
      .join("\n");
    const why = power.groups
      .filter((g) => g.emploi > 40)
      .sort((a, b) => b.emploi - a.emploi)
      .map((g) => `· ${g.label} : ${Math.round(g.emploi)} W`)
      .join("\n");
    const checks = comp.map((c) => `· ${c.ok ? "OK" : "À voir"} — ${c.label}`).join("\n");
    return [
      `Atelier 15-100 — extrait du ${date}`,
      ``,
      `Abonnement conseillé : ${power.subscription} kVA ${power.phase === "mono" ? "monophasé" : "triphasé"}`,
      `Disjoncteur de branchement : ${power.agcp} A`,
      `${power.peakLabel} : ${power.kvaRaw.toFixed(1)} kVA (${Math.round(power.emploiW)} W)`,
      `${panel.circuits.length} départs · ${panel.totalModules} modules (dont ${panel.reserve} de réserve)`,
      ``,
      `Logement : ${LABELS.housing[p.housing]} · ${LABELS.era[p.era]} · ${Math.round(power.area)} m²`,
      `Chauffage : ${LABELS.heating[p.heating]}`,
      `Eau chaude : ${LABELS.dhw[p.dhw]}`,
      `Cuisson : ${LABELS.cooking[p.cooking]}`,
      `Véhicule : ${LABELS.ev[p.ev]}`,
      kit.length ? `Équipements : ${kit.join(", ")}` : "",
      ``,
      `Pièces`,
      rooms || "· (aucune)",
      ``,
      `Pourquoi ce compteur`,
      why,
      ``,
      `Tableau`,
      circuits,
      ``,
      `Contrôle NF C 15-100`,
      checks,
      ``,
      `Outil pédagogique (NF C 15-100 éd. 2024). À faire valider par un électricien. Pas un visa Consuel.`,
    ]
      .join("\n");
  }

  function buildExtractHtml() {
    const { p, power, panel, comp, date } = extractPayload();
    const kit = kitList(p);
    const rooms = p.rooms
      .map((r) => {
        const st = E.roomStatus(r, p);
        return `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(E.KINDS[r.kind].label)}</td><td>${r.area} m²</td><td>${r.sockets}</td><td>${r.lights}</td><td>${r.rj45}</td><td>${st.ok ? "OK" : "Sous mini"}</td></tr>`;
      })
      .join("");
    const why = power.groups
      .filter((g) => g.emploi > 40)
      .sort((a, b) => b.emploi - a.emploi)
      .map((g) => `<li><b>${escapeHtml(g.label)}</b> — ${Math.round(g.emploi)} W <span>${escapeHtml(g.detail)}</span></li>`)
      .join("");
    const circuits = panel.circuits
      .map(
        (c) =>
          `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.breaker)} ${c.poles}</td><td>${c.section} mm²</td><td>DDR ${c.type}</td><td>${escapeHtml(c.breakerWhy || c.note || "—")}</td></tr>`
      )
      .join("");
    const ddrs = panel.ddrs
      .map(
        (d) =>
          `<p><b>${escapeHtml(d.label)}</b> ${d.in} A — ${d.circuits.map((c) => escapeHtml(c.name)).join(", ") || "réserve"}</p>`
      )
      .join("");
    const checks = comp
      .map(
        (c) =>
          `<li><b>${c.ok ? "OK" : "À reprendre"}</b> — ${escapeHtml(c.label)} <span>${escapeHtml(c.detail)}</span></li>`
      )
      .join("");
    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Extrait Atelier 15-100 — ${power.subscription} kVA</title>
  <style>
    :root { --ink:#1b1713; --soft:#5c5348; --line:#d4cbb8; --paper:#f3eee4; --copper:#c45c26; --ok:#2f6b4a; }
    * { box-sizing: border-box; }
    body { margin:0; font: 16px/1.45 Outfit, Segoe UI, sans-serif; color:var(--ink); background:var(--paper); }
    .sheet { max-width: 820px; margin: 0 auto; padding: 36px 28px 64px; }
    h1 { font-family: Georgia, serif; font-size: 2.1rem; letter-spacing: -0.04em; margin: 8px 0 6px; }
    h2 { font-size: 1.15rem; margin: 28px 0 10px; }
    .kicker { color: var(--copper); letter-spacing: .14em; text-transform: uppercase; font-size: .72rem; }
    .muted { color: var(--soft); }
    .hero { display:flex; justify-content:space-between; gap: 24px; align-items:flex-end; border-bottom:1px solid var(--line); padding-bottom: 20px; }
    .kva { font-family: Georgia, serif; font-size: 3.4rem; letter-spacing: -0.05em; line-height: .9; }
    .kva small { font-size: 1rem; color: var(--soft); margin-left: 8px; }
    .stats { display:grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 18px; }
    .stat { background:#fff; border:1px solid var(--line); border-radius: 12px; padding: 12px; }
    .stat b { display:block; font-size: 1.25rem; }
    table { width:100%; border-collapse: collapse; font-size: .92rem; }
    th, td { text-align:left; padding: 8px 10px; border-bottom: 1px solid var(--line); }
    th { font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--soft); }
    ul { margin: 0; padding-left: 18px; }
    li span, p span { color: var(--soft); }
    .note { margin-top: 28px; font-size: .82rem; color: var(--soft); border-top: 1px solid var(--line); padding-top: 14px; }
    @media print { body { background: white; } .sheet { padding: 0; } }
  </style>
</head>
<body>
  <article class="sheet">
    <div class="kicker">Atelier 15-100 · extrait partageable</div>
    <div class="hero">
      <div>
        <h1>${power.subscription} kVA <small>${power.phase === "mono" ? "monophasé" : "triphasé"}</small></h1>
        <p class="muted">${escapeHtml(date)} · ${escapeHtml(power.peakLabel)} · ${power.kvaRaw.toFixed(1)} kVA de besoin</p>
      </div>
      <div class="kva">${power.subscription}<small>kVA</small></div>
    </div>
    <div class="stats">
      <div class="stat"><b>${power.agcp} A</b>Disjoncteur de branchement</div>
      <div class="stat"><b>${panel.circuits.length}</b>Départs au tableau</div>
      <div class="stat"><b>${Math.round(power.area)} m²</b>${escapeHtml(LABELS.housing[p.housing] || "")}</div>
    </div>
    <h2>Portrait du logement</h2>
    <p>${escapeHtml(LABELS.era[p.era])} · Chauffage ${escapeHtml(LABELS.heating[p.heating])} · ECS ${escapeHtml(LABELS.dhw[p.dhw])} · Cuisson ${escapeHtml(LABELS.cooking[p.cooking])} · ${escapeHtml(LABELS.ev[p.ev])}${kit.length ? "<br>Équipements : " + escapeHtml(kit.join(", ")) : ""}</p>
    <h2>Pièces</h2>
    <table>
      <thead><tr><th>Pièce</th><th>Type</th><th>Surface</th><th>Prises</th><th>Éclairage</th><th>RJ45</th><th>Norme</th></tr></thead>
      <tbody>${rooms || "<tr><td colspan='7'>Aucune pièce</td></tr>"}</tbody>
    </table>
    <h2>Pourquoi ce compteur</h2>
    <ul>${why}</ul>
    <h2>Tableau de répartition</h2>
    ${ddrs}
    <p class="muted">${panel.reserve} modules de réserve (20 %).</p>
    <h2>Nomenclature</h2>
    <table>
      <thead><tr><th>Circuit</th><th>Disjoncteur</th><th>Section</th><th>Différentiel</th><th>Courbe</th></tr></thead>
      <tbody>${circuits}</tbody>
    </table>
    <h2>Contrôle NF C 15-100</h2>
    <ul>${checks}</ul>
    <p class="note">Lecture pédagogique de la NF C 15-100 édition 2024. Ce document ne remplace pas une étude ni l'attestation Consuel. À faire valider par un électricien qualifié avant travaux.</p>
  </article>
</body>
</html>`;
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-on"), 4200);
  }

  async function shareExtract() {
    setStep("bilan");
    const { power } = extractPayload();
    const html = buildExtractHtml();
    const text = buildExtractText();
    const name = `Atelier-15-100_${power.subscription}kVA_extrait.html`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const file = new File([blob], name, { type: "text/html" });
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Atelier 15-100 · ${power.subscription} kVA`,
          text,
        });
        toast("Extrait envoyé.");
        return;
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    try {
      await navigator.clipboard.writeText(text);
      toast("Fichier HTML téléchargé · résumé copié. Tu peux l’envoyer tel quel.");
    } catch {
      toast("Fichier HTML téléchargé — ouvre-le et fais Transférer / Imprimer.");
    }
  }

  function bindAtelier() {
    $$("[data-set]").forEach((b) =>
      b.addEventListener("click", () => {
        state.project[b.dataset.set] = b.dataset.val;
        save();
        renderAtelier();
      })
    );
    $$("[data-toggle]").forEach((b) =>
      b.addEventListener("click", () => {
        state.project[b.dataset.toggle] = !state.project[b.dataset.toggle];
        save();
        renderAtelier();
      })
    );
    $$("[data-tpl]").forEach((b) =>
      b.addEventListener("click", () => {
        E.applyTemplate(state.project, b.dataset.tpl);
        state.selectedRoom = null;
        save();
        renderAtelier();
      })
    );
    const add = $("#add-room");
    if (add) {
      add.addEventListener("click", () => {
        const kind = $("#new-kind").value;
        const area = Number($("#new-area").value) || 10;
        const room = E.hydrateRoom({ kind, area, name: E.KINDS[kind].label }, state.project);
        state.project.rooms.push(room);
        state.selectedRoom = room.id;
        save();
        renderAtelier();
      });
    }
    $$("[data-del]").forEach((b) =>
      b.addEventListener("click", () => {
        state.project.rooms = state.project.rooms.filter((r) => r.id !== b.dataset.del);
        save();
        renderAtelier();
      })
    );
    $$("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => {
        state.selectedRoom = b.dataset.edit;
        renderEditor();
      })
    );
    $$("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => {
        state.selectedRoom = b.dataset.pick;
        if (state.step === "pieces") renderEditor();
        else {
          setStep("pieces");
          renderEditor();
        }
      })
    );
  }

  function renderEditor() {
    const box = $("#room-editor");
    if (!box) return;
    const room = state.project.rooms.find((r) => r.id === state.selectedRoom);
    if (!room) {
      box.innerHTML = "";
      return;
    }
    const st = E.roomStatus(room, state.project);
    box.innerHTML = `
      <div class="card" style="margin-top:14px">
        <h3>Régler ${escapeHtml(room.name)}</h3>
        <div class="field"><label>Nom</label><input id="ed-name" type="text" value="${escapeHtml(room.name)}"></div>
        <div class="field"><label>Surface (m²)</label><input id="ed-area" type="number" min="0" value="${room.area}"></div>
        <div class="field"><label>Prises (mini ${st.needS})</label><input id="ed-sock" type="number" min="0" value="${room.sockets}"></div>
        <div class="field"><label>Points d'éclairage (mini ${st.needL})</label><input id="ed-light" type="number" min="0" value="${room.lights}"></div>
        <div class="field"><label>RJ45 (mini ${st.needN})</label><input id="ed-rj" type="number" min="0" value="${room.rj45}"></div>
        <p class="small ${st.ok ? "muted" : ""}" style="${st.ok ? "" : "color:var(--bad)"}">${st.ok ? "Cette pièce tient le minimum de la norme." : "Sous le minimum NF C 15-100."}</p>
      </div>
    `;
    const apply = () => {
      room.name = $("#ed-name").value;
      room.area = Number($("#ed-area").value) || 0;
      const needS = E.minSockets(room.kind, room.area, state.project);
      room.sockets = Number($("#ed-sock").value) || 0;
      if (room.sockets < needS) room.sockets = needS;
      room.lights = Number($("#ed-light").value) || 0;
      room.rj45 = Number($("#ed-rj").value) || 0;
      save();
      renderAtelier();
      state.selectedRoom = room.id;
      renderEditor();
    };
    ["ed-name", "ed-area", "ed-sock", "ed-light", "ed-rj"].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener("change", apply);
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-view]");
    if (nav && nav.dataset.view) {
      e.preventDefault();
      showView(nav.dataset.view);
    }
    const step = e.target.closest("[data-step]");
    if (step && step.dataset.step) setStep(step.dataset.step);
    const ch = e.target.closest("[data-ch]");
    if (ch && ch.dataset.ch) {
      state.chapter = ch.dataset.ch;
      renderGuide();
    }
  });

  $("#btn-print")?.addEventListener("click", () => {
    setStep("bilan");
    setTimeout(() => window.print(), 50);
  });
  $("#btn-share")?.addEventListener("click", () => {
    shareExtract();
  });
  $("#btn-reset")?.addEventListener("click", () => {
    if (confirm("Recommencer avec un T3 vierge ?")) {
      state.project = seeded();
      save();
      setStep("profil");
    }
  });

  showView("home");
})();
