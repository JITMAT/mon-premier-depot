/* ============================================================
   CREAJIT IA — Assistant IA réutilisable (bouton flottant 🤖)
   Chaque page agent définit window.CJ_AGENT_PROMPT (son rôle) puis inclut
   ce script. L'IA = Claude (clé navigateur, partagée), CONNECTÉE au cerveau
   commun (CJ.contexteIA) → l'agent voit ce que font les autres.
   ============================================================ */
(function () {
  var BASE = window.CJ_AGENT_PROMPT;
  if (!BASE) return;

  var st = document.createElement('style');
  st.textContent = `
  #cjia{position:fixed;right:14px;bottom:14px;z-index:2147483600;font-family:'Hanken Grotesk',Arial,sans-serif}
  #cjiaBtn{background:#C4714F;color:#1a0f08;border:none;border-radius:24px;padding:12px 17px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.5)}
  #cjiaPan{display:none;position:fixed;right:14px;bottom:64px;width:360px;max-width:92vw;height:60vh;max-height:560px;background:#141a26;border:1px solid #2c3850;border-radius:16px;flex-direction:column;overflow:hidden;box-shadow:0 18px 60px rgba(0,0,0,.6)}
  #cjia.open #cjiaPan{display:flex}
  #cjiaPan .h{padding:12px 14px;border-bottom:1px solid #2c3850;display:flex;align-items:center;gap:8px;font-weight:700}
  #cjiaPan .h .k{margin-left:auto;background:#222c3d;border:1px solid #2c3850;color:#eef2f8;border-radius:8px;padding:5px 9px;font-size:12px;cursor:pointer}
  #cjiaMsgs{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
  #cjiaMsgs .b{padding:9px 12px;border-radius:12px;font-size:14px;max-width:85%;white-space:pre-wrap;line-height:1.4}
  #cjiaMsgs .me{align-self:flex-end;background:#C4714F;color:#1a0f08;font-weight:600}
  #cjiaMsgs .ai{align-self:flex-start;background:#1a2230;color:#eef2f8;border:1px solid #2c3850}
  #cjiaMsgs .empty{color:#8d96a5;font-size:13px;text-align:center;margin:auto}
  #cjiaBar{display:flex;gap:7px;padding:10px;border-top:1px solid #2c3850}
  #cjiaInp{flex:1;background:#0f1622;border:1px solid #2c3850;color:#eef2f8;border-radius:10px;padding:10px;font-size:14px;font-family:inherit}
  #cjiaSend{background:#C4714F;color:#1a0f08;border:none;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}`;
  (document.head || document.documentElement).appendChild(st);

  var wrap = document.createElement('div');
  wrap.id = 'cjia';
  wrap.innerHTML =
    '<div id="cjiaPan"><div class="h">🤖 Assistant IA <button class="k" id="cjiaKey">🔑 clé</button></div>' +
    '<div id="cjiaMsgs"></div>' +
    '<div id="cjiaBar"><input id="cjiaInp" placeholder="Pose ta question…"><button id="cjiaSend">➤</button></div></div>' +
    '<button id="cjiaBtn">🤖 Assistant IA</button>';
  function add() { document.body.appendChild(wrap); wire(); }
  if (document.body) add(); else window.addEventListener('DOMContentLoaded', add);

  var conv = [];
  function cle() {
    var k = localStorage.getItem('creajit_cle_ia');
    if (!k) { k = prompt('Colle ta clé API Anthropic (sk-ant-…). Elle reste sur cet appareil.'); if (k) { k = k.trim(); localStorage.setItem('creajit_cle_ia', k); } }
    return k || '';
  }
  function bub(role, txt) {
    var m = document.getElementById('cjiaMsgs'); var e = m.querySelector('.empty'); if (e) e.remove();
    var d = document.createElement('div'); d.className = 'b ' + (role === 'user' ? 'me' : 'ai'); d.textContent = txt;
    m.appendChild(d); m.scrollTop = m.scrollHeight;
  }
  function empty() { document.getElementById('cjiaMsgs').innerHTML = '<div class="empty">Pose ta question — je vois tout l\'atelier en temps réel.</div>'; }

  async function send() {
    var inp = document.getElementById('cjiaInp'); var txt = inp.value.trim(); if (!txt) return;
    inp.value = ''; bub('user', txt); conv.push({ role: 'user', content: txt });
    var k = cle(); if (!k) { bub('assistant', 'Pas de clé IA. Clique « 🔑 clé » pour la coller.'); return; }
    var sys = BASE + (window.CJ ? '\n\n' + window.CJ.contexteIA() : '');
    bub('assistant', '…');
    var msgs = document.getElementById('cjiaMsgs'); var pend = msgs.lastChild;
    try {
      var r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system: sys, messages: conv })
      });
      var data = await r.json(); pend.remove();
      if (data && data.error) { bub('assistant', '⚠️ ' + (data.error.message || 'Erreur IA') + ' (clé ?)'); }
      else { var t = (data.content || []).filter(function (x) { return x.type === 'text'; }).map(function (x) { return x.text; }).join('\n').trim() || '(vide)'; bub('assistant', t); conv.push({ role: 'assistant', content: t }); }
    } catch (e) { pend.remove(); bub('assistant', 'Impossible de joindre Claude (connexion ?).'); }
  }
  function wire() {
    empty();
    document.getElementById('cjiaBtn').onclick = function () { wrap.classList.toggle('open'); var i = document.getElementById('cjiaInp'); if (wrap.classList.contains('open') && i) i.focus(); };
    document.getElementById('cjiaSend').onclick = send;
    document.getElementById('cjiaInp').addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    document.getElementById('cjiaKey').onclick = function () { localStorage.removeItem('creajit_cle_ia'); cle(); };
  }
})();
