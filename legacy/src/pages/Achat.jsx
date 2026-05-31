import React, { useState, useMemo } from 'react'
import { MATIERES } from '../data/matieres'

const dh = n => Math.round(n||0).toLocaleString('fr') + ' DH'
const GROUPES = ['Tous','Mousses','Tissus','Bois','Métaux','Peintures','Quincaillerie','Pierre/Marbre','Électricité','Divers']
const GICON = {Mousses:'🧽',Tissus:'🧵',Bois:'🪵',Métaux:'🔩',Peintures:'🎨',Quincaillerie:'🔧','Pierre/Marbre':'🪨',Électricité:'⚡',Divers:'📦',Tous:'📦'}
const GCOL  = {Mousses:'#8B5CF6',Tissus:'#EC4899',Bois:'#D97706',Métaux:'#6366F1',Peintures:'#F59E0B',Quincaillerie:'#10B981','Pierre/Marbre':'#64748B',Électricité:'#3B82F6',Divers:'#94A3B8',Tous:'#C4714F'}

const INIT_STOCK = () => {
  const s = {}
  MATIERES.forEach((m,i) => { s[m.ref] = (i*7+13)%30 })
  return s
}

const HIST = (() => {
  const h = []
  const mois = ['Avr 26','Mai 26']
  MATIERES.slice(0,80).forEach((m,i) => {
    const qte = Math.floor((i%5+1)*3)
    h.push({ ref:m.ref, nom:m.nom, groupe:m.groupe, fournisseur:m.fournisseur, prix:m.prix, qte, montant:m.prix*qte, mois:mois[i%2] })
  })
  return h
})()

function Tag({ c, children }) {
  return <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, background:c+'18', color:c }}>{children}</span>
}

