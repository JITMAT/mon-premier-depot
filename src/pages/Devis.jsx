import React, { useState, useRef, useCallback } from 'react'
import { EMP, AT, atI } from '../data/employees'
import { CHARGES_FIXES_MENSUELLES, ART_PAR_MOIS as ART_PAR_MOIS_DEF, CHARGE_PAR_ARTICLE, MASSE_SAL_ATELIERS, NB_OUVRIERS_ATELIER } from '../data/constants'
import { WORKFLOWS, ATELIERS_MAP, detectWorkflow, initSteps } from '../data/workflows'

// ─── CONSTANTES CREAJIT (source partagée: data/constants.js) ─────────────────
const CHARGES_FIXES = CHARGES_FIXES_MENSUELLES   // DH/mois
const ART_PAR_MOIS  = ART_PAR_MOIS_DEF           // estimation articles produits/mois
const CHARGE_PAR_ART = CHARGE_PAR_ARTICLE        // ~3935 DH/article
const SAL_ATELIER_H  = MASSE_SAL_ATELIERS / (NB_OUVRIERS_ATELIER * 22 * 8)  // DH/h moyen

const dh = n => Math.round(n||0).toLocaleString('fr') + ' DH'
const pct = (a,b) => b > 0 ? Math.round(a/b*100) : 0

