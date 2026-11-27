// eredmeny-start v1.2 – 2026-11-27
// "Oklevél - név/szervezet" dia, "Tovább" gomb: Execute JavaScript trigger (a "Jump to slide" trigger fölé).
// A név a teszt UTÁN kerül megadásra, ezért ez a script küldi el a nevet ÉS a már megszerzett százalékot.
// v1.2: a százalék több forrásból olvasható (szazalek, Quiz2/Quiz1.ScorePercent, vagy pontokból számolva),
//       és a "dbg" mező megmutatja az n8n naplójában, mit látott a script (hibakereséshez).
(function () {
  var player = GetPlayer();
  var WEBHOOK = "https://castor81.app.n8n.cloud/webhook/eredmeny-rogzites";
  var QUIZZES = ["Quiz2", "Quiz1"];
  var dbg = { v: "start-1.2" };

  function raw(name) {
    try { var v = player.GetVar(name); return v === undefined ? "undef" : v; } catch (e) { return "err"; }
  }
  function num(v) {
    if (v === undefined || v === null || v === "" || v === "undef" || v === "err") { return null; }
    var n = Number(v);
    return isNaN(n) ? null : n;
  }
  function readPct() {
    var names = ["szazalek"];
    QUIZZES.forEach(function (q) { names.push(q + ".ScorePercent"); });
    for (var i = 0; i < names.length; i++) {
      var r = raw(names[i]);
      dbg[names[i]] = r;
      var n = num(r);
      if (n !== null) { return n; }
    }
    for (var j = 0; j < QUIZZES.length; j++) {
      var q = QUIZZES[j];
      var sp = num(raw(q + ".ScorePoints")), pp = num(raw(q + ".PassPoints")), pc = num(raw(q + ".PassPercent"));
      dbg[q + ".pts"] = [sp, pp, pc];
      if (sp !== null && pp !== null && pc !== null && pp > 0) {
        return Math.round(sp * pc / pp * 10) / 10;
      }
    }
    return null;
  }

  var szoveg = String(player.GetVar("Name") || "").trim();
  if (!szoveg) { return; }

  var rid = String(player.GetVar("rekordId") || "");
  if (!rid) {
    rid = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : "r-" + Date.now() + "-" + Math.random().toString(16).slice(2, 10);
    player.SetVar("rekordId", rid);
  }
  var pct = readPct();
  dbg.pct = pct;

  function post(body, max, attempt, done) {
    function retryOrDone() {
      if (attempt < max) { setTimeout(function () { post(body, max, attempt + 1, done); }, 1200); }
      else if (done) { done(); }
    }
    fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    }).then(function (r) {
      if (!r.ok) { retryOrDone(); } else if (done) { done(); }
    }).catch(retryOrDone);
  }

  post({ action: "start", rid: rid, szoveg: szoveg, dbg: dbg }, 2, 1, function () {
    if (pct !== null && pct >= 0 && pct <= 100) {
      post({ action: "result", rid: rid, szoveg: szoveg, szazalek: pct, dbg: dbg }, 3, 1);
    }
  });
})();