export default function Achat() {
  const [view,     setView]     = useState('dash')
  const [stock,    setStock]    = useState(INIT_STOCK)
  const [photos,   setPhotos]   = useState({})
  const [search,   setSearch]   = useState('')
  const [groupe,   setGroupe]   = useState('Tous')
  const [fournSel, setFournSel] = useState('Tous')
  const [selRef,   setSelRef]   = useState(null)
  const [editQte,  setEditQte]  = useState({})
  const [demandes, setDemandes] = useState([])
  const [bdcs,     setBdcs]     = useState([])
  const [receptions,setReceptions]=useState([])
  const [newDem,   setNewDem]   = useState(null)

  const fournisseurs = useMemo(() => ['Tous', ...new Set(MATIERES.map(m => m.fournisseur))], [])

  const matieresFiltrees = useMemo(() => MATIERES.filter(m => {
    const gOk = groupe === 'Tous' || m.groupe === groupe
    const fOk = fournSel === 'Tous' || m.fournisseur === fournSel
    const sOk = !search || m.nom.toLowerCase().includes(search.toLowerCase()) || m.ref.toLowerCase().includes(search.toLowerCase()) || m.fournisseur.toLowerCase().includes(search.toLowerCase())
    return gOk && fOk && sOk
  }), [groupe, fournSel, search])

  const enRupture = MATIERES.filter(m => (stock[m.ref]||0) === 0).length
  const enAlerte  = MATIERES.filter(m => { const s=stock[m.ref]||0; return s>0&&s<=m.seuil }).length
  const valeurStock = MATIERES.reduce((a,m) => a+(stock[m.ref]||0)*m.prix, 0)
  const enAttente = demandes.filter(d => d.status==='attente').length
  const matSelec = selRef ? MATIERES.find(m => m.ref===selRef) : null

  function saveQte(ref) {
    const nv = parseInt(editQte[ref])
    if (!isNaN(nv)&&nv>=0) setStock(s=>({...s,[ref]:nv}))
    setEditQte(e=>{const n={...e};delete n[ref];return n})
  }
  function uploadPhoto(ref,e) {
    const file=e.target.files[0]; if(!file) return
    const reader=new FileReader()
    reader.onload=ev=>setPhotos(p=>({...p,[ref]:ev.target.result}))
    reader.readAsDataURL(file); e.target.value=''
  }
  function envoyerDemande() {
    if(!newDem) return
    setDemandes(p=>[{id:Date.now().toString(),...newDem,status:'attente',date:new Date().toLocaleDateString('fr')},...p])
    setNewDem(null)
  }

  /* ─── DASHBOARD ─────────────────────────────────────────────────── */
  function renderDash() {
    const topAchat=[...HIST].sort((a,b)=>b.montant-a.montant).slice(0,5)
    const parGroupe=GROUPES.slice(1).map(g=>({
      g, count:MATIERES.filter(m=>m.groupe===g).length,
      ruptures:MATIERES.filter(m=>m.groupe===g&&(stock[m.ref]||0)===0).length,
    }))
    return (<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {[{l:'Références totales',v:MATIERES.length,c:'#C4714F'},{l:'Ruptures totales',v:enRupture,c:'#EF4444'},{l:'Stock critique',v:enAlerte,c:'#D97706'},{l:'Valeur du stock',v:dh(valeurStock),c:'#22C55E'}].map((k,i)=>(
          <div key={i} className="kpi-card" style={{borderTopColor:k.c}}>
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-value" style={{color:k.c,fontSize:i===3?16:22}}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <div className="card">
          <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>🔴 Alertes stock</div>
          {MATIERES.filter(m=>(stock[m.ref]||0)===0).slice(0,6).map(m=>(
            <div key={m.ref} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid #334155',fontSize:10}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'#EF4444',flexShrink:0,display:'block'}}/>
              <div style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.nom}</div>
              <span style={{fontSize:9,color:'#EF4444',fontWeight:700,flexShrink:0}}>Rupture</span>
              <button onClick={()=>{setSelRef(m.ref);setView('stock')}} style={{padding:'2px 7px',borderRadius:4,border:'none',background:'#C4714F',color:'#fff',cursor:'pointer',fontSize:8,fontWeight:700,fontFamily:'inherit',flexShrink:0}}>Voir</button>
            </div>
          ))}
          {enRupture>6&&<div style={{fontSize:10,color:'#64748B',marginTop:6,textAlign:'center'}}>+{enRupture-6} autres → <button onClick={()=>setView('stock')} style={{color:'#C4714F',background:'none',border:'none',cursor:'pointer',fontSize:10,fontFamily:'inherit'}}>Voir tout</button></div>}
        </div>
        <div className="card">
          <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>📦 Stock par famille</div>
          {parGroupe.filter(g=>g.count>0).map(g=>(
            <div key={g.g} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:'1px solid #334155',fontSize:10}}>
              <span style={{fontSize:14}}>{GICON[g.g]}</span>
              <span style={{flex:1}}>{g.g}</span>
              <span style={{color:'#64748B'}}>{g.count} réf.</span>
              {g.ruptures>0&&<Tag c="#EF4444">🔴 {g.ruptures} ruptures</Tag>}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>📊 Top achats 2 derniers mois</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6}}>
          {topAchat.map((h,i)=>(
            <div key={i} style={{background:'#0F172A',borderRadius:8,padding:'10px',textAlign:'center',border:'1px solid #334155'}}>
              <div style={{fontSize:18,fontWeight:800,color:'#C4714F',marginBottom:4}}>#{i+1}</div>
              <div style={{fontSize:10,fontWeight:600,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',lineHeight:1.3}}>{h.nom}</div>
              <div style={{fontSize:9,color:'#64748B',marginBottom:4}}>{h.fournisseur}</div>
              <div style={{fontSize:11,fontWeight:700,color:'#22C55E'}}>{dh(h.montant)}</div>
              <div style={{fontSize:9,color:'#64748B'}}>Qte: {h.qte}</div>
            </div>
          ))}
        </div>
      </div>
    </div>)
  }

  /* ─── STOCK ──────────────────────────────────────────────────────── */
  function renderStock() {
    return (<div>
      {selRef&&matSelec&&(
        <div className="card" style={{border:'1px solid rgba(196,113,79,.4)',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:12}}>
            <div style={{flexShrink:0}}>
              {photos[selRef]?(
                <div style={{position:'relative',width:80,height:80}}>
                  <img src={photos[selRef]} alt="" style={{width:80,height:80,borderRadius:8,objectFit:'cover',border:'1px solid #334155'}}/>
                  <button onClick={()=>setPhotos(p=>{const n={...p};delete n[selRef];return n})} style={{position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',border:'none',background:'rgba(239,68,68,.8)',color:'#fff',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
              ):(
                <label style={{width:80,height:80,borderRadius:8,border:'1px dashed #475569',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',background:'#0F172A'}}>
                  <span style={{fontSize:20}}>📷</span>
                  <span style={{fontSize:8,color:'#64748B',marginTop:2}}>Ajouter photo</span>
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>uploadPhoto(selRef,e)}/>
                </label>
              )}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{matSelec.nom}</div>
              <div style={{fontSize:10,color:'#64748B',fontFamily:'monospace',marginBottom:6}}>{matSelec.ref}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <Tag c={GCOL[matSelec.groupe]||'#C4714F'}>{GICON[matSelec.groupe]} {matSelec.groupe}</Tag>
                <Tag c="#60A5FA">{matSelec.fournisseur}</Tag>
                <Tag c="#22C55E">{matSelec.prix>0?matSelec.prix.toFixed(2)+' DH HT':'Prix NC'}</Tag>
                <Tag c="#94A3B8">Unité: {matSelec.unit}</Tag>
              </div>
            </div>
            <div style={{textAlign:'center',flexShrink:0}}>
              <div style={{fontSize:9,color:'#64748B',marginBottom:4}}>STOCK ACTUEL</div>
              {(()=>{const sv=stock[selRef]||0;const sc=sv===0?'#EF4444':sv<=matSelec.seuil?'#D97706':'#22C55E';return(<>
                <span style={{fontFamily:'monospace',fontWeight:800,color:sc,fontSize:22}}>{sv}</span>
                <div style={{fontSize:9,color:'#64748B',marginTop:2}}>{matSelec.unit}</div>
                <div style={{marginTop:8,display:'flex',gap:4,alignItems:'center'}}>
                  <input type="number" min="0" value={editQte[selRef]!==undefined?editQte[selRef]:sv} onChange={e=>setEditQte(q=>({...q,[selRef]:e.target.value}))} style={{width:56,background:'#0F172A',border:'1px solid #334155',color:'#E2E8F0',padding:'4px 6px',borderRadius:6,fontSize:11,textAlign:'center',fontFamily:'monospace',outline:'none'}}/>
                  <button onClick={()=>saveQte(selRef)} style={{padding:'4px 8px',borderRadius:6,border:'none',background:'#16A34A',color:'#fff',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'inherit'}}>✓</button>
                </div>
              </>)})()} 
            </div>
            <button onClick={()=>setSelRef(null)} style={{background:'none',border:'none',color:'#64748B',cursor:'pointer',fontSize:18,padding:0,flexShrink:0}}>✕</button>
          </div>
          {(()=>{
            const mots=matSelec.nom.split(' ').filter(m=>m.length>4)
            const similaires=MATIERES.filter(m=>m.ref!==selRef&&mots.some(mot=>m.nom.includes(mot))).slice(0,4)
            if(!similaires.length) return null
            return(<div>
              <div style={{fontSize:10,fontWeight:700,color:'#64748B',marginBottom:6}}>💰 Comparaison prix fournisseurs</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <div style={{background:'rgba(196,113,79,.1)',border:'1px solid rgba(196,113,79,.3)',borderRadius:7,padding:'5px 10px',textAlign:'center',minWidth:90}}>
                  <div style={{fontSize:9,color:'#C4714F',marginBottom:2}}>{matSelec.fournisseur.slice(0,12)}</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#C4714F'}}>{matSelec.prix.toFixed(2)} DH</div>
                  <div style={{fontSize:8,color:'#64748B'}}>Ce fournisseur</div>
                </div>
                {similaires.map((s,i)=>{const isCheaper=s.prix<matSelec.prix;return(
                  <div key={i} style={{background:isCheaper?'rgba(34,197,94,.08)':'#334155',border:`1px solid ${isCheaper?'rgba(34,197,94,.3)':'#475569'}`,borderRadius:7,padding:'5px 10px',textAlign:'center',minWidth:90}}>
                    <div style={{fontSize:9,color:'#64748B',marginBottom:2}}>{s.fournisseur.slice(0,12)}</div>
                    <div style={{fontSize:13,fontWeight:700,color:isCheaper?'#22C55E':'#94A3B8'}}>{s.prix.toFixed(2)} DH</div>
                    {isCheaper&&<div style={{fontSize:8,color:'#22C55E'}}>↓ -{((matSelec.prix-s.prix)/matSelec.prix*100).toFixed(0)}%</div>}
                  </div>
                )})}
              </div>
            </div>)
          })()}
        </div>
      )}
      <div style={{display:'flex',gap:6,marginBottom:8}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Référence, désignation, fournisseur..." style={{flex:1,background:'#1E293B',border:'1px solid #334155',color:'#E2E8F0',padding:'7px 10px',borderRadius:7,fontSize:11,outline:'none',fontFamily:'inherit'}}/>
        <select value={fournSel} onChange={e=>setFournSel(e.target.value)} style={{background:'#1E293B',border:'1px solid #334155',color:'#E2E8F0',padding:'7px 10px',borderRadius:7,fontSize:10,outline:'none',fontFamily:'inherit',maxWidth:160}}>
          {fournisseurs.map(f=><option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>
        {GROUPES.map(g=>(
          <button key={g} onClick={()=>setGroupe(g)} style={{padding:'3px 9px',borderRadius:20,border:'none',background:groupe===g?GCOL[g]||'#C4714F':'#1E293B',color:groupe===g?'#fff':'#64748B',cursor:'pointer',fontSize:9,fontWeight:700,fontFamily:'inherit'}}>
            {GICON[g]} {g}
          </button>
        ))}
      </div>
      <div style={{fontSize:10,color:'#64748B',marginBottom:6}}>{matieresFiltrees.length} résultats</div>
      <div className="card-0">
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead>
              <tr style={{background:'#0F172A'}}>
                {['Photo','Référence','Désignation','Famille','Fournisseur','P.U. HT','Stock','Modifier','Action'].map(h=>(
                  <th key={h} style={{padding:'8px 10px',fontSize:9,fontWeight:700,color:'#64748B',textAlign:'left',borderBottom:'1px solid #334155',textTransform:'uppercase',letterSpacing:'.04em',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matieresFiltrees.slice(0,100).map(m=>{
                const sv=stock[m.ref]||0
                const sc=sv===0?'#EF4444':sv<=m.seuil?'#D97706':'#22C55E'
                const isEditing=editQte[m.ref]!==undefined
                return(
                  <tr key={m.ref} style={{borderBottom:'1px solid #1E293B',background:selRef===m.ref?'rgba(196,113,79,.06)':'transparent',cursor:'pointer'}} onClick={()=>setSelRef(selRef===m.ref?null:m.ref)}>
                    <td style={{padding:'6px 10px'}}>
                      {photos[m.ref]?(<img src={photos[m.ref]} alt="" style={{width:28,height:28,borderRadius:4,objectFit:'cover',border:'1px solid #334155'}}/>):(<div style={{width:28,height:28,borderRadius:4,background:'#334155',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>{GICON[m.groupe]}</div>)}
                    </td>
                    <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:10,color:'#64748B'}}>{m.ref}</td>
                    <td style={{padding:'6px 10px',fontWeight:500,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.nom}</td>
                    <td style={{padding:'6px 10px'}}><Tag c={GCOL[m.groupe]||'#94A3B8'}>{GICON[m.groupe]} {m.groupe}</Tag></td>
                    <td style={{padding:'6px 10px',fontSize:10,color:'#60A5FA',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.fournisseur}</td>
                    <td style={{padding:'6px 10px',textAlign:'right',fontFamily:'monospace',fontSize:10,fontWeight:700,color:'#22C55E'}}>{m.prix>0?m.prix.toFixed(2):'-'}</td>
                    <td style={{padding:'6px 10px',textAlign:'center'}}><span style={{fontFamily:'monospace',fontWeight:800,color:sc,fontSize:13}}>{sv}</span><span style={{fontSize:9,color:'#475569',marginLeft:3}}>{m.unit}</span></td>
                    <td style={{padding:'6px 10px'}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:'flex',gap:4,alignItems:'center'}}>
                        <input type="number" min="0" value={isEditing?editQte[m.ref]:sv} onChange={e=>setEditQte(q=>({...q,[m.ref]:e.target.value}))} style={{width:48,background:'#0F172A',border:'1px solid #334155',color:'#E2E8F0',padding:'3px 5px',borderRadius:5,fontSize:10,textAlign:'center',fontFamily:'monospace',outline:'none'}}/>
                        {isEditing&&<button onClick={()=>saveQte(m.ref)} style={{height:22,padding:'0 7px',borderRadius:5,border:'none',background:'#16A34A',color:'#fff',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'inherit'}}>✓</button>}
                        <label style={{height:22,padding:'0 5px',borderRadius:5,border:'1px solid #334155',background:'#1E293B',color:'#94A3B8',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          📷<input type="file" accept="image/*" style={{display:'none'}} onChange={e=>uploadPhoto(m.ref,e)}/>
                        </label>
                      </div>
                    </td>
                    <td style={{padding:'6px 10px'}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>setNewDem({ref:m.ref,nom:m.nom,qte:1,unit:m.unit,prix:m.prix,fournisseur:m.fournisseur})} style={{padding:'3px 8px',borderRadius:5,border:`1px solid ${sv===0?'rgba(239,68,68,.4)':'#334155'}`,background:sv===0?'rgba(239,68,68,.08)':'#1E293B',color:sv===0?'#EF4444':'#94A3B8',cursor:'pointer',fontSize:9,fontWeight:700,fontFamily:'inherit'}}>
                        {sv===0?'🛒 Commander':'Demander'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {matieresFiltrees.length>100&&<div style={{padding:'8px 12px',fontSize:10,color:'#64748B',borderTop:'1px solid #334155',textAlign:'center'}}>Affinez la recherche — {matieresFiltrees.length} résultats</div>}
      </div>
    </div>)
  }

  /* ─── STATISTIQUES ───────────────────────────────────────────────── */
  function renderStats() {
    const topMontant=[...HIST].sort((a,b)=>b.montant-a.montant).slice(0,10)
    const parGroupe={};HIST.forEach(h=>{parGroupe[h.groupe]=(parGroupe[h.groupe]||0)+h.montant})
    const groupeArr=Object.entries(parGroupe).sort((a,b)=>b[1]-a[1])
    const totalAchats=HIST.reduce((a,h)=>a+h.montant,0)
    const parFourn={};HIST.forEach(h=>{parFourn[h.fournisseur]=(parFourn[h.fournisseur]||0)+h.montant})
    const fournArr=Object.entries(parFourn).sort((a,b)=>b[1]-a[1]).slice(0,8)
    const comparaisons={};MATIERES.forEach(m=>{const k=m.nom.split(' ').filter(w=>w.length>4).slice(0,2).join(' ');if(!comparaisons[k])comparaisons[k]=[];comparaisons[k].push(m)})
    const multiSrc=Object.entries(comparaisons).filter(([,v])=>v.length>=2).sort((a,b)=>b[1].length-a[1].length).slice(0,5)
    return(<div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <div className="card">
          <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>🏆 Top 10 articles achetés</div>
          {topMontant.map((h,i)=>{const pct=h.montant/topMontant[0].montant*100;return(
            <div key={i} style={{marginBottom:7}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:8}}><b style={{color:'#C4714F'}}>#{i+1}</b> {h.nom}</span>
                <span style={{fontWeight:700,color:'#22C55E',flexShrink:0}}>{dh(h.montant)}</span>
              </div>
              <div style={{height:4,background:'#334155',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:pct+'%',background:i===0?'#C4714F':i<3?'#D97706':'#475569',borderRadius:2}}/>
              </div>
            </div>
          )})}
        </div>
        <div className="card">
          <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>📊 Achats par famille — {dh(totalAchats)}</div>
          {groupeArr.map(([g,mt])=>{const pct=mt/totalAchats*100;return(
            <div key={g} style={{marginBottom:7}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}>
                <span>{GICON[g]} {g}</span>
                <span><b style={{color:GCOL[g]||'#C4714F'}}>{pct.toFixed(0)}%</b> · {dh(mt)}</span>
              </div>
              <div style={{height:4,background:'#334155',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:pct+'%',background:GCOL[g]||'#C4714F',borderRadius:2}}/>
              </div>
            </div>
          )})}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div className="card">
          <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>🏭 Top fournisseurs</div>
          {fournArr.map(([f,mt],i)=>{const pct=mt/fournArr[0][1]*100;return(
            <div key={i} style={{marginBottom:7}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{f}</span>
                <span style={{fontWeight:700,color:'#60A5FA',flexShrink:0,marginLeft:6}}>{dh(mt)}</span>
              </div>
              <div style={{height:4,background:'#334155',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:pct+'%',background:'#60A5FA',borderRadius:2}}/>
              </div>
            </div>
          )})}
        </div>
        <div className="card">
          <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>💰 Comparaison prix fournisseurs</div>
          {multiSrc.map(([key,mats])=>{
            const sorted=[...mats].sort((a,b)=>a.prix-b.prix)
            const best=sorted[0],worst=sorted[sorted.length-1]
            const econ=((worst.prix-best.prix)/worst.prix*100).toFixed(0)
            return(<div key={key} style={{marginBottom:10,background:'#0F172A',borderRadius:7,padding:'7px 10px'}}>
              <div style={{fontSize:10,fontWeight:600,marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{best.nom.slice(0,40)}</div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {sorted.map((m,i)=>(
                  <div key={i} style={{textAlign:'center',padding:'3px 7px',borderRadius:5,background:i===0?'rgba(34,197,94,.12)':'#334155',border:`1px solid ${i===0?'rgba(34,197,94,.3)':'#475569'}`}}>
                    <div style={{fontSize:8,color:'#64748B'}}>{m.fournisseur.slice(0,10)}</div>
                    <div style={{fontSize:11,fontWeight:700,color:i===0?'#22C55E':'#94A3B8'}}>{m.prix.toFixed(0)} DH</div>
                  </div>
                ))}
                <div style={{textAlign:'center',padding:'3px 7px',borderRadius:5,background:'rgba(34,197,94,.08)',marginLeft:'auto'}}>
                  <div style={{fontSize:8,color:'#64748B'}}>Économie</div>
                  <div style={{fontSize:11,fontWeight:700,color:'#22C55E'}}>-{econ}%</div>
                </div>
              </div>
            </div>)
          })}
        </div>
      </div>
    </div>)
  }

  const TABS=[
    {id:'dash',l:'🏠 Dashboard'},
    {id:'stock',l:'📦 Stock ('+MATIERES.length+')'},
    {id:'stats',l:'📊 Statistiques'},
    {id:'demandes',l:'🛒 Demandes'+(enAttente>0?' ('+enAttente+')':'')},
    {id:'bdc',l:'📋 BDC ('+bdcs.length+')'},
    {id:'reception',l:'📥 Réceptions'},
  ]

  return(<div>
    <div style={{display:'flex',gap:3,marginBottom:12,background:'#1E293B',padding:3,borderRadius:9,overflowX:'auto'}}>
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>setView(t.id)} style={{flex:'0 0 auto',padding:'6px 10px',borderRadius:7,border:'none',background:view===t.id?'#C4714F':'transparent',color:view===t.id?'#fff':'#64748B',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap'}}>{t.l}</button>
      ))}
    </div>
    {view==='dash'&&renderDash()}
    {view==='stock'&&renderStock()}
    {view==='stats'&&renderStats()}
    {view==='demandes'&&<div className="card">
      <div style={{fontSize:11,fontWeight:700,marginBottom:10}}>🛒 Demandes ({demandes.length})</div>
      {demandes.length===0&&<div style={{textAlign:'center',padding:20,color:'#64748B'}}>Aucune demande</div>}
      {demandes.map(d=>(
        <div key={d.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid #334155',fontSize:11}}>
          <div style={{flex:1}}><div style={{fontWeight:600}}>{d.nom}</div><div style={{fontSize:9,color:'#64748B'}}>{d.fournisseur} · {d.qte} {d.unit} · {d.date}</div></div>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20,background:d.status==='attente'?'rgba(196,113,79,.15)':'rgba(34,197,94,.15)',color:d.status==='attente'?'#C4714F':'#22C55E'}}>{d.status==='attente'?'⏳ En attente':'✅ Validée'}</span>
          {d.status==='attente'&&<button onClick={()=>setDemandes(p=>p.map(x=>x.id===d.id?{...x,status:'validée'}:x))} style={{padding:'3px 8px',borderRadius:5,border:'none',background:'#16A34A',color:'#fff',cursor:'pointer',fontSize:9,fontWeight:700,fontFamily:'inherit'}}>✓ Valider</button>}
        </div>
      ))}
    </div>}
    {view==='bdc'&&<div style={{textAlign:'center',padding:40,color:'#64748B'}}><div style={{fontSize:32}}>📋</div><div style={{marginTop:8}}>Bons de commande — Bientôt disponible</div></div>}
    {view==='reception'&&<div style={{textAlign:'center',padding:40,color:'#64748B'}}><div style={{fontSize:32}}>📥</div><div style={{marginTop:8}}>Réceptions — Bientôt disponible</div></div>}

    {newDem&&(
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:50,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
        <div style={{background:'#1E293B',borderRadius:'14px 14px 0 0',padding:20,maxHeight:'70vh',overflowY:'auto'}}>
          <div style={{width:32,height:4,background:'#334155',borderRadius:2,margin:'0 auto 16px'}}/>
          <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>🛒 Demande d'achat</div>
          <div style={{fontSize:11,color:'#64748B',marginBottom:12}}>{newDem.nom} · {newDem.fournisseur}</div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:'#94A3B8',marginBottom:4}}>Quantité ({newDem.unit})</div>
            <input type="number" min="1" value={newDem.qte} onChange={e=>setNewDem(p=>({...p,qte:parseInt(e.target.value)||1}))} style={{width:'100%',background:'#0F172A',border:'1px solid #334155',color:'#E2E8F0',padding:'8px 10px',borderRadius:7,fontSize:14,outline:'none',fontFamily:'monospace'}}/>
          </div>
          {newDem.prix>0&&<div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:11,color:'#22C55E'}}>Coût estimé : <b>{dh(newDem.prix*newDem.qte)}</b> HT</div>}
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setNewDem(null)} style={{flex:1,padding:12,borderRadius:9,border:'1px solid #334155',background:'transparent',color:'#64748B',cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>Annuler</button>
            <button onClick={envoyerDemande} style={{flex:2,padding:12,borderRadius:9,border:'none',background:'#C4714F',color:'#fff',cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:13}}>✓ Envoyer la demande</button>
          </div>
        </div>
      </div>
    )}
  </div>)
}
