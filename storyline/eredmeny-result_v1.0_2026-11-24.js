// eredmeny-result v1.0 – 2026-11-24
// Teszteredmény dia: Execute JavaScript trigger, "When timeline starts on this slide".
// A százalékos eredményt (és a névszöveget) elküldi az n8n-nek.
(function () {
  var player = GetPlayer();
  var WEBHOOK = "https://castor81.app.n8n.cloud/webhook/eredmeny-rogzites";

  // Az eredmény dia változójának neve: "<eredmény dia neve>.ScorePercent".
  // Ha a dia neve más, írd át az első elemet; a második egy saját számváltozó (tartalék).
  var PCT_VARS = ["Results.ScorePercent", "szazalek"];

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
  var pct = readPct();
  if (!szoveg || pct === null) { return; }

  var rid = String(player.GetVar("rekordId") || "");
  if (!rid) {
    rid = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : "r-" + Date.now() + "-" + Math.random().toString(16).slice(2, 10);
    player.SetVar("rekordId", rid);
  }

  function send(attempt) {
    fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "result", rid: rid, szoveg: szoveg, szazalek: pct }),
      keepalive: true
    }).then(function (r) {
      if (!r.ok && attempt < 3) { setTimeout(function () { send(attempt + 1); }, 1500); }
    }).catch(function () {
      if (attempt < 3) { setTimeout(function () { send(attempt + 1); }, 1500); }
    });
  }
  send(1);
})();
