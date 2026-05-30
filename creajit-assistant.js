/* ============================================================
   CREAJIT IA — Assistant IA réutilisable (bouton flottant 🤖)
   Chaque page agent définit window.CJ_AGENT_PROMPT (son rôle) puis inclut
   ce script. L'IA = Claude (clé navigateur, partagée), CONNECTÉE au cerveau
   commun (CJ.contexteIA) → l'agent voit ce que font les autres.

   ⬆️ Version « vrai agent » : VOIX (micro darija + lecture à voix haute) +
   ACTIONS (outils Claude : commander matière, signaler, relancer…) selon le
   rôle de l'agent (window.CJ_AGENT_ROLE).
   ============================================================ */
(function () {
  var BASE = window.CJ_AGENT_PROMPT;
  if (!BASE) return;
  var ROLE = window.CJ_AGENT_ROLE || '';     // 'magasin' | 'reception' | 'logistique' | 'commercial' | 'compta' | ...
  var QUI = window.CJ_AGENT_NOM || 'Agent';

  var st = document.createElement('style');
  st.textContent = `
  #cjia{position:fixed;right:14px;bottom:14px;z-index:2147483600;font-family:'Hanken Grotesk',Arial,sans-serif}
  #cjiaBtn{background:#C4714F;color:#1a0f08;border:none;border-radius:24px;padding:12px 17px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.5)}
  #cjiaPan{display:none;position:fixed;right:14px;bottom:64px;width:360px;max-width:92vw;height:62vh;max-height:580px;background:#141a26;border:1px solid #2c3850;border-radius:16px;flex-direction:column;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.6)}
  #cjia.open #cjiaPan{display:flex}
  #cjiaPan .h{padding:12px 14px;border-bottom:1px solid #2c3850;display:flex;align-items:center;gap:8px;font-weight:700}
  #cjiaPan .h .k{margin-left:auto;background:#222c3d;border:1px solid #2c3850;color:#eef2f8;border-radius:8px;padding:5px 9px;font-size:12px;cursor:pointer}
  #cjiaMsgs{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
  #cjiaMsgs .b{padding:9px 12px;border-radius:12px;font-size:14px;max-width:85%;white-space:pre-wrap;line-height:1.4}
  #cjiaMsgs .me{align-self:flex-end;background:#C4714F;color:#1a0f08;font-weight:600}
  #cjiaMsgs .ai{align-self:flex-start;background:#1a2230;color:#eef2f8;border:1px solid #2c3850}
  #cjiaMsgs .tool{align-self:center;background:rgba(55,201,138,.14);color:#37c98a;border:1px solid rgba(55,201,138,.35);font-size:12px;font-weight:600}
  #cjiaMsgs .empty{color:#8d96a5;font-size:13px;text-align:center;margin:auto}
  #cjiaBar{display:flex;gap:7px;padding:10px;border-top:1px solid #2c3850}
  #cjiaInp{flex:1;background:#0f1622;border:1px solid #2c3850;color:#eef2f8;border-radius:10px;padding:10px;font-size:14px;font-family:inherit}
  #cjiaMic,#cjiaSend{border:none;border-radius:10px;padding:0 13px;font-weight:700;cursor:pointer;font-size:15px}
  #cjiaMic{background:#222c3d;color:#eef2f8}
  #cjiaMic.on{background:#E74C3C;color:#fff}
  #cjiaSend{background:#C4714F;color:#1a0f08}`;
  (document.head || document.documentElement).appendChild(st);

  var wrap = document.createElement('div');
  wrap.id = 'cjia';
  wrap.innerHTML =
    '<div id="cjiaPan"><div class="h">🤖 Assistant IA <button class="k" id="cjiaKey">🔑 clé</button></div>' +
    '<div id="cjiaMsgs"></div>' +
    '<div id="cjiaBar"><input id="cjiaInp" placeholder="Parle ou écris…"><button id="cjiaMic" title="Parler">🎤</button><button id="cjiaSend">➤</button></div></div>' +
    '<button id="cjiaBtn">🤖 Assistant IA</button>';
  function add() { document.body.appendChild(wrap); wire(); }
  if (document.body) add(); else window.addEventListener('DOMContentLoaded', add);

  // ===== Outils (actions réelles) selon le rôle =====
  function outilsPourRole() {
    var t = [];
    if (ROLE === 'magasin') {
      t.push({ name: 'traiter_bon', description: "Traiter un bon de matière en attente : retrait magasin ou achat fournisseur. Le chrono d'appro continue.", input_schema: { type: 'object', properties: { client: { type: 'string', description: 'client du bon (ou laisser vide pour le plus ancien en attente)' }, mode: { type: 'string', description: "'Retrait magasin' ou 'Achat fournisseur'" } }, required: ['mode'] } });
    }
    if (ROLE === 'reception') {
      t.push({ name: 'receptionner', description: 'Marquer la marchandise reçue : le bon passe au VERT chez Mohamed, Hanane et l\'ouvrier.', input_schema: { type: 'object', properties: { client: { type: 'string', description: 'client du bon à réceptionner' } }, required: [] } });
    }
    // tous les agents peuvent alerter le patron
    t.push({ name: 'alerter_patron', description: 'Remonter une alerte/question importante à Driss (le patron) dans le fil du cockpit.', input_schema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } });
    return t;
  }
  var TOOLS = outilsPourRole();

  function bonsEnAttente() { return (window.CJ ? window.CJ.bons() : []).filter(function (b) { return b.statut === 'envoye'; }); }
  function bonsCommandes() { return (window.CJ ? window.CJ.bons() : []).filter(function (b) { return b.statut === 'commande'; }); }
  function trouveBon(liste, client) {
    if (!liste.length) return null;
    if (client) { var f = liste.find(function (b) { return (b.client || '').toLowerCase().indexOf(String(client).toLowerCase()) >= 0; }); if (f) return f; }
    return liste[0];
  }
  function execOutil(name, args) {
    if (!window.CJ) return 'Hors ligne.';
    if (name === 'traiter_bon') {
      var b = trouveBon(bonsEnAttente(), args.client);
      if (!b) return "Aucun bon en attente à traiter.";
      var mode = /achat|fourni/i.test(args.mode || '') ? 'Achat fournisseur' : 'Retrait magasin';
      window.CJ.majBon(b.id, { statut: 'commande', mode: mode });
      window.CJ.evenement('info', QUI, QUI + ' : ' + mode + ' pour ' + (b.client || '') + ' (' + (b.ref || '') + ').', '→ Hassan (réception)');
      return mode + ' lancé pour ' + (b.client || '') + '. Chrono en cours.';
    }
    if (name === 'receptionner') {
      var b2 = trouveBon(bonsCommandes(), args.client);
      if (!b2) return "Aucune commande à réceptionner.";
      window.CJ.majBon(b2.id, { statut: 'recu', tRecu: Date.now() });
      window.CJ.evenement('success', QUI, QUI + ' a réceptionné la matière pour ' + (b2.client || '') + '. Bon au VERT.', '→ Mohamed + Hanane + ouvrier');
      return 'Reçu ✅ ' + (b2.client || '') + ' — tout le monde voit le vert.';
    }
    if (name === 'alerter_patron') {
      window.CJ.evenement('alert', QUI, '📣 ' + args.message, '→ Driss');
      return 'Alerte envoyée à Driss.';
    }
    return 'Outil inconnu.';
  }

  var conv = [];
  function cle() {
    var k = localStorage.getItem('creajit_cle_ia');
    if (!k) { k = prompt('Colle ta clé API Anthropic (sk-ant-…). Elle reste sur cet appareil.'); if (k) { k = k.trim(); localStorage.setItem('creajit_cle_ia', k); } }
    return k || '';
  }
  function bub(role, txt) {
    var m = document.getElementById('cjiaMsgs'); var e = m.querySelector('.empty'); if (e) e.remove();
    var d = document.createElement('div'); d.className = 'b ' + (role === 'user' ? 'me' : (role === 'tool' ? 'tool' : 'ai')); d.textContent = txt;
    m.appendChild(d); m.scrollTop = m.scrollHeight;
  }
  function empty() { document.getElementById('cjiaMsgs').innerHTML = '<div class="empty">Parle (🎤) ou écris — je vois tout l\'atelier en temps réel et je peux agir.</div>'; }

  function appel(k) {
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system: BASE + (window.CJ ? '\n\n' + window.CJ.contexteIA() : ''), tools: TOOLS, messages: conv })
    });
  }
  async function send() {
    var inp = document.getElementById('cjiaInp'); var txt = inp.value.trim(); if (!txt) return;
    inp.value = ''; bub('user', txt); conv.push({ role: 'user', content: txt });
    var k = cle(); if (!k) { bub('assistant', 'Pas de clé IA. Clique « 🔑 clé » pour la coller.'); return; }
    bub('assistant', '…');
    var msgs = document.getElementById('cjiaMsgs'); var pend = msgs.lastChild;
    try {
      var guard = 0;
      while (guard++ < 4) {
        var r = await appel(k); var data = await r.json();
        if (data && data.error) { pend.remove(); bub('assistant', '⚠️ ' + (data.error.message || 'Erreur IA') + ' (clé ?)'); break; }
        var blocks = data.content || [];
        var texte = blocks.filter(function (x) { return x.type === 'text'; }).map(function (x) { return x.text; }).join('\n').trim();
        var tools = blocks.filter(function (x) { return x.type === 'tool_use'; });
        conv.push({ role: 'assistant', content: blocks });
        if (pend && pend.parentNode) pend.remove();
        if (texte) { bub('assistant', texte); parle(texte); }
        if (!tools.length) break;
        var results = tools.map(function (tu) { var out = execOutil(tu.name, tu.input || {}); bub('tool', '✅ ' + out); return { type: 'tool_result', tool_use_id: tu.id, content: out }; });
        conv.push({ role: 'user', content: results });
        pend = null;
      }
    } catch (e) { if (pend && pend.parentNode) pend.remove(); bub('assistant', 'Impossible de joindre Claude (connexion ?).'); }
  }

  // ===== Voix : écouter (darija) + lire à voix haute =====
  var recog = null, micOn = false;
  function toggleMic() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { bub('assistant', '🎤 La voix marche sur Chrome (avec internet).'); return; }
    if (micOn && recog) { recog.stop(); return; }
    recog = new SR(); recog.lang = 'ar-MA'; recog.interimResults = false; recog.maxAlternatives = 1;
    var b = document.getElementById('cjiaMic');
    recog.onstart = function () { micOn = true; if (b) b.classList.add('on'); };
    recog.onresult = function (e) { var txt = e.results[0][0].transcript; var inp = document.getElementById('cjiaInp'); if (inp) inp.value = txt; send(); };
    recog.onerror = function () { };
    recog.onend = function () { micOn = false; if (b) b.classList.remove('on'); };
    try { recog.start(); } catch (e) { }
  }
  function parle(txt) {
    try { if (!('speechSynthesis' in window)) return; var u = new SpeechSynthesisUtterance(txt); u.lang = 'ar-MA'; u.rate = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { }
  }

  function wire() {
    empty();
    document.getElementById('cjiaBtn').onclick = function () { wrap.classList.toggle('open'); var i = document.getElementById('cjiaInp'); if (wrap.classList.contains('open') && i) i.focus(); };
    document.getElementById('cjiaSend').onclick = send;
    document.getElementById('cjiaMic').onclick = toggleMic;
    document.getElementById('cjiaInp').addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    document.getElementById('cjiaKey').onclick = function () { localStorage.removeItem('creajit_cle_ia'); cle(); };
  }
})();
