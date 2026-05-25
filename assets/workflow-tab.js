(function(){
'use strict';

const ATELIERS = [
  {k:'A', nom:'Tapisserie',   chef:'Ayoub',      taux:67, color:'#3b82f6'},
  {k:'B', nom:'Chaise',       chef:'Ahmed',      taux:67, color:'#f97316'},
  {k:'C', nom:'CNC-Laser',    chef:'Bahri',      taux:28, color:'#8b5cf6'},
  {k:'D', nom:'Resine',       chef:'Ettaib',     taux:71, color:'#06b6d4'},
  {k:'E', nom:'Menuiserie',   chef:'Chnitifa',   taux:70, color:'#92400e'},
  {k:'F', nom:'Peinture',     chef:'Elkarmani',  taux:55, color:'#ef4444'},
  {k:'G', nom:'Ferronnerie',  chef:'Boualili',   taux:63, color:'#6b7280'},
  {k:'H', nom:'Pierre-Marbre',chef:'Mustapha',   taux:72, color:'#d97706'},
  {k:'I', nom:'Cuivre-Laiton',chef:'Noureddine', taux:73, color:'#b45309'},
];

function detectOrderId(){
  // 1) Try URL hash/path patterns like #/commande/CMD-... or /order/123
  const h = (location.hash||'') + ' ' + (location.pathname||'');
  let m = h.match(/CMD[-_]?\d{4}[-_]?\d+/i) || h.match(/orders?\/([\w-]+)/i);
  if(m) return m[0].replace(/^orders?\//i,'').toUpperCase();
  // 2) Try to find a CMD ref in the page DOM
  const txt = document.body.innerText || '';
  m = txt.match(/CMD[-_]?\d{4}[-_]?\d+/i);
  if(m) return m[0].toUpperCase();
  return null;
}

function loadState(orderId){
  try { return JSON.parse(localStorage.getItem('cj-wf-'+orderId)) || {}; }
  catch(e){ return {}; }
}
function saveState(orderId, st){
  try { localStorage.setItem('cj-wf-'+orderId, JSON.stringify(st)); } catch(e){}
}
function fmtChrono(ms){
  if(!ms || ms<0) ms=0;
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = s%60;
  if(h>0) return h+'h '+String(m).padStart(2,'0')+'m';
  return m+'m '+String(sec).padStart(2,'0')+'s';
}
function totalElapsed(at, now){
  let t = at.elapsed||0;
  if(at.status==='run' && at.startedAt) t += (now - at.startedAt);
  return t;
}

function ensureCss(){
  if(document.getElementById('cj-wf-css')) return;
  const l = document.createElement('link');
  l.id = 'cj-wf-css';
  l.rel = 'stylesheet';
  l.href = '/assets/workflow-tab.css';
  document.head.appendChild(l);
}

// Find the tab strip that contains "Fiche technique" and "Commande marchandise" buttons
function findTabStrip(){
  const all = Array.from(document.querySelectorAll('button, a, [role="tab"], div, span'));
  let fiche=null, marchandise=null;
  for(const el of all){
    const t = (el.innerText||'').trim();
    if(!t) continue;
    if(!fiche && /^Fiche technique$/i.test(t)) fiche = el;
    if(!marchandise && /^Commande marchandise$/i.test(t)) marchandise = el;
    if(fiche && marchandise) break;
  }
  if(!fiche || !marchandise) return null;
  // Find common ancestor
  const anc = new Set();
  let x = fiche;
  while(x){ anc.add(x); x = x.parentElement; }
  let y = marchandise;
  while(y){ if(anc.has(y)) return {parent:y, fiche, marchandise}; y = y.parentElement; }
  return null;
}

let injected = false;
let workflowPanel = null;
let tabBtn = null;
let active = false;
let originalDisplays = new Map();

function buildWorkflowPanel(orderId){
  const st = loadState(orderId);
  if(!st.steps){
    st.steps = {
      fiche:    {status:'pending'},
      matiere:  {status:'pending'},
      atelier:  {status:'pending', selected: []}
    };
    st.ateliers = {};
    ATELIERS.forEach(a=>{
      st.ateliers[a.k] = {status:'idle', elapsed:0, startedAt:null, ouvrier:''};
    });
    saveState(orderId, st);
  }

  const div = document.createElement('div');
  div.className = 'cj-wf-panel';
  div.id = 'cj-wf-panel';
  div.style.display = 'none';
  render(div, orderId, st);
  return div;
}

function render(root, orderId, st){
  const now = Date.now();
  const sel = (st.steps.atelier.selected||[]);
  const selSet = new Set(sel);
  const atelierRunning = sel.find(k => st.ateliers[k]?.status==='run');
  const atelierDone    = sel.length && sel.every(k => st.ateliers[k]?.status==='done');
  const atelierStarted = sel.some(k => st.ateliers[k]?.status!=='idle');

  // Auto-deduce step status from data
  let s1 = st.steps.fiche.status==='done' ? 'done' : (st.steps.fiche.status==='current' ? 'current' : 'pending');
  let s2 = st.steps.matiere.status;
  let s3 = atelierDone ? 'done' : (atelierStarted ? 'current' : st.steps.atelier.status);

  let totalElapsedAll = 0, totalCost = 0;
  sel.forEach(k=>{
    const a = ATELIERS.find(x=>x.k===k);
    const e = totalElapsed(st.ateliers[k], now);
    totalElapsedAll += e;
    totalCost += (e/3600000) * a.taux;
  });

  root.innerHTML = `
    <h3>Workflow — commande ${orderId}</h3>

    <!-- Etape 1 : Fiche technique -->
    <div class="cj-wf-step ${s1}">
      <div class="cj-wf-step-head">
        <div class="cj-wf-step-num">1</div>
        <div class="cj-wf-step-title">Fiche technique</div>
        <span class="cj-wf-status ${s1}">${s1==='done'?'Validée':s1==='current'?'En cours':'À faire'}</span>
      </div>
      <div class="cj-wf-step-body">
        Renseignée par <b>les commerciaux</b> (Kenza / Ikram / Laila).<br>
        Détails produit, dimensions, couleurs, finitions, photos, croquis.
        <div class="cj-wf-actions">
          ${s1!=='done' ? '<button class="cj-wf-btn success" data-act="valider-fiche">✓ Valider fiche technique</button>' : '<button class="cj-wf-btn ghost" data-act="rouvrir-fiche">Rouvrir</button>'}
        </div>
      </div>
    </div>

    <!-- Etape 2 : Matiere premiere -->
    <div class="cj-wf-step ${s1==='done' ? s2 : 'pending'}">
      <div class="cj-wf-step-head">
        <div class="cj-wf-step-num">2</div>
        <div class="cj-wf-step-title">Matière première</div>
        <span class="cj-wf-status ${s1==='done' ? s2 : 'pending'}">${s2==='done'?'Validée':s2==='current'?'En attente':'À faire'}</span>
      </div>
      <div class="cj-wf-step-body">
        Vérifiée par <b>Moumen (magasin)</b>.<br>
        Soit dispo en magasin, soit commande marchandise (BDC) à passer dans l'onglet "Commande marchandise".
        <div class="cj-wf-actions">
          ${s1==='done' ? `
            ${s2!=='done' ? '<button class="cj-wf-btn success" data-act="matiere-ok">✓ Matières dispo / reçues</button>' : ''}
            ${s2==='pending' ? '<button class="cj-wf-btn warn" data-act="matiere-attente">⏳ Mettre en attente (BDC en cours)</button>' : ''}
            ${s2==='done' ? '<button class="cj-wf-btn ghost" data-act="matiere-reouvrir">Rouvrir</button>' : ''}
          ` : '<span style="color:#94A3B8;font-style:italic;">Valider la fiche technique d&rsquo;abord</span>'}
        </div>
      </div>
    </div>

    <!-- Etape 3 : Affectation atelier + ouvriers -->
    <div class="cj-wf-step ${s2==='done' ? s3 : 'pending'}">
      <div class="cj-wf-step-head">
        <div class="cj-wf-step-num">3</div>
        <div class="cj-wf-step-title">Ateliers & ouvriers</div>
        <span class="cj-wf-status ${s2==='done' ? s3 : 'pending'}">${s3==='done'?'Terminée':s3==='current'?'En fabrication':'À faire'}</span>
      </div>
      <div class="cj-wf-step-body">
        Affectés par <b>Hanane (production)</b>.<br>
        Sélectionner les ateliers qui vont travailler sur ce produit. Le chrono démarre quand l'ouvrier commence.
        ${s2!=='done' ? '<div style="color:#94A3B8;font-style:italic;margin-top:8px;">Valider les matières d&rsquo;abord</div>' : `
          <div class="cj-at-grid" id="cj-at-grid">
            ${ATELIERS.map(a=>{
              const onSel = selSet.has(a.k);
              const at = st.ateliers[a.k]||{};
              const e = totalElapsed(at, now);
              let chrono = fmtChrono(e);
              let chronoCls = at.status==='run' ? 'run' : at.status==='pause' ? 'pz' : '';
              let controls = '';
              if(onSel){
                if(at.status==='idle') controls = `<button class="cj-wf-btn primary" data-act="at-start" data-k="${a.k}">▶ Démarrer</button>`;
                else if(at.status==='run') controls = `<button class="cj-wf-btn warn" data-act="at-pause" data-k="${a.k}">⏸ Pause</button><button class="cj-wf-btn success" data-act="at-done" data-k="${a.k}">✓ Fini</button>`;
                else if(at.status==='pause') controls = `<button class="cj-wf-btn primary" data-act="at-resume" data-k="${a.k}">▶ Reprendre</button><button class="cj-wf-btn success" data-act="at-done" data-k="${a.k}">✓ Fini</button>`;
                else if(at.status==='done') controls = `<button class="cj-wf-btn ghost" data-act="at-reset" data-k="${a.k}">↺ Recommencer</button>`;
              }
              return `
                <div class="cj-at ${onSel?'on':''}">
                  <div class="cj-at-head">
                    <div class="cj-at-letter" style="background:${a.color}">${a.k}</div>
                    <div>
                      <div class="cj-at-name">${a.nom}</div>
                      <div class="cj-at-chef">${a.chef} · ${a.taux} DH/h</div>
                    </div>
                  </div>
                  ${onSel ? `<div class="cj-at-chrono ${chronoCls}">${at.status==='done'?'✓ '+chrono:chrono}</div>${controls?`<div class="cj-at-controls">${controls}</div>`:''}` : `<button class="cj-wf-btn ghost" data-act="at-select" data-k="${a.k}" style="width:100%;margin-top:6px;">+ Sélectionner</button>`}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>

    <div class="cj-wf-summary">
      <div class="cj-wf-card">
        <div class="cj-wf-card-lbl">Temps total fabrication</div>
        <div class="cj-wf-card-val">${fmtChrono(totalElapsedAll)}</div>
        <div class="cj-wf-card-sub">${sel.length} atelier(s) sélectionné(s)</div>
      </div>
      <div class="cj-wf-card">
        <div class="cj-wf-card-lbl">Coût main d'œuvre</div>
        <div class="cj-wf-card-val">${Math.round(totalCost).toLocaleString('fr-FR')} DH</div>
        <div class="cj-wf-card-sub">Charges fixes 3 935 DH non incluses</div>
      </div>
    </div>
  `;

  // Wire actions
  root.querySelectorAll('[data-act]').forEach(btn=>{
    btn.addEventListener('click', ()=>handleAction(orderId, btn.dataset.act, btn.dataset.k));
  });
}

function handleAction(orderId, act, k){
  const st = loadState(orderId);
  const now = Date.now();
  switch(act){
    case 'valider-fiche': st.steps.fiche.status='done'; st.steps.matiere.status='current'; break;
    case 'rouvrir-fiche': st.steps.fiche.status='current'; break;
    case 'matiere-ok': st.steps.matiere.status='done'; st.steps.atelier.status='current'; break;
    case 'matiere-attente': st.steps.matiere.status='current'; break;
    case 'matiere-reouvrir': st.steps.matiere.status='current'; break;
    case 'at-select':
      if(!st.steps.atelier.selected.includes(k)) st.steps.atelier.selected.push(k);
      break;
    case 'at-start':
      st.ateliers[k].status='run';
      st.ateliers[k].startedAt = now;
      break;
    case 'at-pause':
      st.ateliers[k].elapsed = totalElapsed(st.ateliers[k], now);
      st.ateliers[k].status='pause';
      st.ateliers[k].startedAt = null;
      break;
    case 'at-resume':
      st.ateliers[k].status='run';
      st.ateliers[k].startedAt = now;
      break;
    case 'at-done':
      st.ateliers[k].elapsed = totalElapsed(st.ateliers[k], now);
      st.ateliers[k].status='done';
      st.ateliers[k].startedAt = null;
      break;
    case 'at-reset':
      st.ateliers[k] = {status:'idle', elapsed:0, startedAt:null, ouvrier:''};
      break;
  }
  saveState(orderId, st);
  render(workflowPanel, orderId, st);
}

function tickChronos(){
  if(!active || !workflowPanel) return;
  const orderId = workflowPanel.dataset.orderId;
  if(!orderId) return;
  const st = loadState(orderId);
  // Only re-render if at least one atelier is running
  const running = Object.values(st.ateliers||{}).some(a=>a.status==='run');
  if(running) render(workflowPanel, orderId, st);
}

function findOrderContentArea(strip){
  // The original tab content panel sits below the tab strip in the same parent
  let p = strip.parent.parentElement;
  if(!p) return null;
  return p;
}

function showWorkflow(strip){
  const orderId = detectOrderId() || 'UNKNOWN';
  if(!workflowPanel){
    workflowPanel = buildWorkflowPanel(orderId);
    const contentArea = findOrderContentArea(strip);
    (contentArea || document.body).appendChild(workflowPanel);
  }
  workflowPanel.dataset.orderId = orderId;
  // Hide siblings of the tab strip parent that aren't our panel
  const contentArea = findOrderContentArea(strip);
  if(contentArea){
    Array.from(contentArea.children).forEach(ch=>{
      if(ch === strip.parent) return;
      if(ch === workflowPanel) return;
      if(!originalDisplays.has(ch)) originalDisplays.set(ch, ch.style.display);
      ch.style.display = 'none';
    });
  }
  workflowPanel.style.display = '';
  // Re-render fresh
  render(workflowPanel, orderId, loadState(orderId));
  active = true;
  if(tabBtn){
    tabBtn.classList.remove('inactive');
    // Mark other tab buttons as not orange-active (visually)
    [strip.fiche, strip.marchandise].forEach(b=>{
      // Don't touch original styles too much
    });
  }
}

function hideWorkflow(strip){
  if(workflowPanel) workflowPanel.style.display = 'none';
  // Restore original siblings
  originalDisplays.forEach((disp, el)=>{ el.style.display = disp; });
  originalDisplays.clear();
  active = false;
  if(tabBtn) tabBtn.classList.add('inactive');
}

function injectTab(strip){
  if(injected) return;
  ensureCss();
  tabBtn = document.createElement('button');
  tabBtn.className = 'cj-wf-tab inactive';
  tabBtn.innerHTML = '⚙ Workflow atelier <span class="badge">NOUVEAU</span>';
  tabBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    e.stopPropagation();
    if(active) hideWorkflow(strip); else showWorkflow(strip);
  });
  // When user clicks the original tabs, hide our panel
  [strip.fiche, strip.marchandise].forEach(b=>{
    b.addEventListener('click', ()=>{ if(active) hideWorkflow(strip); }, true);
  });
  // Insert right after "Commande marchandise"
  strip.marchandise.parentElement.insertBefore(tabBtn, strip.marchandise.nextSibling);
  injected = true;
}

function tryInject(){
  if(injected) return;
  const strip = findTabStrip();
  if(strip) injectTab(strip);
}

function resetInjectionIfGone(){
  // If the tab strip disappeared (navigation), reset state
  if(injected && !document.body.contains(tabBtn)){
    injected = false;
    tabBtn = null;
    workflowPanel = null;
    active = false;
    originalDisplays.clear();
  }
}

// Boot
function boot(){
  ensureCss();
  const obs = new MutationObserver(()=>{
    resetInjectionIfGone();
    tryInject();
  });
  obs.observe(document.body, {childList:true, subtree:true});
  tryInject();
  setInterval(tickChronos, 1000);
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

console.log('[CREAJIT Workflow Tab] loaded');
})();
