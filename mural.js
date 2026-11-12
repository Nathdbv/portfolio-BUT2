/* Calendrier mural — vue mois par mois du rythme d'alternance.
   S'appuie sur window.Rythme (rythme.js). Les jours sont affichés,
   mais on sélectionne une semaine entière. */
(function () {
  "use strict";
  var R = window.Rythme; if (!R) return;
  var DOW = ["L", "M", "M", "J", "V"];
  var LABEL = { E: "AMDM", C: "IUT", X: "examen", F: "férié" };
  var CIRCLE = '<svg class="pen" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<path d="M80 20C62 5 20 7 10 40C3 70 33 95 62 91C91 86 99 52 86 27C80 16 68 9 50 8"/></svg>';

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var n = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - n + 3);
    var y = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    return 1 + Math.round(((t - y) / 864e5 - 3 + ((y.getUTCDay() + 6) % 7)) / 7);
  }
  function code(d) {
    var s = R.iso(d);
    if (s < R.CONTRACT.from || s > R.CONTRACT.to) return "O";
    var c = R.status(d); return c === "W" || !c ? "O" : c;
  }
  // semaines (lundis) qui touchent un mois donné
  function mondaysOf(y, m) {
    var out = [], first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    for (var mon = R.monday(first); mon <= last; mon = R.add(mon, 7)) {
      // on garde la semaine si un jour ouvré tombe dans le mois
      for (var k = 0; k < 5; k++) if (R.add(mon, k).getMonth() === m) { out.push(mon); break; }
    }
    return out;
  }

  function render(root) {
    var t = R.today(), from = R.parse(R.CONTRACT.from), to = R.parse(R.CONTRACT.to);
    var clamp = t < from ? from : t > to ? to : t;
    var state = { y: clamp.getFullYear(), m: clamp.getMonth(), sel: R.iso(R.monday(clamp)) };
    if (state.sel < R.iso(R.monday(from))) state.sel = R.iso(R.monday(from));

    var main = el("div", "mu-main"), big = el("div", "mu-big"), side = el("div", "mu-side");
    var log = el("dl", "log"), year = el("div", "mu-year");
    side.appendChild(log); main.append(big, side);
    root.append(main, el("p", "mu-cap mono muted", "L'année entière · cliquez une semaine"), year);

    function dayCell(d, inMonth, small) {
      var c = code(d), b = el("span", "mu-d c-" + c.toLowerCase());
      if (!inMonth) b.classList.add("out");
      if (d < t && c !== "O") b.classList.add("past");
      if (!small) {
        b.appendChild(el("b", null, String(d.getDate())));
        if (LABEL[c]) b.appendChild(el("small", null, LABEL[c]));
      }
      if (R.iso(d) === R.iso(t)) { b.classList.add("today"); b.insertAdjacentHTML("beforeend", CIRCLE); }
      return b;
    }
    // année du mois m pour une semaine qui le touche
    function yOf(mon, m) { for (var k = 0; k < 5; k++) { var d = R.add(mon, k); if (d.getMonth() === m) return d.getFullYear(); } return mon.getFullYear(); }
    function weekRow(mon, m, small) {
      var row = el("button", "mu-w"); row.type = "button";
      row.dataset.mon = R.iso(mon);
      if (!small) row.appendChild(el("span", "mu-n mono", "S" + isoWeek(mon)));
      for (var k = 0; k < 5; k++) { var d = R.add(mon, k); row.appendChild(dayCell(d, d.getMonth() === m, small)); }
      var fri = R.add(mon, 4);
      row.setAttribute("aria-label", "Semaine du " + R.fmt(mon) + " au " + R.fmt(fri));
      if (R.iso(mon) === state.sel) row.classList.add("sel");
      row.addEventListener("click", function () { state.sel = R.iso(mon); state.y = yOf(mon, m); state.m = m; draw(); });
      return row;
    }

    function drawBig() {
      big.innerHTML = "";
      var head = el("div", "mu-head"), prev = el("button", "mu-arr", "←"), next = el("button", "mu-arr", "→");
      prev.type = next.type = "button"; prev.setAttribute("aria-label", "Mois précédent"); next.setAttribute("aria-label", "Mois suivant");
      var first = new Date(state.y, state.m, 1);
      prev.disabled = first <= new Date(from.getFullYear(), from.getMonth(), 1);
      next.disabled = first >= new Date(to.getFullYear(), to.getMonth(), 1);
      prev.onclick = function () { move(-1); }; next.onclick = function () { move(1); };
      var title = el("h3", "mu-title"); title.innerHTML = R.cap(R.MONTHS_L[state.m]) + ' <span class="mono muted">' + state.y + "</span>";
      head.append(title, el("span", "mu-sp"), prev, next);
      big.appendChild(head);
      var dow = el("div", "mu-w mu-dow"); dow.appendChild(el("span", "mu-n"));
      DOW.forEach(function (x) { dow.appendChild(el("span", "mono muted", x)); });
      big.appendChild(dow);
      mondaysOf(state.y, state.m).forEach(function (mon) { big.appendChild(weekRow(mon, state.m, false)); });
    }
    function move(n) {
      var d = new Date(state.y, state.m + n, 1); state.y = d.getFullYear(); state.m = d.getMonth();
      var ms = mondaysOf(state.y, state.m), keep = ms.some(function (x) { return R.iso(x) === state.sel; });
      if (!keep) { var cur = ms.filter(function (x) { return R.iso(x) === R.iso(R.monday(t)); })[0]; state.sel = R.iso(cur || ms[0]); }
      draw();
    }

    function drawYear() {
      year.innerHTML = "";
      for (var d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
        var y = d.getFullYear(), m = d.getMonth(), box = el("div", "mu-mini");
        if (y === state.y && m === state.m) box.classList.add("on");
        if (y === t.getFullYear() && m === t.getMonth()) box.classList.add("cur");
        var lab = el("span", "mono", R.MONTHS_S[m] + (m === 0 || year.children.length === 0 ? " " + y : ""));
        box.appendChild(lab);
        mondaysOf(y, m).forEach(function (mon) { box.appendChild(weekRow(mon, m, true)); });
        year.appendChild(box);
      }
    }

    function drawLog() {
      log.innerHTML = "";
      var mon = R.parse(state.sel), fri = R.add(mon, 4), days = [];
      for (var k = 0; k < 5; k++) days.push({ d: R.add(mon, k), c: code(R.add(mon, k)) });
      function line(k, v) { log.appendChild(el("dt", null, k)); var dd = el("dd"); dd.innerHTML = v; log.appendChild(dd); }
      var thisWeek = R.iso(mon) === R.iso(R.monday(t));
      line("Semaine", "S" + isoWeek(mon) + " · " + R.fmt(mon) + " → " + R.fmt(fri) + (thisWeek ? ' <span class="mono muted">· cette semaine</span>' : ""));
      var kinds = {}; days.forEach(function (x) { if (x.c !== "O") kinds[x.c] = 1; });
      var ks = Object.keys(kinds);
      if (!ks.length) { line("Lieu", "Hors contrat d'alternance"); return; }
      if (ks.length === 1 && ks[0] !== "F") line("Lieu", R.cap(R.place(ks[0], true)));
      else line("Jours", days.map(function (x) {
        return '<span class="mono">' + R.DAYS[x.d.getDay()].slice(0, 3) + ". " + x.d.getDate() + "</span> " + (LABEL[x.c] || "—");
      }).join("<br>"));
      var b = null; for (k = 0; k < 5 && !b; k++) b = R.block(days[k].d);
      if (b) line("Période", (b.code === "E" ? "Entreprise" : b.code === "X" ? "Examens" : "Formation") + " du " + R.fmt(b.from) + " au " + R.fmt(b.to) +
        ' <span class="mono muted">· ' + b.weeks + " sem.</span>");
    }

    function draw() {
      drawBig(); drawYear(); drawLog();
      root.querySelectorAll(".mu-w[data-mon]").forEach(function (r) { r.classList.toggle("sel", r.dataset.mon === state.sel); });
    }
    draw();

    // progression
    var c = R.count(R.year, t), tot = c.E + c.C + c.X, done = c.doneE + c.doneC;
    var pct = Math.max(0, Math.min(100, Math.round(done / tot * 100)));
    var prog = el("div", "progress mu-prog");
    [[pct + " %", "de l'alternance écoulée"], [c.doneE + " / " + c.E, "jours à l'AMDM"], [c.doneC + " / " + (c.C + c.X), "jours à l'IUT"]]
      .forEach(function (p) { var d = el("div"); d.append(el("b", null, p[0]), el("small", null, p[1])); prog.appendChild(d); });
    side.appendChild(prog);
  }

  function init() { document.querySelectorAll("[data-mural]").forEach(render); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
