// eredmeny-start v1.0 – 2026-11-24
// Slide 1.1 "Tovább" gomb: Execute JavaScript trigger (a "Jump to slide" trigger elé vagy mellé).
// Elküldi a hallgató által beírt szöveget (név, rendfokozat, szervezet) az n8n-nek.
(function () {
  var player = GetPlayer();
  var WEBHOOK = "https://castor81.app.n8n.cloud/webhook/eredmeny-rogzites";

  var szoveg = String(player.GetVar("Name") || "").trim();
  if (!szoveg) { return; }

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
      body: JSON.stringify({ action: "start", rid: rid, szoveg: szoveg }),
      keepalive: true
    }).then(function (r) {
      if (!r.ok && attempt < 2) { setTimeout(function () { send(attempt + 1); }, 1000); }
    }).catch(function () {
      if (attempt < 2) { setTimeout(function () { send(attempt + 1); }, 1000); }
    });
  }
  send(1);
})();