// ─── MATIÈRES FRÉQUENTES ────────────────────────────────────────────────────
const MAT_RAPIDES = [
  { n:'Tissu velours',  u:'m', p:180, at:'tapissier' },
  { n:'Tissu lin',      u:'m', p:120, at:'tapissier' },
  { n:'Tissu synthétique',u:'m',p:80, at:'tapissier' },
  { n:'Cuir véritable', u:'m', p:650, at:'tapissier' },
  { n:'Mousse HD 40kg', u:'m²',p:220, at:'tapissier' },
  { n:'Mousse souple 28kg',u:'m²',p:140,at:'tapissier'},
  { n:'Ouate 400g',     u:'m²',p:40,  at:'tapissier' },
  { n:'Bois hêtre',     u:'m', p:95,  at:'menuisier' },
  { n:'Bois chêne',     u:'m', p:140, at:'menuisier' },
  { n:'Contreplaqué 18',u:'m²',p:110, at:'menuisier' },
  { n:'Sangles élastiques',u:'m',p:25,at:'menuisier' },
  { n:'Tube métal',     u:'m', p:65,  at:'ferronier' },
  { n:'Travertin',      u:'m²',p:900, at:'pierre'    },
  { n:'Marbre blanc',   u:'m²',p:1400,at:'pierre'    },
  { n:'Céramique',      u:'m²',p:480, at:'pierre'    },
  { n:'Feuille cuivre', u:'m²',p:350, at:'cuivre'    },
  { n:'Résine époxy',   u:'kg', p:280, at:'resine'   },
  { n:'Pigments résine',u:'kg', p:180, at:'resine'   },
  { n:'Vernis protection',u:'L',p:120, at:'peinture'  },
  { n:'Peinture laque', u:'L', p:95,  at:'peinture'  },
]

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function Devis() {
  const [step, setStep] = useState(0) // 0=config, 1=couts, 2=prix, 3=ia

  // Config produit
  const [wfId, setWfId]         = useState('')
  const [nomArt, setNomArt]     = useState('')
  const [client, setClient]     = useState('')
  const [commerciale, setComm]  = useState('')
  const [fiche, setFiche]       = useState({ l:'',la:'',h:'', tissu:'', bois:'', finition:'' })

  // Main d'œuvre
  const [moLines, setMoLines]   = useState([]) // { at, eId, nom, estH, tx }
  const [moAt, setMoAt]         = useState('')
  const [moEId, setMoEId]       = useState('')
  const [moH, setMoH]           = useState(4)

  // Matières
  const [matLines, setMatLines] = useState([]) // { n, u, q, p }
  const [matNom, setMatNom]     = useState('')
  const [matU, setMatU]         = useState('m')
  const [matQ, setMatQ]         = useState(1)
  const [matP, setMatP]         = useState(0)

  // Charges
  const [chargeArt, setChargeArt] = useState(CHARGE_PAR_ART)
  const [artMois, setArtMois]     = useState(ART_PAR_MOIS)

  // Prix / marge
  const [margeCible, setMargeCible] = useState(35) // %
  const [prixManuel, setPrixManuel] = useState('')

  // IA
  const [iaImg, setIaImg]       = useState(null)
  const [iaResult, setIaResult] = useState('')
  const [iaLoading, setIaLoading] = useState(false)
  const fileRef = useRef()

  // ─── CALCULS ────────────────────────────────────────────────────────────────
  const coutMO  = moLines.reduce((s,l) => s + l.estH * l.tx, 0)
  const coutMat = matLines.reduce((s,l) => s + l.q * l.p, 0)
  const coutCharges = chargeArt
  const coutRevient = coutMO + coutMat + coutCharges

  const prixSuggere = margeCible > 0 ? coutRevient / (1 - margeCible/100) : coutRevient
  const prixFinal   = prixManuel ? +prixManuel : prixSuggere
  const margeVal    = prixFinal - coutRevient
  const margePct    = pct(margeVal, prixFinal)

  // ─── HANDLERS ────────────────────────────────────────────────────────────────
  function addMO() {
    const emp = EMP.find(e => e.id === moEId)
    if (!emp) return
    setMoLines([...moLines, { id: Date.now(), at: moAt, eId: moEId, nom: emp.n, estH: moH, tx: emp.tx }])
    setMoEId(''); setMoH(4)
  }

  function addMat(m) {
    if (m) {
      setMatLines([...matLines, { id:Date.now(), n:m.n, u:m.u, q:1, p:m.p }])
    } else {
      if (!matNom.trim() || !matP) return
      setMatLines([...matLines, { id:Date.now(), n:matNom.trim(), u:matU, q:matQ, p:matP }])
      setMatNom(''); setMatQ(1); setMatP(0)
    }
  }

  // ─── ANALYSE IA PHOTO ────────────────────────────────────────────────────────
  async function analyserPhoto() {
    if (!iaImg) return
    setIaLoading(true)
    setIaResult('')
    try {
      // Convert base64
      const base64 = iaImg.split(',')[1]
      const mimeType = iaImg.split(';')[0].split(':')[1]

      const wf = wfId ? WORKFLOWS[wfId] : null
      const prompt = `Tu es expert en fabrication de mobilier chez CREAJIT Marrakech.
Analyse cette photo de meuble/objet de décoration.

Contexte CREAJIT :
- Charges fixes : 157 430 DH/mois (réparties sur ~40 articles)
- Taux MO moyen atelier : 24-36 DH/heure selon ouvrier
- Famille produit sélectionnée : ${wf ? wf.nom : 'Non spécifiée'}
- Article : ${nomArt || 'Non spécifié'}
- Dimensions : L=${fiche.l||'?'}cm la=${fiche.la||'?'}cm H=${fiche.h||'?'}cm

Réponds en JSON UNIQUEMENT dans ce format exact :
{
  "produit": "nom détecté",
  "famille": "famille workflow",
  "dimensions_estimees": {"L": X, "l": Y, "H": Z},
  "materiaux": [{"nom": "...", "quantite": X, "unite": "m/m²/kg/pcs", "prix_unitaire_dh": X}],
  "main_oeuvre": [{"atelier": "...", "heures": X, "cout_dh": X}],
  "cout_mo_total": X,
  "cout_matieres_total": X,
  "quote_part_charges": 3935,
  "cout_revient_total": X,
  "prix_vente_suggere_35pct": X,
  "prix_vente_suggere_45pct": X,
  "commentaire": "analyse qualitative 2-3 phrases"
}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      })
      const d = await res.json()
      const text = d.content?.[0]?.text || ''
      try {
        const clean = text.replace(/```json|```/g,'').trim()
        const parsed = JSON.parse(clean)
        setIaResult(parsed)
        // Auto-fill si possible
        if (parsed.prix_vente_suggere_35pct) setPrixManuel(String(Math.round(parsed.prix_vente_suggere_35pct)))
        if (parsed.dimensions_estimees) {
          setFiche(f => ({...f, l: parsed.dimensions_estimees.L||f.l, la: parsed.dimensions_estimees.l||f.la, h: parsed.dimensions_estimees.H||f.h}))
        }
        if (parsed.main_oeuvre?.length) {
          const newLines = parsed.main_oeuvre.map((m,i) => ({
            id: Date.now()+i, at: m.atelier, eId:'ia', nom:'IA estimation', estH: m.heures, tx: Math.round(m.cout_dh/m.heures)||28
          }))
          setMoLines(prev => [...prev, ...newLines])
        }
        if (parsed.materiaux?.length) {
          const newMats = parsed.materiaux.map((m,i) => ({
            id: Date.now()+1000+i, n: m.nom, u: m.unite, q: m.quantite, p: m.prix_unitaire_dh
          }))
          setMatLines(prev => [...prev, ...newMats])
        }
      } catch { setIaResult({ commentaire: text, _raw: true }) }
    } catch(e) { setIaResult({ commentaire: 'Erreur connexion API', _raw: true }) }
    setIaLoading(false)
  }

  const TABS = [
    { id:0, l:'📋 Produit' },
    { id:1, l:'⚙️ Coûts' },
    { id:2, l:'💰 Prix' },
    { id:3, l:'🤖 Analyse IA' },
  ]

  return (
    <div>
      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700 }}>📝 Simulateur de devis</div>
          <div style={{ fontSize:10, color:'var(--mu)' }}>Coût de revient · Prix de vente · Analyse IA</div>
        </div>
        {coutRevient > 0 && (
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--gn)', fontFamily:'monospace' }}>{dh(prixFinal)}</div>
            <div style={{ fontSize:10, color:margePct >= 30 ? 'var(--gn)' : margePct >= 20 ? 'var(--yw)' : 'var(--rd)' }}>marge {margePct}%</div>
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:3, background:'var(--c2)', borderRadius:10, padding:3, marginBottom:14 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setStep(t.id)} style={{
            flex:1, padding:'7px 4px', borderRadius:8, border:'none',
            background: step===t.id ? 'var(--or)' : 'none',
            color: step===t.id ? '#fff' : 'var(--mu)',
            cursor:'pointer', fontSize:10, fontWeight:700, fontFamily:'inherit'
          }}>{t.l}</button>
        ))}
      </div>

      {/* ══════════════ TAB 0 — PRODUIT ══════════════ */}
      {step === 0 && (
        <div>
          {/* Infos client */}
          <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:8 }}>Informations</div>
            {[
              ['Nom article', nomArt, setNomArt, 'Canapé NUAGE 3 places velours vert...'],
              ['Nom client',  client, setClient, 'M. El Fassi...'],
              ['Commerciale', commerciale, setComm, 'Kenza / Ikram / Laila'],
            ].map(([l,v,s,p]) => (
              <div key={l} style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:'var(--mu)', marginBottom:3 }}>{l}</div>
                <input value={v} onChange={e => s(e.target.value)} placeholder={p}
                  style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:7, padding:'8px 10px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
              </div>
            ))}
          </div>

          {/* Famille produit */}
          <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:8 }}>Famille produit</div>
            <select value={wfId} onChange={e => setWfId(e.target.value)}
              style={{ width:'100%', background:'var(--c2)', border:'1.5px solid var(--or)', borderRadius:9, padding:'10px 12px', color:'var(--tx)', fontSize:13, outline:'none', fontFamily:'inherit', cursor:'pointer', marginBottom:10 }}>
              <option value="">— Sélectionner le type —</option>
              <optgroup label="🛋️ Salon">
                {[['canape','🛋️ Canapé / Banquette / Méridienne'],['fauteuil','💺 Fauteuil'],['chaise_bois','🪑 Chaise bois'],['chaise_metal','🔩 Chaise métal'],['transat','🏖️ Transat']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </optgroup>
              <optgroup label="🪨 Tables">
                {[['table_travertin','🪨 Table travertin / marbre'],['table_basse','☕ Table basse'],['table_ceram','🟫 Table céramique'],['table_bois','🪵 Table bois']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </optgroup>
              <optgroup label="🛏️ Chambre">
                <option value="lit">🛏️ Lit / Tête de lit</option>
              </optgroup>
              <optgroup label="🎨 Déco">
                {[['tableau_bois','🖼️ Tableau bois'],['tableau_metal','🪞 Tableau métal'],['cuivre','🟡 Cuivre'],['resine','🧪 Résine']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </optgroup>
            </select>
            {wfId && WORKFLOWS[wfId] && (
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {WORKFLOWS[wfId].steps.map((s,i) => (
                  <span key={i} style={{ fontSize:10, padding:'3px 8px', borderRadius:20, background:'rgba(196,113,79,.1)', border:'1px solid rgba(196,113,79,.25)', color:'var(--or)' }}>{s.icon} {ATELIERS_MAP[s.at]?.nom}</span>
                ))}
              </div>
            )}
          </div>

          {/* Fiche technique */}
          <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:8 }}>Fiche technique</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:8 }}>
              {[['l','L (cm)'],['la','la (cm)'],['h','H (cm)']].map(([k,l]) => (
                <div key={k}>
                  <div style={{ fontSize:9, color:'var(--mu)', marginBottom:2 }}>{l}</div>
                  <input type="number" value={fiche[k]} onChange={e => setFiche(f => ({...f,[k]:e.target.value}))} placeholder="0"
                    style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:6, padding:'7px 6px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'monospace', textAlign:'center' }}/>
                </div>
              ))}
            </div>
            {[['tissu','Tissu / Matière principale','Velours vert #A3C26F, Cuir noir...'],['bois','Couleur bois / métal','Noyer foncé, Doré, Noir mat...'],['finition','Finition','Mat, Brillant, Capitonné...']].map(([k,l,p]) => (
              <div key={k} style={{ marginBottom:6 }}>
                <div style={{ fontSize:10, color:'var(--mu)', marginBottom:2 }}>{l}</div>
                <input value={fiche[k]} onChange={e => setFiche(f => ({...f,[k]:e.target.value}))} placeholder={p}
                  style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:7, padding:'7px 10px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'inherit' }}/>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(1)} style={{ width:'100%', padding:12, borderRadius:10, border:'none', background:'var(--or)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700 }}>Suivant — Saisir les coûts →</button>
        </div>
      )}

      {/* ══════════════ TAB 1 — COÛTS ══════════════ */}
      {step === 1 && (
        <div>
          {/* Main d'œuvre */}
          <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700 }}>🧑‍🔧 Main d'œuvre</div>
              <div style={{ fontSize:11, fontFamily:'monospace', color:'var(--or)', fontWeight:700 }}>{dh(coutMO)}</div>
            </div>

            {/* Lignes MO existantes */}
            {moLines.map(l => (
              <div key={l.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 0', borderBottom:'.5px solid var(--bd)' }}>
                <span style={{ fontSize:11, flex:1 }}>{l.nom}</span>
                <span style={{ fontSize:10, color:'var(--mu)' }}>{l.estH}h × {l.tx}DH/h</span>
                <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--or)', fontWeight:700 }}>{dh(l.estH*l.tx)}</span>
                <button onClick={() => setMoLines(prev => prev.filter(x => x.id !== l.id))} style={{ background:'none', border:'none', color:'var(--rd)', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            ))}

            {/* Ajouter MO */}
            <div style={{ marginTop:10, background:'var(--c2)', borderRadius:9, padding:10 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:6 }}>Ajouter ouvrier</div>
              <div style={{ display:'flex', gap:4, marginBottom:6 }}>
                {Object.entries(ATELIERS_MAP).map(([k,at]) => (
                  <button key={k} onClick={() => { setMoAt(k); setMoEId('') }} style={{ flex:1, padding:'5px 3px', borderRadius:7, border:`1.5px solid ${moAt===k?at.color:'var(--bd)'}`, background:moAt===k?at.color+'22':'var(--c1)', color:moAt===k?at.color:'var(--mu)', cursor:'pointer', fontFamily:'inherit', fontSize:9, fontWeight:700 }}>
                    {at.icon}
                  </button>
                ))}
              </div>
              {moAt && (
                <select value={moEId} onChange={e => setMoEId(e.target.value)}
                  style={{ width:'100%', background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:7, padding:'8px', color:'var(--tx)', fontSize:11, outline:'none', fontFamily:'inherit', marginBottom:6 }}>
                  <option value="">— Sélectionner ouvrier —</option>
                  {EMP.filter(e => e.at === moAt).map(e => (
                    <option key={e.id} value={e.id}>{e.n} — {e.tx} DH/h</option>
                  ))}
                </select>
              )}
              <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                <span style={{ fontSize:10, color:'var(--mu)', whiteSpace:'nowrap' }}>Heures :</span>
                <div style={{ display:'flex', gap:3 }}>
                  {[1,2,4,6,8,12,16].map(h => (
                    <button key={h} onClick={() => setMoH(h)} style={{ padding:'5px 8px', borderRadius:6, border:`1.5px solid ${moH===h?'var(--or)':'var(--bd)'}`, background:moH===h?'rgba(196,113,79,.12)':'var(--c1)', color:moH===h?'var(--or)':'var(--tx)', cursor:'pointer', fontFamily:'monospace', fontSize:11, fontWeight:700 }}>{h}h</button>
                  ))}
                </div>
                <input type="number" value={moH} onChange={e => setMoH(+e.target.value)} style={{ width:44, background:'var(--c1)', border:'1.5px solid var(--or)', borderRadius:6, padding:'5px', color:'var(--or)', fontSize:11, outline:'none', fontFamily:'monospace', fontWeight:700, textAlign:'center' }}/>
                <button onClick={addMO} disabled={!moEId} style={{ padding:'7px 12px', borderRadius:7, border:'none', background:moEId?'var(--gn)':'var(--bd)', color:'#fff', cursor:moEId?'pointer':'not-allowed', fontFamily:'inherit', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>+ Ajouter</button>
              </div>
              {moEId && <div style={{ fontSize:10, color:'var(--gn)', marginTop:4 }}>
                → {moH}h × {EMP.find(e=>e.id===moEId)?.tx||0} DH/h = <b>{dh(moH*(EMP.find(e=>e.id===moEId)?.tx||0))}</b>
              </div>}
            </div>
          </div>

          {/* Matières premières */}
          <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700 }}>🧱 Matières premières</div>
              <div style={{ fontSize:11, fontFamily:'monospace', color:'var(--gn)', fontWeight:700 }}>{dh(coutMat)}</div>
            </div>

            {matLines.map(l => (
              <div key={l.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 0', borderBottom:'.5px solid var(--bd)' }}>
                <span style={{ fontSize:11, flex:1 }}>{l.n}</span>
                <span style={{ fontSize:10, color:'var(--mu)' }}>{l.q}{l.u} × {dh(l.p)}</span>
                <span style={{ fontFamily:'monospace', fontSize:11, color:'var(--gn)', fontWeight:700 }}>{dh(l.q*l.p)}</span>
                <button onClick={() => setMatLines(prev => prev.filter(x => x.id !== l.id))} style={{ background:'none', border:'none', color:'var(--rd)', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            ))}

            {/* Matières rapides */}
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:6 }}>Matières fréquentes</div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
                {MAT_RAPIDES.slice(0,12).map((m,i) => (
                  <button key={i} onClick={() => addMat(m)} style={{ padding:'3px 8px', borderRadius:20, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--mu)', cursor:'pointer', fontFamily:'inherit', fontSize:9, fontWeight:600 }}>
                    + {m.n} ({m.p}DH/{m.u})
                  </button>
                ))}
              </div>
            </div>

            {/* Ajouter matière manuelle */}
            <div style={{ background:'var(--c2)', borderRadius:9, padding:10 }}>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', marginBottom:6 }}>Saisie libre</div>
              <input value={matNom} onChange={e => setMatNom(e.target.value)} placeholder="Désignation matière..."
                style={{ width:'100%', background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:7, padding:'8px 10px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'inherit', marginBottom:6 }}/>
              <div style={{ display:'flex', gap:5 }}>
                <input type="number" value={matQ} onChange={e => setMatQ(+e.target.value)} placeholder="Qté"
                  style={{ width:60, background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:7, padding:'7px 6px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'monospace', textAlign:'center' }}/>
                <select value={matU} onChange={e => setMatU(e.target.value)}
                  style={{ width:60, background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:7, padding:'7px 4px', color:'var(--tx)', fontSize:11, outline:'none', fontFamily:'inherit' }}>
                  {['m','m²','kg','L','pcs','barre','rouleau'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="number" value={matP} onChange={e => setMatP(+e.target.value)} placeholder="Prix/unité DH"
                  style={{ flex:1, background:'var(--c1)', border:`1.5px solid ${matP>0?'var(--gn)':'var(--rd)'}`, borderRadius:7, padding:'7px 8px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'monospace' }}/>
                <button onClick={() => addMat(null)} disabled={!matNom.trim()||!matP} style={{ padding:'7px 12px', borderRadius:7, border:'none', background:matNom.trim()&&matP?'var(--gn)':'var(--bd)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700 }}>+</button>
              </div>
            </div>
          </div>

          {/* Charges fixes */}
          <div style={{ background:'rgba(241,196,15,.05)', border:'1px solid rgba(241,196,15,.25)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700 }}>🏭 Quote-part charges fixes</div>
              <div style={{ fontSize:11, fontFamily:'monospace', color:'var(--yw)', fontWeight:700 }}>{dh(chargeArt)}</div>
            </div>
            <div style={{ fontSize:10, color:'var(--mu)', marginBottom:8 }}>
              Total charges : {dh(CHARGES_FIXES)}/mois ÷ {artMois} articles = {dh(CHARGES_FIXES/artMois)}/article
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, color:'var(--mu)', whiteSpace:'nowrap' }}>Articles/mois :</span>
              <input type="number" value={artMois} onChange={e => { setArtMois(+e.target.value||1); setChargeArt(CHARGES_FIXES/(+e.target.value||1)) }}
                style={{ width:60, background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:7, padding:'6px', color:'var(--tx)', fontSize:12, outline:'none', fontFamily:'monospace', textAlign:'center' }}/>
              <span style={{ fontSize:10, color:'var(--mu)', whiteSpace:'nowrap' }}>→ {dh(CHARGES_FIXES/artMois)} par article</span>
            </div>
          </div>

          {/* Récap coût */}
          {coutRevient > 0 && (
            <div style={{ background:'rgba(196,113,79,.05)', border:'1px solid rgba(196,113,79,.25)', borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--or)', textTransform:'uppercase', marginBottom:8 }}>Récap coût de revient</div>
              {[['🧑‍🔧 Main d\'œuvre', coutMO, 'var(--or)'],['🧱 Matières', coutMat, 'var(--gn)'],['🏭 Charges fixes', coutCharges, 'var(--yw)']].map(([l,v,c]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'.5px solid var(--bd)' }}>
                  <span style={{ fontSize:11, color:'var(--mu)' }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:c, fontFamily:'monospace' }}>{dh(v)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, paddingTop:6 }}>
                <span style={{ fontSize:13, fontWeight:700 }}>💰 Coût de revient</span>
                <span style={{ fontSize:15, fontWeight:800, color:'var(--or)', fontFamily:'monospace' }}>{dh(coutRevient)}</span>
              </div>
            </div>
          )}

          <button onClick={() => setStep(2)} style={{ width:'100%', padding:12, borderRadius:10, border:'none', background:'var(--gn)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700 }}>Suivant — Simuler le prix →</button>
        </div>
      )}

      {/* ══════════════ TAB 2 — PRIX / SIMULATEUR ══════════════ */}
      {step === 2 && (
        <div>
          {/* Coût de revient recap */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {[['MO', coutMO,'var(--or)'],['Mat.', coutMat,'var(--gn)'],['Charg.', coutCharges,'var(--yw)'],['Total', coutRevient,'var(--tx)']].map(([l,v,c]) => (
              <div key={l} style={{ flex:1, background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:10, padding:'8px 6px', textAlign:'center' }}>
                <div style={{ fontSize:9, color:'var(--mu)' }}>{l}</div>
                <div style={{ fontSize:11, fontWeight:700, color:c, fontFamily:'monospace' }}>{dh(v)}</div>
              </div>
            ))}
          </div>

          {/* Simulateur marge */}
          <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>📊 Simulateur de marge</div>

            {/* Slider marge */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:10, color:'var(--mu)' }}>Marge cible</span>
                <span style={{ fontSize:14, fontWeight:700, color: margeCible >= 35 ? 'var(--gn)' : margeCible >= 25 ? 'var(--yw)' : 'var(--rd)', fontFamily:'monospace' }}>{margeCible}%</span>
              </div>
              <input type="range" min={5} max={70} step={1} value={margeCible}
                onChange={e => { setMargeCible(+e.target.value); setPrixManuel('') }}
                style={{ width:'100%', accentColor:'var(--gn)' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--mu)', marginTop:2 }}>
                <span>5% seuil</span><span style={{ color:'var(--yw)' }}>25% correct</span><span style={{ color:'var(--gn)' }}>35% bon</span><span>70% max</span>
              </div>
            </div>

            {/* Tableau marges rapides */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, marginBottom:12 }}>
              {[20,25,30,35,40,45,50,60].map(m => {
                const pv = coutRevient / (1 - m/100)
                const sel = Math.abs(m - margeCible) < 2
                return (
                  <div key={m} onClick={() => { setMargeCible(m); setPrixManuel('') }}
                    style={{ background:sel?'rgba(46,204,113,.1)':'var(--c2)', border:`1.5px solid ${sel?'var(--gn)':'var(--bd)'}`, borderRadius:8, padding:'8px 4px', textAlign:'center', cursor:'pointer' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:sel?'var(--gn)':'var(--mu)' }}>{m}%</div>
                    <div style={{ fontSize:11, fontFamily:'monospace', fontWeight:700, color:sel?'var(--gn)':'var(--tx)' }}>{dh(pv)}</div>
                  </div>
                )
              })}
            </div>

            {/* Prix manuel */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:'var(--mu)', marginBottom:4 }}>Prix de vente personnalisé (ou laisser vide pour calcul auto)</div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="number" value={prixManuel} onChange={e => setPrixManuel(e.target.value)} placeholder={String(Math.round(prixSuggere))}
                  style={{ flex:1, background:'var(--c2)', border:`1.5px solid ${prixManuel?'var(--or)':'var(--bd)'}`, borderRadius:8, padding:'10px 12px', color:'var(--tx)', fontSize:16, outline:'none', fontFamily:'monospace', fontWeight:700 }}/>
                <span style={{ fontSize:12, color:'var(--mu)' }}>DH</span>
                {prixManuel && <button onClick={() => setPrixManuel('')} style={{ padding:'8px 10px', borderRadius:7, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--mu)', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>Auto</button>}
              </div>
            </div>

            {/* Résultat final */}
            <div style={{ background: margePct >= 30 ? 'rgba(46,204,113,.08)' : margePct >= 20 ? 'rgba(241,196,15,.08)' : 'rgba(231,76,60,.08)', border:`1.5px solid ${margePct>=30?'rgba(46,204,113,.3)':margePct>=20?'rgba(241,196,15,.3)':'rgba(231,76,60,.3)'}`, borderRadius:10, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:'var(--mu)' }}>Prix de vente</div>
                  <div style={{ fontSize:28, fontWeight:900, fontFamily:'monospace', color: margePct>=30?'var(--gn)':margePct>=20?'var(--yw)':'var(--rd)' }}>{dh(prixFinal)}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:24, fontWeight:900, color:margePct>=30?'var(--gn)':margePct>=20?'var(--yw)':'var(--rd)', fontFamily:'monospace' }}>{margePct}%</div>
                  <div style={{ fontSize:10, color:'var(--mu)' }}>marge nette</div>
                </div>
              </div>
              {[
                ['Coût de revient', coutRevient],
                ['Marge brute', margeVal],
              ].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0' }}>
                  <span style={{ fontSize:11, color:'var(--mu)' }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:700, fontFamily:'monospace' }}>{dh(v)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons CTA */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <button onClick={() => window.print()} style={{ padding:11, borderRadius:9, border:'1px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700 }}>🖨️ Imprimer</button>
            <button onClick={() => {
              const txt = `DEVIS CREAJIT\n${nomArt}\nClient: ${client}\nCommerciale: ${commerciale}\n\nCoût MO: ${dh(coutMO)}\nCoût matières: ${dh(coutMat)}\nCharges fixes: ${dh(coutCharges)}\nCoût revient: ${dh(coutRevient)}\n\nPrix de vente: ${dh(prixFinal)}\nMarge: ${margePct}%`
              navigator.clipboard?.writeText(txt)
            }} style={{ padding:11, borderRadius:9, border:'none', background:'var(--or)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700 }}>📋 Copier résumé</button>
          </div>
        </div>
      )}

      {/* ══════════════ TAB 3 — ANALYSE IA ══════════════ */}
      {step === 3 && (
        <div>
          <div style={{ background:'rgba(52,152,219,.05)', border:'1px solid rgba(52,152,219,.25)', borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--bl)', marginBottom:4 }}>🤖 Analyse photo par Claude IA</div>
            <div style={{ fontSize:11, color:'var(--mu)', lineHeight:1.6 }}>
              Envoie une photo du meuble ou objet à fabriquer. Claude analyse les matériaux, dimensions estimées, ateliers nécessaires et donne un coût de revient automatique basé sur la base CREAJIT.
            </div>
          </div>

          {/* Upload photo */}
          <div onClick={() => fileRef.current?.click()}
            style={{ background:'var(--c1)', border:`2px dashed ${iaImg?'rgba(46,204,113,.4)':'var(--bd)'}`, borderRadius:12, padding:20, textAlign:'center', marginBottom:12, cursor:'pointer' }}>
            {iaImg ? (
              <div>
                <img src={iaImg} alt="" style={{ maxWidth:'100%', maxHeight:200, borderRadius:8, objectFit:'contain', marginBottom:8 }}/>
                <div style={{ fontSize:11, color:'var(--gn)', fontWeight:700 }}>Photo chargée ✅</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:32, marginBottom:8 }}>📸</div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>Glisser une photo ici</div>
                <div style={{ fontSize:10, color:'var(--mu)' }}>ou cliquer pour sélectionner · JPG, PNG, WEBP</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
              const file = e.target.files[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => setIaImg(ev.target.result)
              reader.readAsDataURL(file)
            }}/>
          </div>

          {iaImg && (
            <button onClick={analyserPhoto} disabled={iaLoading}
              style={{ width:'100%', padding:13, borderRadius:10, border:'none', background:iaLoading?'var(--bd)':'var(--bl)', color:'#fff', cursor:iaLoading?'not-allowed':'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, marginBottom:12 }}>
              {iaLoading ? '⟳ Analyse en cours...' : '🤖 Analyser avec Claude IA'}
            </button>
          )}

          {/* Résultat IA */}
          {iaResult && !iaResult._raw && (
            <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--bl)', marginBottom:10 }}>Résultat IA — {iaResult.produit}</div>

              {iaResult.commentaire && (
                <div style={{ fontSize:11, color:'var(--mu)', background:'rgba(52,152,219,.06)', border:'1px solid rgba(52,152,219,.2)', borderRadius:8, padding:'8px 10px', marginBottom:10, lineHeight:1.6 }}>
                  {iaResult.commentaire}
                </div>
              )}

              {/* Coûts IA */}
              {[
                ['🧑‍🔧 Main d\'œuvre', iaResult.cout_mo_total, 'var(--or)'],
                ['🧱 Matières', iaResult.cout_matieres_total, 'var(--gn)'],
                ['🏭 Charges fixes', iaResult.quote_part_charges, 'var(--yw)'],
                ['💰 Coût de revient', iaResult.cout_revient_total, 'var(--or)'],
                ['🎯 Prix suggéré 35%', iaResult.prix_vente_suggere_35pct, 'var(--gn)'],
                ['🎯 Prix suggéré 45%', iaResult.prix_vente_suggere_45pct, '#27AE60'],
              ].filter(([,v]) => v).map(([l,v,c]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'.5px solid var(--bd)' }}>
                  <span style={{ fontSize:11, color:'var(--mu)' }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:c, fontFamily:'monospace' }}>{dh(v)}</span>
                </div>
              ))}

              <button onClick={() => {
                if (iaResult.cout_revient_total) setStep(2)
              }} style={{ width:'100%', marginTop:10, padding:10, borderRadius:8, border:'none', background:'var(--gn)', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700 }}>
                ↗ Utiliser ces données dans le simulateur
              </button>
            </div>
          )}

          {iaResult?._raw && (
            <div style={{ background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--mu)', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{iaResult.commentaire}</div>
            </div>
          )}

          {/* Context actuel fourni à l'IA */}
          <div style={{ background:'var(--c2)', borderRadius:10, padding:12, fontSize:10, color:'var(--mu)', lineHeight:1.7 }}>
            <div style={{ fontWeight:700, marginBottom:4 }}>Contexte fourni à Claude IA :</div>
            <div>Charges fixes : {dh(CHARGES_FIXES)}/mois · {artMois} articles → {dh(CHARGES_FIXES/artMois)}/article</div>
            <div>{NB_OUVRIERS_ATELIER} ouvriers ateliers · taux moyen {SAL_ATELIER_H.toFixed(0)} DH/h</div>
            {wfId && WORKFLOWS[wfId] && <div>Famille : {WORKFLOWS[wfId].nom}</div>}
            {nomArt && <div>Article : {nomArt}</div>}
            {(fiche.l||fiche.la||fiche.h) && <div>Dimensions : L={fiche.l||'?'} la={fiche.la||'?'} H={fiche.h||'?'} cm</div>}
          </div>
        </div>
      )}
    </div>
  )
}
