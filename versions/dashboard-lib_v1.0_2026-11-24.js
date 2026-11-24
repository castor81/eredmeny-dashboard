/* dashboard-lib v1.0 – 2026-11-24
 * Az eredmény-dashboard DOM-tól független logikája: statisztika, szűrés, rendezés,
 * dátum- és százalékformázás, valamint az XLSX/PDF export adatainak előállítása.
 * Böngészőben a window.DashLib alatt, Node-ban module.exports-ként érhető el (tesztelhető).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DashLib = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TZ = "Europe/Budapest";

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var parts = new Intl.DateTimeFormat("hu-HU", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(d);
    var m = {};
    parts.forEach(function (p) { m[p.type] = p.value; });
    return m.year + "-" + m.month + "-" + m.day + " " + m.hour + ":" + m.minute;
  }

  function fmtPct(v) {
    if (v === null || v === undefined || isNaN(v)) return "–";
    var r = Math.round(v * 10) / 10;
    return String(r).replace(".", ",") + "%";
  }

  function normalize(records) {
    return (records || []).map(function (r) {
      var sz = r.szazalek === null || r.szazalek === undefined || r.szazalek === "" ? null : Number(r.szazalek);
      if (sz !== null && isNaN(sz)) sz = null;
      return {
        nev: String(r.nev || ""),
        szazalek: sz,
        elkezdve: String(r.elkezdve || ""),
        befejezve: String(r.befejezve || ""),
        kesz: sz !== null
      };
    });
  }

  function stats(rows) {
    var done = rows.filter(function (r) { return r.kesz; });
    var vals = done.map(function (r) { return r.szazalek; });
    var sum = vals.reduce(function (a, b) { return a + b; }, 0);
    return {
      total: rows.length,
      done: done.length,
      open: rows.length - done.length,
      avg: vals.length ? sum / vals.length : null,
      max: vals.length ? Math.max.apply(null, vals) : null,
      min: vals.length ? Math.min.apply(null, vals) : null
    };
  }

  /* 10 sáv: 0–9,9 … 90–100 (a 100% az utolsó sávba kerül) */
  function histogram(rows) {
    var bins = [];
    for (var i = 0; i < 10; i++) bins.push({ from: i * 10, to: i === 9 ? 100 : i * 10 + 9.9, count: 0 });
    rows.forEach(function (r) {
      if (!r.kesz) return;
      var idx = Math.min(9, Math.floor(r.szazalek / 10));
      bins[idx].count++;
    });
    return bins;
  }

  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  /* filter: {q, status: "all"|"done"|"open"}, sort: {key, dir} */
  function view(rows, filter, sort) {
    var q = norm(filter && filter.q).trim();
    var st = (filter && filter.status) || "all";
    var out = rows.filter(function (r) {
      if (st === "done" && !r.kesz) return false;
      if (st === "open" && r.kesz) return false;
      if (q && norm(r.nev).indexOf(q) === -1) return false;
      return true;
    });
    var key = (sort && sort.key) || "idopont";
    var dir = sort && sort.dir === "asc" ? 1 : -1;
    out.sort(function (a, b) {
      var x, y;
      if (key === "nev") { x = norm(a.nev); y = norm(b.nev); return x < y ? -dir : x > y ? dir : 0; }
      if (key === "szazalek") {
        x = a.szazalek === null ? -1 : a.szazalek; y = b.szazalek === null ? -1 : b.szazalek;
        return (x - y) * dir;
      }
      if (key === "elkezdve") { x = a.elkezdve; y = b.elkezdve; return x < y ? -dir : x > y ? dir : 0; }
      x = a.befejezve || a.elkezdve; y = b.befejezve || b.elkezdve; /* idopont */
      return x < y ? -dir : x > y ? dir : 0;
    });
    return out;
  }

  function stateLabel(r) { return r.kesz ? "Befejezte" : "Folyamatban"; }

  /* XLSX: tömbök tömbje (aoa) két munkalaphoz */
  function xlsxSheets(meta, rows, st) {
    var head = ["Név, rendfokozat, szervezet (a hallgató megadása)", "Eredmény (%)", "Állapot", "Kezdés", "Befejezés"];
    var data = [head].concat(rows.map(function (r) {
      return [r.nev, r.szazalek === null ? "" : r.szazalek, stateLabel(r), fmtDate(r.elkezdve), fmtDate(r.befejezve)];
    }));
    var sum = [
      ["Eredményjelentés", meta.org],
      ["Készült", fmtDate(meta.generated)],
      ["Lista", meta.filterNote || "teljes lista"],
      [],
      ["Résztvevők (a listában)", st.total],
      ["Befejezők", st.done],
      ["Folyamatban", st.open],
      ["Átlageredmény (%)", st.avg === null ? "" : Math.round(st.avg * 10) / 10],
      ["Legjobb (%)", st.max === null ? "" : st.max],
      ["Legalacsonyabb (%)", st.min === null ? "" : st.min]
    ];
    return { results: data, summary: sum };
  }

  /* PDF: pdfmake dokumentumleíró (Roboto: a magyar ő, ű megjelenik) */
  function pdfDoc(meta, rows, st, version) {
    var body = [[
      { text: "#", style: "th", alignment: "right" },
      { text: "Név, rendfokozat, szervezet", style: "th" },
      { text: "Eredmény", style: "th", alignment: "right" },
      { text: "Állapot", style: "th" },
      { text: "Kezdés", style: "th" },
      { text: "Befejezés", style: "th" }
    ]];
    rows.forEach(function (r, i) {
      body.push([
        { text: String(i + 1), alignment: "right", color: "#7a857f" },
        r.nev,
        { text: fmtPct(r.szazalek), alignment: "right", bold: r.kesz },
        { text: stateLabel(r), color: r.kesz ? "#2e6b3a" : "#8a6d1a" },
        fmtDate(r.elkezdve),
        fmtDate(r.befejezve)
      ]);
    });
    if (!rows.length) body.push([{ text: "Nincs megjeleníthető sor.", colSpan: 6, color: "#7a857f" }, {}, {}, {}, {}, {}]);
    return {
      pageSize: "A4",
      pageOrientation: "landscape",
      pageMargins: [36, 40, 36, 44],
      info: { title: "Eredményjelentés – " + meta.org, author: "NKE HHK KTVK" },
      content: [
        { text: "Eredményjelentés", style: "h1" },
        { text: meta.org, style: "h2" },
        { text: "Készült: " + fmtDate(meta.generated) + "  |  Lista: " + (meta.filterNote || "teljes lista"), style: "meta", margin: [0, 2, 0, 12] },
        {
          columns: [
            { text: [{ text: String(st.total), style: "big" }, { text: "\nrésztvevő", style: "cap" }] },
            { text: [{ text: String(st.done), style: "big" }, { text: "\nbefejezte", style: "cap" }] },
            { text: [{ text: fmtPct(st.avg), style: "big" }, { text: "\nátlageredmény", style: "cap" }] },
            { text: [{ text: fmtPct(st.max), style: "big" }, { text: "\nlegjobb", style: "cap" }] },
            { text: [{ text: fmtPct(st.min), style: "big" }, { text: "\nlegalacsonyabb", style: "cap" }] }
          ],
          margin: [0, 0, 0, 14]
        },
        {
          table: { headerRows: 1, widths: [24, "*", 56, 70, 90, 90], body: body },
          layout: {
            hLineWidth: function (i, node) { return i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.3; },
            vLineWidth: function () { return 0; },
            hLineColor: function (i) { return i <= 1 ? "#1b2420" : "#c9d0cb"; },
            paddingTop: function () { return 4; },
            paddingBottom: function () { return 4; }
          }
        }
      ],
      footer: function (page, pages) {
        return {
          margin: [36, 10, 36, 0],
          columns: [
            { text: "NKE HHK KTVK – eredmény-dashboard v" + (version || ""), style: "meta" },
            { text: page + " / " + pages, alignment: "right", style: "meta" }
          ]
        };
      },
      styles: {
        h1: { fontSize: 20, bold: true, color: "#1b2420" },
        h2: { fontSize: 14, color: "#8a6d1a", bold: true },
        meta: { fontSize: 8.5, color: "#7a857f" },
        th: { bold: true, fontSize: 9, color: "#1b2420" },
        big: { fontSize: 18, bold: true, color: "#1b2420" },
        cap: { fontSize: 8.5, color: "#7a857f" }
      },
      defaultStyle: { font: "Roboto", fontSize: 9.5, color: "#26302b" }
    };
  }

  function safeName(s) {
    return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "szervezet";
  }

  return {
    fmtDate: fmtDate, fmtPct: fmtPct, normalize: normalize, stats: stats, histogram: histogram,
    view: view, stateLabel: stateLabel, xlsxSheets: xlsxSheets, pdfDoc: pdfDoc, safeName: safeName
  };
});
