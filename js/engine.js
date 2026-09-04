/**
 * Moteur pédagogique NF C 15-100 (éd. 2024) + bilan de puissance.
 * Outil d'aide à la compréhension — ne remplace pas un électricien ni le Consuel.
 */
(function (global) {
  const KINDS = {
    living: { label: "Séjour", principal: true },
    kitchen: { label: "Cuisine", principal: false },
    bedroom: { label: "Chambre", principal: true },
    office: { label: "Bureau", principal: true },
    dining: { label: "Salle à manger", principal: true },
    bathroom: { label: "Salle de bain", principal: false },
    wc: { label: "WC", principal: false },
    hallway: { label: "Dégagement", principal: false },
    entrance: { label: "Entrée", principal: false },
    laundry: { label: "Buanderie", principal: false },
    garage: { label: "Garage", principal: false },
    other: { label: "Autre pièce", principal: false },
    outdoor: { label: "Extérieur", principal: false },
  };

  const TEMPLATES = {
    studio: {
      label: "Studio",
      rooms: [
        { kind: "living", name: "Pièce unique", area: 22 },
        { kind: "kitchen", name: "Kitchenette", area: 4 },
        { kind: "bathroom", name: "Salle d'eau", area: 4 },
      ],
    },
    t2: {
      label: "T2",
      rooms: [
        { kind: "entrance", name: "Entrée", area: 4 },
        { kind: "living", name: "Séjour", area: 22 },
        { kind: "kitchen", name: "Cuisine", area: 8 },
        { kind: "bedroom", name: "Chambre", area: 11 },
        { kind: "bathroom", name: "Salle de bain", area: 5 },
        { kind: "wc", name: "WC", area: 2 },
      ],
    },
    t3: {
      label: "T3",
      rooms: [
        { kind: "entrance", name: "Entrée", area: 5 },
        { kind: "living", name: "Séjour", area: 26 },
        { kind: "kitchen", name: "Cuisine", area: 10 },
        { kind: "bedroom", name: "Chambre 1", area: 12 },
        { kind: "bedroom", name: "Chambre 2", area: 10 },
        { kind: "bathroom", name: "Salle de bain", area: 6 },
        { kind: "wc", name: "WC", area: 2 },
        { kind: "hallway", name: "Dégagement", area: 5 },
      ],
    },
    t4: {
      label: "T4 / maison",
      rooms: [
        { kind: "entrance", name: "Entrée", area: 6 },
        { kind: "living", name: "Séjour", area: 32 },
        { kind: "kitchen", name: "Cuisine", area: 12 },
        { kind: "bedroom", name: "Chambre 1", area: 13 },
        { kind: "bedroom", name: "Chambre 2", area: 11 },
        { kind: "bedroom", name: "Chambre 3", area: 10 },
        { kind: "bathroom", name: "Salle de bain", area: 7 },
        { kind: "wc", name: "WC", area: 2 },
        { kind: "hallway", name: "Dégagement", area: 6 },
        { kind: "laundry", name: "Buanderie", area: 5 },
        { kind: "outdoor", name: "Entrée extérieure", area: 0 },
      ],
    },
  };

  const HEAT_W = { re2020: 35, rt2012: 45, y2000: 70, old: 100 };
  const SUB_MONO = [3, 6, 9, 12];
  const SUB_TRI = [9, 12, 15, 18, 24, 36];

  function uid() {
    return "r" + Math.random().toString(36).slice(2, 9);
  }

  function defaultProject() {
    return {
      housing: "house",
      levels: 1,
      era: "rt2012",
      heating: "pac-air",
      dhw: "thermo",
      cooking: "induction",
      ev: "none",
      evOffPeak: true,
      dhwOffPeak: true,
      pool: false,
      ac: false,
      shutters: true,
      dishwasher: true,
      oven: true,
      washer: true,
      dryer: false,
      freezer: false,
      openKitchen: false,
      solar: "pv",
      solarRegion: "centre",
      solarOrient: "south",
      solarTilt: "30",
      rooms: [],
    };
  }

  function minSockets(kind, area, project) {
    if (kind === "living") {
      let a = area;
      if (project.openKitchen) {
        const k = project.rooms.find((r) => r.kind === "kitchen");
        const total = area + (k ? k.area : 0);
        a = Math.max(0, total - 8);
      }
      if (a <= 28) return Math.max(5, Math.ceil(a / 4) || 5);
      return Math.max(7, Math.ceil(a / 4));
    }
    if (kind === "kitchen") return area <= 4 ? 3 : 6;
    if (kind === "bedroom" || kind === "office") return 3;
    if (kind === "bathroom") return 1;
    if (kind === "wc" || kind === "outdoor") return 0;
    return area > 4 ? 1 : 0;
  }

  function minLights(kind) {
    if (kind === "outdoor") return 1;
    return 1;
  }

  function principalCount(rooms) {
    return rooms.filter((r) => KINDS[r.kind]?.principal).length;
  }

  function minRj45(room, project) {
    const n = principalCount(project.rooms);
    if (room.kind === "living") return 2;
    if (n <= 1 && KINDS[room.kind]?.principal) return 2;
    if (room.kind === "bedroom" || room.kind === "office") {
      if (n === 2) return 1;
      if (n >= 3) return 1;
    }
    return 0;
  }

  function hydrateRoom(partial, project) {
    const room = {
      id: partial.id || uid(),
      kind: partial.kind,
      name: partial.name || KINDS[partial.kind].label,
      area: Number(partial.area) || 0,
      sockets: partial.sockets,
      lights: partial.lights,
      rj45: partial.rj45,
    };
    if (room.sockets == null) room.sockets = minSockets(room.kind, room.area, project);
    if (room.lights == null) room.lights = minLights(room.kind);
    if (room.rj45 == null) room.rj45 = minRj45(room, project);
    return room;
  }

  function applyTemplate(project, key) {
    const t = TEMPLATES[key];
    project.rooms = t.rooms.map((r) => hydrateRoom({ ...r }, { ...project, rooms: t.rooms }));
    return project;
  }

  function heatedArea(project) {
    return project.rooms
      .filter((r) => r.kind !== "outdoor" && r.kind !== "garage")
      .reduce((s, r) => s + (r.area || 0), 0);
  }

  function totalArea(project) {
    return project.rooms.reduce((s, r) => s + (r.area || 0), 0);
  }

  function roomStatus(room, project) {
    const needS = minSockets(room.kind, room.area, project);
    const needL = minLights(room.kind);
    const needN = minRj45(room, project);
    const ok = room.sockets >= needS && room.lights >= needL && room.rj45 >= needN;
    return { ok, needS, needL, needN };
  }

  function heatingElectricalW(project) {
    const a = heatedArea(project);
    if (project.heating === "electric") return a * (HEAT_W[project.era] || 70);
    if (project.heating === "pac-air") return Math.max(1200, a * 10);
    if (project.heating === "pac-eau") return Math.max(1800, a * 14);
    return 0;
  }

  const SOLAR_YIELD = { nord: 980, centre: 1160, sud: 1380 };
  const SOLAR_ORIENT = { south: 1, se: 0.95, sw: 0.95, east: 0.86, west: 0.86, north: 0.55 };
  const SOLAR_TILT = { "15": 0.93, "30": 1, "45": 0.97, "60": 0.88 };
  const PANEL_W = 425;
  const PANEL_M2 = 2.15;

  function annualConsumptionKwh(project) {
    const area = Math.max(heatedArea(project), 20);
    let kwh = area * 22;
    if (project.heating === "electric") {
      const perM2 = { re2020: 38, rt2012: 55, y2000: 90, old: 125 };
      kwh += area * (perM2[project.era] || 70);
    } else if (project.heating === "pac-air") kwh += area * 32;
    else if (project.heating === "pac-eau") kwh += area * 42;
    if (project.dhw === "electric") kwh += 1100;
    else if (project.dhw === "thermo") kwh += 420;
    if (project.ev === "3.7" || project.ev === "7.4") kwh += 2200;
    if (project.pool) kwh += 1800;
    if (project.ac) kwh += 450;
    if (project.dryer) kwh += 350;
    return Math.round(kwh);
  }

  function solarSizing(project) {
    const cons = annualConsumptionKwh(project);
    const yieldK = (SOLAR_YIELD[project.solarRegion] || 1160) *
      (SOLAR_ORIENT[project.solarOrient] || 1) *
      (SOLAR_TILT[project.solarTilt] || 1);
    const want = project.solar && project.solar !== "none";
    const withBat = project.solar === "pv-battery";
    const roofCap = project.housing === "apartment" ? 3.4 : 9;
    let kWc = cons / yieldK;
    kWc = Math.min(kWc, roofCap);
    if (project.housing === "apartment") kWc = Math.min(kWc, 3.4);
    kWc = Math.max(1.7, kWc);
    const nPanels = Math.max(4, Math.round((kWc * 1000) / PANEL_W));
    kWc = Math.round((nPanels * PANEL_W) / 100) / 10;
    const production = Math.round(kWc * yieldK);
    const autoRate = withBat ? 0.72 : 0.38;
    const selfUse = Math.round(production * autoRate);
    const injected = Math.max(0, production - selfUse);
    const coverage = Math.min(100, Math.round((selfUse / cons) * 100));
    const roofM2 = Math.round(nPanels * PANEL_M2);
    let batteryKwh = 0;
    if (withBat) {
      const raw = Math.max(5, Math.min(13.5, kWc * 1.25));
      const stock = [5, 6.5, 8, 10, 13.5];
      batteryKwh = stock.reduce((best, v) => (Math.abs(v - raw) < Math.abs(best - raw) ? v : best), stock[0]);
    }
    const acA = kWc * 1000 / 230;
    let calibre = 16;
    let section = 2.5;
    if (acA > 16) {
      calibre = 20;
      section = 2.5;
    }
    if (acA > 20) {
      calibre = 32;
      section = 6;
    }
    if (acA > 32) {
      calibre = 40;
      section = 10;
    }
    const inverterKw = Math.round(kWc * 0.9 * 10) / 10;
    const regionLabel = { nord: "Nord / façade atlantique", centre: "Centre / Île-de-France", sud: "Sud / Méditerranée" };
    const orientLabel = { south: "Sud", se: "Sud-est", sw: "Sud-ouest", east: "Est", west: "Ouest", north: "Nord" };
    return {
      enabled: want,
      withBat,
      cons,
      kWc,
      nPanels,
      panelW: PANEL_W,
      production,
      selfUse,
      injected,
      coverage,
      autoRate,
      roofM2,
      batteryKwh,
      yieldK: Math.round(yieldK),
      inverterKw,
      calibre,
      section,
      acA: Math.round(acA * 10) / 10,
      regionLabel: regionLabel[project.solarRegion] || "Centre",
      orientLabel: orientLabel[project.solarOrient] || "Sud",
      tilt: project.solarTilt || "30",
      note: project.housing === "apartment"
        ? "En copropriété : toiture collective ou omrière, accord de l'AG. Le chiffre reste une cible de production."
        : "Dimensionné pour l'autoconsommation, pas pour tout couvrir l'hiver. Surplus injecté au réseau.",
    };
  }

  function pickSubscription(kva, table) {
    for (let i = 0; i < table.length; i++) {
      const v = table[i];
      if (kva <= v) return v;
      if (kva <= v * 1.12) return v;
    }
    return table[table.length - 1];
  }

  function powerBalance(project) {
    const area = Math.max(heatedArea(project), 1);
    const sockets = project.rooms.reduce((s, r) => s + (r.sockets || 0), 0);
    const lights = project.rooms.reduce((s, r) => s + (r.lights || 0), 0);

    const lightingW = Math.max(200, area * 6);
    const sockInst = sockets * 120;
    let cookInst = 0;
    if (project.cooking === "induction") cookInst = 7200;
    else if (project.cooking === "vitro") cookInst = 6000;
    if (project.oven) cookInst += 2500;

    let appInst = 80;
    const bits = ["VMC 80 W"];
    if (project.dishwasher) {
      appInst += 2200;
      bits.push("lave-vaisselle");
    }
    if (project.washer) {
      appInst += 2200;
      bits.push("lave-linge");
    }
    if (project.dryer) {
      appInst += 2500;
      bits.push("sèche-linge");
    }
    if (project.freezer) {
      appInst += 150;
      bits.push("congélateur dédié");
    }
    if (project.shutters) {
      appInst += 80;
      bits.push("volets");
    }

    const heatInst = heatingElectricalW(project);
    let dhwInst = 0;
    if (project.dhw === "electric") dhwInst = 2200;
    else if (project.dhw === "thermo") dhwInst = 500;
    const evMap = { none: 0, "3.7": 3700, "7.4": 7400 };
    const evInst = evMap[project.ev] || 0;
    let extraInst = 0;
    if (project.pool) extraInst += 1200;
    if (project.ac) extraInst += 1800;

    const cookPlaque = project.cooking === "induction" ? 7200 : project.cooking === "vitro" ? 6000 : 0;
    const cookOven = project.oven ? 2500 : 0;
    const wetInst = appInst - 80 - (project.freezer ? 150 : 0) - (project.shutters ? 80 : 0);

    const evening = {
      lighting: lightingW * 0.4,
      sockets: sockInst * 0.12,
      cooking: cookPlaque * 0.3 + cookOven * 0.15,
      appliances: 80 + (project.freezer ? 150 : 0) + (project.shutters ? 20 : 0) + wetInst * 0.12,
      heating: heatInst * (project.heating === "electric" ? 0.45 : 0.5),
      dhw:
        project.dhw === "electric"
          ? dhwInst * (project.dhwOffPeak ? 0.05 : 0.2)
          : dhwInst * 0.35,
      ev: project.evOffPeak ? 0 : evInst,
      extra: (project.pool ? 400 : 0) + (project.ac ? 900 : 0),
    };
    const morning = {
      lighting: lightingW * 0.3,
      sockets: sockInst * 0.08,
      cooking: cookPlaque ? 600 : 0,
      appliances: 80 + (project.freezer ? 150 : 0) + wetInst * 0.35,
      heating: heatInst * (project.heating === "electric" ? 0.7 : 0.75),
      dhw:
        project.dhw === "electric"
          ? dhwInst * (project.dhwOffPeak ? 0.05 : 0.8)
          : dhwInst * 0.45,
      ev: project.evOffPeak ? 0 : evInst * 0.2,
      extra: (project.pool ? 900 : 0) + (project.ac ? 0 : 0),
    };

    const sum = (o) => Object.values(o).reduce((s, n) => s + n, 0);
    const eveningW = sum(evening);
    const morningW = sum(morning);
    const peak = eveningW >= morningW ? evening : morning;
    const peakLabel =
      eveningW >= morningW
        ? "Pic du soir (cuisson + vie du logement)"
        : "Pic d'hiver le matin (chauffage)";

    const groups = [
      {
        id: "lighting",
        label: "Éclairage",
        installed: lightingW,
        emploi: peak.lighting,
        detail: `${lights} point(s) · LED, quelques pièces allumées — pas toute la maison à 8 W/m².`,
      },
      {
        id: "sockets",
        label: "Prises de courant",
        installed: sockInst,
        emploi: peak.sockets,
        detail: `${sockets} socles · charge réelle faible (chargeurs, box, lampes).`,
      },
      {
        id: "cooking",
        label: "Cuisson",
        installed: cookInst,
        emploi: peak.cooking,
        detail:
          project.cooking === "gas"
            ? "Plaque gaz : presque rien sur le compteur, hors four."
            : "Une plaque 7,2 kW ne tire pas 7 kW : deux foyers, pas six. Le four ne cuit pas à fond en même temps.",
      },
      {
        id: "appliances",
        label: "Électroménager & VMC",
        installed: appInst,
        emploi: peak.appliances,
        detail: bits.join(", ") + ". Machine et plaque, rarement ensemble à plein régime.",
      },
      {
        id: "heating",
        label: "Chauffage / PAC",
        installed: heatInst,
        emploi: peak.heating,
        detail:
          project.heating === "electric"
            ? `Convecteurs : ${HEAT_W[project.era]} W/m² × ${Math.round(area)} m², fil pilote — toutes les pièces ne sont pas à fond.`
            : project.heating.startsWith("pac")
              ? "Puissance électrique de la pompe (elle module, elle n'est pas collée à Pmax)."
              : "Chauffage non électrique : 0 kW sur le Linky.",
      },
      {
        id: "dhw",
        label: "Eau chaude",
        installed: dhwInst,
        emploi: peak.dhw,
        detail:
          project.dhw === "electric" && project.dhwOffPeak
            ? "Ballon en heures creuses : hors du pic du soir."
            : project.dhw === "electric"
              ? "Ballon en heures pleines : surtout le matin."
              : project.dhw === "thermo"
                ? "Thermodynamique : petit appel, en continu."
                : "Gaz / collectif : rien sur l'abonnement.",
      },
      {
        id: "ev",
        label: "Recharge véhicule",
        installed: evInst,
        emploi: peak.ev,
        detail: evInst
          ? project.evOffPeak
            ? "Recharge de nuit : n'entre pas dans le pic."
            : "Recharge à la demande : on la voit sur le pic."
          : "Pas de borne prévue.",
      },
      {
        id: "extra",
        label: "Piscine / clim",
        installed: extraInst,
        emploi: peak.extra,
        detail: extraInst ? "Pompe et/ou clim, pas forcément au même moment que la plaque." : "Aucun.",
      },
    ];

    const emploiW = groups.reduce((s, g) => s + g.emploi, 0);
    const installedW = groups.reduce((s, g) => s + g.installed, 0);
    const kvaRaw = emploiW / 1000;
    const forceTri = project.heating === "electric" && heatInst > 9000;
    let sub;
    let phase;
    if (forceTri || kvaRaw > 12) {
      phase = "tri";
      sub = pickSubscription(kvaRaw, SUB_TRI);
    } else {
      phase = "mono";
      sub = pickSubscription(kvaRaw, SUB_MONO);
    }
    const tight = kvaRaw > sub * 0.92;
    const amps = phase === "mono" ? Math.round((sub * 1000) / 230) : Math.round((sub * 1000) / 400);

    const agcp =
      phase === "mono"
        ? sub <= 3
          ? 15
          : sub <= 6
            ? 30
            : sub <= 9
              ? 45
              : 60
        : sub <= 9
          ? 15
          : sub <= 18
            ? 30
            : sub <= 24
              ? 40
              : 60;

    return {
      groups,
      emploiW,
      installedW,
      kvaRaw,
      subscription: sub,
      phase,
      amps,
      agcp,
      area,
      sockets,
      lights,
      peakLabel,
      tight,
    };
  }

  function breakerSpec(circuit, project) {
    let curve = "C";
    let why = "Usage général : prises et électroménager. Courbe C (5 à 10 × In).";
    const kind = circuit.kind;
    const name = circuit.name || "";

    if (kind === "light" || kind === "out") {
      curve = "C";
      why = "LED : pic à l'allumage. Une courbe B claquerait trop souvent ; la C est le standard actuel.";
    } else if (kind === "heat") {
      curve = "B";
      why = "Convecteurs = résistance pure. Courbe B (3 à 5 × In) : coupe plus vite, assez pour ce type de charge.";
    } else if (kind === "dhw" && project.dhw === "electric") {
      curve = "B";
      why = "Ballon à résistance : charge résistive, courbe B. Ajouter un contacteur heures creuses.";
    } else if (kind === "dhw") {
      curve = "C";
      why = "Ballon thermodynamique : petit compresseur, courbe C.";
    } else if (kind === "pac") {
      curve = "D";
      why = "Compresseur (PAC, clim, pompe) : gros courant d'appel. Une C partirait au démarrage ; la D laisse passer le pic (10 à 20 × In).";
    } else if (kind === "pv") {
      curve = "C";
      why = "Départ AC de l'onduleur. Courbe C, calibre selon la puissance crête (environ kWc × 1000 / 230 V).";
    } else if (kind === "ev") {
      curve = "C";
      why = "Borne : courant plutôt stable. Courbe C, calibre selon la fiche constructeur.";
    } else if (kind === "other" && name.indexOf("VMC") === 0) {
      curve = "C";
      why = "Petit moteur en continu. C 2 A dédié, pour ne pas l'éteindre avec l'éclairage.";
    } else if (kind === "other" && name.indexOf("Volet") === 0) {
      curve = "C";
      why = "Moteurs de volets : appel modéré, courbe C.";
    } else if (kind === "spe" && name.indexOf("Plaque") === 0) {
      curve = "C";
      why = "Induction : un appel au branchement, mais C 32 A reste le standard logement.";
    } else if (kind === "spe") {
      curve = "C";
      why = "Gros électroménager (moteur + résistance). Courbe C.";
    } else if (kind === "sock") {
      curve = "C";
      why = "Prises : on ne sait pas ce qu'on branche. Courbe C par défaut.";
    }

    circuit.curve = curve;
    circuit.poles = "1P+N";
    circuit.icu = "4,5 kA";
    circuit.breaker = curve + circuit.calibre;
    circuit.breakerWhy = why;
    return circuit;
  }

  function ddrSpec(circuit, project) {
    const kind = circuit.kind;
    const name = circuit.name || "";
    let ddr = circuit.type || "AC";
    let why = "Type AC : courants alternatifs classiques (éclairage, prises).";

    if (kind === "ev") {
      ddr = "A";
      why =
        "IRVE : un DDR 30 mA qui ne protège que cette borne. Type A minimum (mode 1/2). Mode 3 mono : A ou F. Mode 3 tri : type B, ou A/F + DD-CDC.";
    } else if (kind === "pv") {
      ddr = "A";
      why = "Onduleur PV côté AC : DDR 30 mA type A dédié (parfois B selon l'onduleur). Côté DC : NF C 15-712 — sectionneur, parafoudre.";
    } else if (kind === "out") {
      ddr = "A";
      why = "Extérieur (usages non fixés au bâtiment) : différentiel dédié, distinct des circuits intérieurs.";
    } else if (kind === "pac") {
      ddr = "F";
      why = "Variateur monophasé (PAC, clim, pompe) : type F obligatoire. Il vaut un type A, en plus immunisé aux parasites.";
    } else if (kind === "spe" && name.indexOf("Plaque") === 0) {
      ddr = "A";
      why = "Plaque / cuisinière : type A obligatoire (défauts « redressés » possibles).";
    } else if (kind === "spe" && name.indexOf("Lave-linge") === 0) {
      ddr = "A";
      why = "Lave-linge : type A obligatoire.";
    } else if (kind === "spe" && name.indexOf("Congélateur") === 0) {
      ddr = "A";
      why = "Congélateur : type A, de préférence haute immunité (A-SI ou F) pour ne pas perdre le froid sur un micro-défaut.";
    } else if (kind === "dhw") {
      ddr = "A";
      why = "Chauffe-eau : sous type A. Son calibre compte à 100 % pour dimensionner le DDR (comme chauffage et IRVE).";
    } else if (kind === "heat") {
      ddr = "AC";
      why = "Chauffage résistif : type AC suffit. Le calibre de ces départs compte à 100 % dans le calcul du DDR.";
    } else if (kind === "light") {
      ddr = "AC";
      why = "Éclairage : type AC. À ne pas mettre sous le même DDR que les prises de la même pièce (continuité de service).";
    } else if (kind === "sock") {
      ddr = "AC";
      why = "Prises classiques : type AC. Cuisine dédiée souvent sous le type A avec l'électro.";
    } else if (kind === "other" && name.indexOf("VMC") === 0) {
      ddr = "AC";
      why = "VMC : type AC, sur un autre DDR que l'éclairage si possible, pour qu'elle continue si une pièce saute.";
    } else if (kind === "spe") {
      ddr = "A";
      why = "Gros électroménager : type A par prudence (moteur + électronique).";
    }

    if (kind === "sock" && name.indexOf("cuisine") !== -1) {
      ddr = "A";
      why = "Prises cuisine : on les met sous le type A, avec la plaque et le lave-linge.";
    }

    circuit.type = ddr;
    circuit.ddrWhy = why;
    circuit.ddrLabel = "DDR " + ddr + " 30 mA";
    return circuit;
  }

  function protectCircuit(circuit, project) {
    return ddrSpec(breakerSpec(circuit, project), project);
  }

  function specializedCircuits(project) {
    const list = [];
    const studio = principalCount(project.rooms) <= 1;
    if (project.cooking !== "gas") {
      list.push({
        name: "Plaque / cuisinière",
        calibre: 32,
        section: 6,
        type: "A",
        kind: "spe",
      });
    }
    if (project.oven) list.push({ name: "Four", calibre: 20, section: 2.5, type: "A", kind: "spe" });
    if (project.dishwasher) list.push({ name: "Lave-vaisselle", calibre: 20, section: 2.5, type: "A", kind: "spe" });
    if (project.washer) list.push({ name: "Lave-linge", calibre: 20, section: 2.5, type: "A", kind: "spe" });
    if (project.dryer) list.push({ name: "Sèche-linge", calibre: 20, section: 2.5, type: "A", kind: "spe" });
    if (project.freezer) list.push({ name: "Congélateur", calibre: 16, section: 2.5, type: "A", kind: "spe" });
    if (project.dhw === "electric" || project.dhw === "thermo") {
      list.push({ name: "Chauffe-eau", calibre: 20, section: 2.5, type: "A", kind: "dhw" });
    }
    list.push({ name: "VMC", calibre: 2, section: 1.5, type: "AC", kind: "other" });
    if (project.shutters) list.push({ name: "Volets roulants", calibre: 16, section: 1.5, type: "AC", kind: "other" });

    const heatW = heatingElectricalW(project);
    if (project.heating === "electric" && heatW > 0) {
      let left = heatW;
      let i = 1;
      while (left > 0) {
        const chunk = Math.min(left, 3500);
        list.push({
          name: "Chauffage " + i,
          calibre: chunk <= 3500 ? 16 : 20,
          section: chunk <= 3500 ? 1.5 : 2.5,
          type: "AC",
          kind: "heat",
        });
        left -= chunk;
        i += 1;
      }
    } else if (project.heating.startsWith("pac")) {
      list.push({
        name: "Pompe à chaleur",
        calibre: heatW > 4500 ? 32 : 20,
        section: heatW > 4500 ? 6 : 2.5,
        type: "F",
        kind: "pac",
      });
    }
    if (project.ac) list.push({ name: "Climatisation", calibre: 20, section: 2.5, type: "F", kind: "pac" });
    if (project.pool) list.push({ name: "Pompe piscine", calibre: 16, section: 2.5, type: "F", kind: "pac" });
    if (project.ev !== "none") {
      list.push({
        name: "IRVE (recharge VE)",
        calibre: project.ev === "7.4" ? 40 : 20,
        section: project.ev === "7.4" ? 10 : 2.5,
        type: "A",
        kind: "ev",
      });
    }

    const hasOutdoor = project.rooms.some((r) => r.kind === "outdoor");
    if (hasOutdoor) {
      list.push({ name: "Éclairage extérieur", calibre: 16, section: 1.5, type: "A", kind: "out" });
    }

    const solar = solarSizing(project);
    if (solar.enabled) {
      list.push({
        name: solar.withBat ? "Onduleur PV + batterie" : "Onduleur photovoltaïque",
        calibre: solar.calibre,
        section: solar.section,
        type: "A",
        kind: "pv",
        note: solar.kWc + " kWc · " + solar.nPanels + " modules",
      });
    }

    if (studio) {
      const spe = list.filter((c) => c.kind === "spe");
      if (spe.length > 3) {
        /* studio : 1×32 A + 2×16 A min si équipement non fourni — on garde l'équipement réel */
      }
    }
    return list.map(function (c) {
      return protectCircuit(c, project);
    });
  }

  function generalCircuits(project) {
    const list = [];
    const lightPts = project.rooms.reduce((s, r) => s + (r.kind === "outdoor" ? 0 : r.lights || 0), 0);
    const nLight = Math.max(principalCount(project.rooms) <= 1 ? 1 : 2, Math.ceil(lightPts / 8) || 1);
    for (let i = 0; i < nLight; i++) {
      list.push({ name: "Éclairage " + (i + 1), calibre: 16, section: 1.5, type: "AC", kind: "light" });
    }

    const kitchen = project.rooms.find((r) => r.kind === "kitchen");
    if (kitchen) {
      list.push({
        name: "Prises cuisine (dédié)",
        calibre: 20,
        section: 2.5,
        type: "A",
        kind: "sock",
        note: kitchen.area <= 4 ? "3 socles" : "6 socles dont 4 plan de travail",
      });
    }
    const otherSock = project.rooms
      .filter((r) => r.kind !== "kitchen")
      .reduce((s, r) => s + (r.sockets || 0), 0);
    const nSock = Math.max(1, Math.ceil(otherSock / 8) || 1);
    for (let i = 0; i < nSock; i++) {
      list.push({
        name: "Prises " + (i + 1),
        calibre: 20,
        section: 2.5,
        type: "AC",
        kind: "sock",
        note: "max. 8 socles / circuit en 2,5 mm² (éd. 2024)",
      });
    }
    return list.map(function (c) {
      return protectCircuit(c, project);
    });
  }

  function buildPanel(project, power) {
    const circuits = generalCircuits(project).concat(specializedCircuits(project));
    const buckets = {
      ev: [],
      pv: [],
      out: [],
      pac: [],
      a: [],
      ac: [],
    };
    circuits.forEach((c) => {
      if (c.kind === "ev") buckets.ev.push(c);
      else if (c.kind === "pv") buckets.pv.push(c);
      else if (c.kind === "out") buckets.out.push(c);
      else if (c.kind === "pac") buckets.pac.push(c);
      else if (c.type === "A") buckets.a.push(c);
      else buckets.ac.push(c);
    });

    function chunk(arr, n) {
      const out = [];
      for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
      return out;
    }

    const ddrs = [];
    buckets.ev.forEach((c) =>
      ddrs.push({
        type: "A",
        label: "DDR IRVE 30 mA type A",
        circuits: [c],
        dedicated: true,
        why: "Un différentiel rien que pour la borne. Type A minimum ; type F si tu veux plus d'immunité.",
      })
    );
    buckets.pv.forEach((c) =>
      ddrs.push({
        type: "A",
        label: "DDR PV 30 mA type A",
        circuits: [c],
        dedicated: true,
        why: "Onduleur solaire : DDR dédié côté AC. Ne pas le mélanger avec la cuisine. Côté DC : NF C 15-712.",
      })
    );
    buckets.out.forEach((c) =>
      ddrs.push({
        type: "A",
        label: "DDR extérieur 30 mA type A",
        circuits: [c],
        dedicated: true,
        why: "Les circuits extérieurs ont leur propre 30 mA, séparé de l'intérieur (une fuite au jardin n'éteint pas la maison).",
      })
    );
    chunk(buckets.pac, 8).forEach((cs, i) =>
      ddrs.push({
        type: "F",
        label: "DDR type F 30 mA" + (i ? " " + (i + 1) : ""),
        circuits: cs,
        why: "Variateur de vitesse : type F obligatoire. Il remplace un type A et déclenche moins « pour rien ».",
      })
    );
    chunk(buckets.a, 8).forEach((cs, i) =>
      ddrs.push({
        type: "A",
        label: "DDR type A 30 mA" + (i ? " " + (i + 1) : ""),
        circuits: cs,
        why: "Plaque, lave-linge, électro cuisine : type A obligatoire. Au moins un par logement.",
      })
    );
    chunk(buckets.ac, 8).forEach((cs, i) =>
      ddrs.push({
        type: "AC",
        label: "DDR type AC 30 mA" + (i ? " " + (i + 1) : ""),
        circuits: cs,
        why: "Éclairage, prises, chauffage résistif : type AC. On le sépare du type A pour qu'une fuite cuisine n'éteigne pas toute la maison.",
      })
    );

    if (ddrs.length < 2) {
      ddrs.push({
        type: "A",
        label: "DDR réserve 30 mA type A",
        circuits: [],
        why: "Deuxième différentiel obligatoire : si l'un saute, l'autre garde une partie du logement.",
      });
    }
    if (!ddrs.some((d) => d.type === "A" || d.type === "F")) {
      ddrs.unshift({
        type: "A",
        label: "DDR type A 30 mA",
        circuits: [],
        why: "Au moins un type A par logement (plaque, lave-linge, IRVE).",
      });
    }

    const agcp = power.agcp;
    ddrs.forEach((d) => {
      const heatish = d.circuits.filter((c) => c.kind === "heat" || c.kind === "dhw" || c.kind === "ev" || c.kind === "pac");
      const others = d.circuits.filter((c) => !heatish.includes(c));
      const aval = heatish.reduce((s, c) => s + c.calibre, 0) + others.reduce((s, c) => s + c.calibre * 0.5, 0);
      let inn = Math.max(agcp, aval);
      inn = inn <= 40 ? 40 : 63;
      d.in = inn;
    });

    const modulesUsed =
      2 +
      ddrs.reduce((s, d) => s + 2 + d.circuits.length, 0) +
      (project.dhw === "electric" ? 2 : 0);
    const reserve = Math.ceil(modulesUsed * 0.2);
    const totalModules = modulesUsed + reserve;

    return { circuits, ddrs, modulesUsed, reserve, totalModules };
  }

  function compliance(project) {
    const items = [];
    project.rooms.forEach((room) => {
      const st = roomStatus(room, project);
      items.push({
        ok: st.ok,
        label: room.name,
        detail: st.ok
          ? `OK · ${room.sockets} prises, ${room.lights} éclairage, ${room.rj45} RJ45`
          : `Minimum : ${st.needS} prises, ${st.needL} éclairage, ${st.needN} RJ45`,
      });
    });
    const nLightC = generalCircuits(project).filter((c) => c.kind === "light").length;
    const need2 = principalCount(project.rooms) > 1;
    items.push({
      ok: !need2 || nLightC >= 2,
      label: "Circuits d'éclairage",
      detail: need2 ? "Au moins 2 circuits (sauf logement 1 pièce principale)." : "1 circuit admis pour une seule pièce principale.",
    });
    const spe = specializedCircuits(project).filter((c) => c.kind === "spe");
    const minSpe = principalCount(project.rooms) <= 1 ? 2 : 4;
    items.push({
      ok: spe.length >= Math.min(minSpe, 4) || project.cooking === "gas" && spe.length >= 3,
      label: "Circuits spécialisés",
      detail: "Au moins 4 départs dédiés (plaque + 3 autres), adaptés si studio.",
    });
    items.push({
      ok: true,
      label: "DDR 30 mA",
      detail: "Tous les circuits sous différentiel 30 mA, 8 départs max par DDR, au moins un type A.",
    });
    if (project.rooms.some((r) => r.kind === "bathroom")) {
      items.push({
        ok: true,
        label: "Salle de bain",
        detail: "1 prise hors volume, pas de DCL en volumes 0/1, liaison équipotentielle.",
      });
    }
    if (solarSizing(project).enabled) {
      const s = solarSizing(project);
      items.push({
        ok: true,
        label: "Photovoltaïque",
        detail: s.kWc + " kWc, départ AC C" + s.calibre + " dédié, DDR type A 30 mA. Côté DC selon NF C 15-712.",
      });
    }
    return items;
  }

  global.NFC15100 = {
    KINDS,
    TEMPLATES,
    uid,
    defaultProject,
    minSockets,
    minLights,
    minRj45,
    hydrateRoom,
    applyTemplate,
    heatedArea,
    totalArea,
    roomStatus,
    powerBalance,
    solarSizing,
    annualConsumptionKwh,
    specializedCircuits,
    generalCircuits,
    buildPanel,
    compliance,
  };
})(window);
