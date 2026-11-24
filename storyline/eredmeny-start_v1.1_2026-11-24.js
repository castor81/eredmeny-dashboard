// eredmeny-start v1.1 – 2026-11-24
// "Oklevél - név/szervezet" dia, "Tovább" gomb: Execute JavaScript trigger (a "Jump to slide" trigger fölé).
// A név a teszt UTÁN kerül megadásra, ezért ez a script küldi el a nevet ÉS a már megszerzett százalékot.
(function () {
  var player = GetPlayer();
  var WEBHOOK = "https://castor81.app.n8n.cloud/webhook/eredmeny-rogzites";
  var PCT_VARS = ["szazalek", "Quiz2.ScorePercent", "Quiz1.ScorePercent"];

  function readPct() {
    for (var i = 0; i < PCT_VARS.length; i++) {
      try {
        var v = player.GetVar(PCT_VARS[i]);
        if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) { return Number(v); }
      } catch (e) {}
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

  post({ action: "start", rid: rid, szoveg: szoveg }, 2, 1, function () {
    var pct = readPct();
    if (pct !== null) {
      post({ action: "result", rid: rid, szoveg: szoveg, szazalek: pct }, 3, 1);
    }
  });
})();
