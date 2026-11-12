/* Rythme d'alternance — calcule où j'en suis à partir du calendrier officiel
   « Calendrier BUT Informatique IAMSI 2025-2027 » (IUT Montpellier-Sète, prévisionnel).
   C = centre de formation (IUT), E = entreprise, X = examens.
   Pour tester une autre date : ajouter ?date=2027-03-01 à l'URL. */
(function () {
  "use strict";

  var ENTREPRISE = { short: "l'AMDM", long: "la Mutuelle des Motards" };
  var IUT = { short: "l'IUT", long: "l'IUT Montpellier-Sète" };

  // Contrat d'alternance (cerfa) : 1er sept. 2026 → 31 août 2027.
  var CONTRACT = { from: "2026-09-01", to: "2027-08-31" };
  // Stage de BUT 2 à l'AMDM, avant l'alternance.
  var STAGE = { from: "2026-04-13", to: "2026-07-03" };
  var RUNS = [
    ["2026-09-01","2026-09-04","E"],
    ["2026-09-07","2026-09-25","C"],["2026-09-28","2026-10-09","E"],["2026-10-12","2026-10-23","C"],
    ["2026-10-26","2026-11-06","E"],["2026-11-09","2026-11-20","C"],["2026-11-23","2026-12-04","E"],
    ["2026-12-07","2026-12-18","C"],["2026-12-21","2026-12-31","E"],["2027-01-04","2027-01-15","C"],
    ["2027-01-18","2027-01-29","E"],["2027-02-01","2027-02-12","C"],["2027-02-15","2027-03-05","E"],
    ["2027-03-08","2027-03-19","C"],["2027-03-22","2027-04-02","E"],["2027-04-05","2027-04-16","C"],
    ["2027-04-19","2027-04-30","E"],["2027-05-03","2027-05-04","X"],["2027-05-05","2027-08-23","E"],
    ["2027-08-24","2027-08-26","X"],["2027-08-27","2027-08-27","E"],
    // 30-31 août : absents du calendrier IUT, mais le contrat court jusqu'au 31.
    ["2027-08-30","2027-08-31","E"]
  ];
  var HOLIDAYS = ["2025-11-11","2025-12-25","2026-01-01","2026-04-06","2026-05-01","2026-05-08",
    "2026-05-14","2026-05-25","2026-07-14","2026-11-11","2026-12-25","2027-01-01","2027-03-29",
    "2027-05-06","2027-05-17","2027-07-14"];
  var YEARS = [{ id: "but3", label: "BUT 3 · 2026-27", from: CONTRACT.from, to: CONTRACT.to }];

  var MONTHS = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
  var MONTHS_S = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
  var MONTHS_L = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  var DAYS = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];

  /* ---------- dates (toujours en heure locale) ---------- */
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function add(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function monday(d) { return add(d, -((d.getDay() + 6) % 7)); }
  function fmt(d) { return d.getDate() + " " + MONTHS[d.getMonth()]; }
  function fmtLong(d) { return DAYS[d.getDay()] + " " + (d.getDate() === 1 ? "1er" : d.getDate()) + " " + MONTHS_L[d.getMonth()]; }

  function today() {
    var q = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search);
    if (q) return parse(q[1]);
    var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  /* ---------- statut d'un jour ---------- */
  var HOL = {}; HOLIDAYS.forEach(function (h) { HOL[h] = 1; });
  // W = week-end, F = férié, null = hors calendrier
  function status(d) {
    var wd = d.getDay(); if (wd === 0 || wd === 6) return "W";
    var s = iso(d); if (HOL[s]) return "F";
    for (var i = 0; i < RUNS.length; i++) if (s >= RUNS[i][0] && s <= RUNS[i][1]) return RUNS[i][2];
    return null;
  }
  function runOf(d) {
    var s = iso(d);
    for (var i = 0; i < RUNS.length; i++) if (s >= RUNS[i][0] && s <= RUNS[i][1]) return RUNS[i];
    return null;
  }
  // période « vécue » : une suite de jours ouvrés de même nature (les fériés et week-ends ne la coupent pas)
  function block(d) {
    var c = status(d); if (c !== "E" && c !== "C" && c !== "X") return null;
    var a = d, b = d, t;
    for (t = add(d, -1); ; t = add(t, -1)) { var s = status(t); if (s === c) a = t; else if (s !== "W" && s !== "F") break; }
    for (t = add(d, 1); ; t = add(t, 1)) { var s2 = status(t); if (s2 === c) b = t; else if (s2 !== "W" && s2 !== "F") break; }
    return { code: c, from: a, to: b, weeks: Math.round(((b - a) / 864e5 + 3) / 7) };
  }
  function nextChange(d, cur) {
    for (var t = add(d, 1), i = 0; i < 400; i++, t = add(t, 1)) {
      var s = status(t); if (s === null) return null;
      if (s !== "W" && s !== "F" && s !== cur) return { date: t, code: s, block: block(t) };
    }
    return null;
  }
  function nextWorkday(d) {
    for (var t = add(d, 1), i = 0; i < 30; i++, t = add(t, 1)) {
      var s = status(t); if (s === null) return null; if (s !== "W" && s !== "F") return { date: t, code: s };
    }
    return null;
  }
  function place(c, long) {
    if (c === "E") return long ? ENTREPRISE.long : ENTREPRISE.short;
    if (c === "X") return "en examens à " + IUT.short;
    return long ? IUT.long : IUT.short;
  }

  /* ---------- semaines d'une année ---------- */
  function weeksOf(y) {
    var out = [], start = monday(parse(y.from)), end = parse(y.to);
    for (var m = start; m <= end; m = add(m, 7)) {
      var days = [], n = { E: 0, C: 0, X: 0, F: 0 };
      for (var k = 0; k < 5; k++) { var d = add(m, k), s = status(d); days.push({ d: d, s: s }); if (s && n[s] !== undefined) n[s]++; }
      var cls = n.E + n.C + n.X === 0 ? "off" : (n.E >= n.C + n.X ? "e" : "c");
      out.push({ mon: m, days: days, cls: cls, exam: n.X > 0 });
    }
    return out;
  }
  function yearOf(d) {
    var s = iso(d);
    for (var i = 0; i < YEARS.length; i++) if (s >= iso(monday(parse(YEARS[i].from))) && s <= iso(add(monday(parse(YEARS[i].to)), 6))) return YEARS[i];
    return s < YEARS[0].from ? YEARS[0] : YEARS[YEARS.length - 1];
  }
  function count(y, upTo) {
    var r = { E: 0, C: 0, X: 0, doneE: 0, doneC: 0 };
    for (var d = parse(y.from), e = parse(y.to); d <= e; d = add(d, 1)) {
      var s = status(d); if (r[s] === undefined) continue;
      r[s]++; if (d < upTo) { if (s === "E") r.doneE++; if (s === "C" || s === "X") r.doneC++; }
    }
    return r;
  }

  /* ---------- phrase d'état ---------- */
  function now() {
    var t = today(), s = status(t), first = parse(RUNS[0][0]), last = parse(RUNS[RUNS.length - 1][1]);
    if (t < first) {
      var ts = iso(t), wd = t.getDay();
      if (ts >= STAGE.from && ts <= STAGE.to && wd > 0 && wd < 6)
        return { code: "E", where: "En ce moment, je suis <em>en stage à " + ENTREPRISE.long + "</em>.", next: "Alternance à partir du " + fmtLong(first) + " " + first.getFullYear() + ".", short: "en stage" };
      return { code: null, where: "Alternance à " + ENTREPRISE.long + " à partir du <em>" + fmtLong(first) + " " + first.getFullYear() + "</em>.", short: "bientôt" };
    }
    if (t > last) return { code: null, where: "Alternance à " + ENTREPRISE.long + " terminée le " + fmtLong(last) + " " + last.getFullYear() + ".", short: "terminé" };
    var res = { date: t, code: s };
    if (s === "E" || s === "C" || s === "X") {
      var nx = nextChange(t, s);
      res.where = s === "E" ? "En ce moment, je suis <em>à " + ENTREPRISE.long + "</em>."
        : s === "X" ? "En ce moment, je suis <em>en examens</em> à " + IUT.short + "."
        : "En ce moment, je suis <em>en formation</em> à " + IUT.short + ".";
      res.next = nx ? (nx.code === "E" ? "Retour à " + ENTREPRISE.short : nx.code === "X" ? "Examens" : "Retour à " + IUT.short)
        + " le " + fmtLong(nx.date) + (nx.block && nx.block.weeks > 1 ? " · " + nx.block.weeks + " semaines" : "") + "."
        : "Fin de l'alternance le " + fmtLong(last) + " " + last.getFullYear() + ".";
      res.short = s === "E" ? "à " + ENTREPRISE.short : s === "X" ? "en examens" : "à " + IUT.short;
    } else {
      var w = nextWorkday(t);
      res.code = w ? w.code : null;
      res.where = (s === "F" ? "Jour férié" : "Week-end") + (w ? " — " + fmtLong(w.date) + ", je serai " + (w.code === "E" ? "<em>à " + ENTREPRISE.long + "</em>." : w.code === "X" ? "<em>en examens</em>." : "<em>en formation</em> à " + IUT.short + ".") : ".");
      res.next = "";
      res.short = s === "F" ? "férié" : "week-end";
    }
    return res;
  }

  /* ---------- rendu ---------- */
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function renderPills(st) {
    document.querySelectorAll("[data-now-pill]").forEach(function (p) {
      p.innerHTML = "";
      var dot = el("span", "dot" + (st.code === "E" ? " e" : st.code === "X" ? " x" : ""));
      p.appendChild(dot);
      p.appendChild(document.createTextNode(st.short));
      p.title = "Calculé à partir du calendrier d'alternance IUT";
    });
  }

  function renderStatus(st) {
    document.querySelectorAll("[data-now]").forEach(function (box) {
      box.innerHTML = "";
      var a = el("span", "where"); a.innerHTML = st.where || st.html; box.appendChild(a);
      if (st.next) box.appendChild(el("span", "next", st.next));
    });
    document.querySelectorAll("[data-today]").forEach(function (e) { e.textContent = fmtLong(today()) + " " + today().getFullYear(); });
  }

  function renderCal(root) {
    var t = today(), focus = root.getAttribute("data-focus"); // "e" = page entreprise
    var cur = yearOf(t), year = cur;
    var tabs = el("div", "tabs"), months = el("div", "months"), weeks = el("div", "weeks"), log = el("dl", "log");
    var legend = el("div", "legend"), prog = el("div", "progress");
    legend.innerHTML = '<span><i class="e"></i>' + cap(ENTREPRISE.long) + '</span><span><i></i>' + cap(IUT.long) +
      '</span><span><i class="x"></i>Examens</span><span class="mono">▢ semaine en cours</span>';
    YEARS.forEach(function (y) {
      var b = el("button", null, y.label); b.type = "button";
      b.addEventListener("click", function () { year = y; draw(); });
      y._btn = b; tabs.appendChild(b);
    });
    if (YEARS.length < 2) tabs.hidden = true;
    root.append(tabs, months, weeks, legend, log, prog);

    function draw() {
      YEARS.forEach(function (y) { y._btn.setAttribute("aria-pressed", y === year ? "true" : "false"); });
      var ws = weeksOf(year), cols = "repeat(" + ws.length + ",minmax(0,1fr))", nowMon = iso(monday(t)), sel = null;
      weeks.style.gridTemplateColumns = months.style.gridTemplateColumns = cols;
      weeks.innerHTML = months.innerHTML = "";
      var lastM = -1;
      ws.forEach(function (w, i) {
        var m = add(w.mon, 3).getMonth(), lab = el("span");
        if (m !== lastM) { lab.textContent = MONTHS_S[m]; lastM = m; }
        months.appendChild(lab);
        var b = el("button", "wk " + w.cls + (w.exam ? " x" : ""));
        b.type = "button";
        b.setAttribute("aria-label", "Semaine du " + fmt(w.mon) + " : " + (w.cls === "e" ? ENTREPRISE.long : w.cls === "c" ? IUT.long : "hors calendrier"));
        if (iso(w.mon) === nowMon) { b.classList.add("now"); sel = i; }
        else if (w.mon < monday(t)) b.classList.add("past");
        b.addEventListener("click", function () { pick(i); });
        w._b = b; weeks.appendChild(b);
      });
      function pick(i) {
        ws.forEach(function (w) { w._b.classList.remove("sel"); }); ws[i]._b.classList.add("sel");
        showWeek(ws[i]);
      }
      if (sel === null) sel = t < parse(year.from) ? 0 : ws.length - 1;
      pick(sel);
      showProgress();
    }

    function showWeek(w) {
      log.innerHTML = "";
      var fri = add(w.mon, 4), b = null;
      function line(k, v) { log.appendChild(el("dt", null, k)); var dd = el("dd"); dd.innerHTML = v; log.appendChild(dd); }
      line("Semaine", fmt(w.mon) + " → " + fmt(fri) + " " + fri.getFullYear() + (iso(w.mon) === iso(monday(t)) ? ' <span class="mono muted">· cette semaine</span>' : ""));
      var codes = {}; w.days.forEach(function (x) { if (x.s) codes[x.s] = 1; });
      var mixed = Object.keys(codes).filter(function (c) { return c !== "F"; }).length > 1 || codes.F;
      if (w.cls === "off") { line("Lieu", "Hors calendrier d'alternance"); return; }
      if (!mixed) line("Lieu", cap(place(w.days[0].s, true)));
      else line("Jours", w.days.map(function (x) {
        var lab = x.s === "F" ? "férié" : x.s === "W" || !x.s ? "—" : x.s === "E" ? ENTREPRISE.short : x.s === "X" ? "examens" : IUT.short;
        return '<span class="mono">' + DAYS[x.d.getDay()].slice(0, 3) + ". " + x.d.getDate() + "</span> " + lab;
      }).join(" &nbsp;·&nbsp; "));
      for (var k = 0; k < 5 && !b; k++) b = block(w.days[k].d);
      if (b) line("Période", (b.code === "E" ? "Entreprise" : b.code === "X" ? "Examens" : "Formation") + " du " + fmt(b.from) + " au " + fmt(b.to) +
        ' <span class="mono muted">· ' + b.weeks + " sem.</span>");
    }

    function showProgress() {
      var c = count(year, t), tot = c.E + c.C + c.X, done = c.doneE + c.doneC;
      var pct = Math.max(0, Math.min(100, Math.round(done / tot * 100)));
      prog.innerHTML = "";
      [[pct + " %", "de l'alternance écoulée"],
       [c.doneE + " / " + c.E, "jours à " + ENTREPRISE.short + (focus === "e" ? " effectués" : "")],
       [c.doneC + " / " + (c.C + c.X), "jours à " + IUT.short + " (dont " + c.X + " d'examens)"]]
        .forEach(function (p, i) {
          if (focus === "e" && i === 2) return;
          var d = el("div"); d.appendChild(el("b", null, p[0])); d.appendChild(el("small", null, p[1])); prog.appendChild(d);
        });
      if (focus === "e") {
        var r = el("div"), left = c.E - c.doneE;
        r.appendChild(el("b", null, String(left))); r.appendChild(el("small", null, "jours en entreprise restants cette année"));
        prog.appendChild(r);
      }
    }
    draw();
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // utilisé par d'autres vues du calendrier (ex. calendrier mural)
  window.Rythme = { status: status, block: block, today: today, parse: parse, iso: iso, add: add, monday: monday,
    count: count, place: place, cap: cap, fmt: fmt, fmtLong: fmtLong, CONTRACT: CONTRACT, ENTREPRISE: ENTREPRISE, IUT: IUT,
    MONTHS_L: MONTHS_L, MONTHS_S: MONTHS_S, DAYS: DAYS, year: YEARS[0] };

  function init() {
    var st = now();
    renderPills(st); renderStatus(st);
    document.querySelectorAll("[data-rythme]").forEach(renderCal);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
