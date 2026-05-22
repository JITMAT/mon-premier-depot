import React, { useState, useMemo } from 'react'

// ─── Données réelles CreaJit 21/05/2026 ─────────────────────────────────────
const ORDERS_REAL = [
  { ref:'26040026', client:'Mr Soufiane',       liv:'2026-05-04', estJ:3, color:'#DC2626', late:16 },
  { ref:'26040045', client:'Mr Yazid',           liv:'2026-05-04', estJ:3, color:'#DC2626', late:16 },
  { ref:'26040019', client:'2A WEDDING',         liv:'2026-05-05', estJ:4, color:'#DC2626', late:15 },
  { ref:'26040052', client:'Mr Benjamin',        liv:'2026-05-08', estJ:3, color:'#EA580C', late:12 },
  { ref:'26040048', client:'AZZOZI RELAX',       liv:'2026-05-08', estJ:2, color:'#EA580C', late:12 },
  { ref:'26040053', client:'Expresse Beuty',     liv:'2026-05-08', estJ:2, color:'#EA580C', late:12 },
  { ref:'26040008', client:'Mr Youssef AJDIR',   liv:'2026-05-09', estJ:3, color:'#EA580C', late:11 },
  { ref:'26040058', client:'Mr Rehal',           liv:'2026-05-15', estJ:3, color:'#D97706', late:5  },
  { ref:'26040022', client:'Mme Ilhame',         liv:'2026-05-15', estJ:3, color:'#D97706', late:5  },
  { ref:'26040024', client:'Mme Anisa',          liv:'2026-05-16', estJ:2, color:'#D97706', late:4  },
  { ref:'26040060', client:'Mme Laila',          liv:'2026-05-20', estJ:3, color:'#CA8A04', late:0  },
  { ref:'26040043', client:'2A WEDDING (2)',     liv:'2026-05-21', estJ:4, color:'#CA8A04', late:0  },
  { ref:'26050007', client:'Mr Maliki',          liv:'2026-05-25', estJ:3, color:'#16A34A', late:0  },
  { ref:'26040016', client:'Mme PEREZ',          liv:'2026-05-30', estJ:3, color:'#16A34A', late:0  },
  { ref:'26050030', client:'Mme Daniela',        liv:null,         estJ:3, color:'#64748B', late:0  },
  { ref:'26040025', client:'SHOWROOM (1)',        liv:null,         estJ:2, color:'#64748B', late:0  },
  { ref:'26040059', client:'Mme Zaki Nadia',     liv:null,         estJ:2, color:'#64748B', late:0  },
  { ref:'26050010', client:'Mme Soumali',        liv:null,         estJ:2, color:'#64748B', late:0  },
  { ref:'express2', client:'Expresse Beuty (2)', liv:null,         estJ:2, color:'#64748B', late:0  },
  { ref:'showroom2',client:'SHOWROOM (2)',        liv:null,         estJ:2, color:'#64748B', late:0  },
]

const ATELIERS = [
  { id:'men', nom:'Menuiserie', icon:'🪵', c:'#3498DB', workers:['Ayoub El Yagiz','Said Chnitifa','Hassan Labiad'] },
  { id:'tap', nom:'Tapisserie', icon:'🧵', c:'#9B59B6', workers:['Mouad El Mansouri','Youssef Bouchaib','Abdessamie'] },
  { id:'cut', nom:'Couturier',  icon:'✂️', c:'#E67E22', workers:['Fatima Zahra','Rachida Ait Hammou'] },
  { id:'pei', nom:'Peinture',   icon:'🎨', c:'#F39C12', workers:['Karim Tachfine','Noureddine Achraf'] },
  { id:'fer', nom:'Ferronnerie',icon:'🔧', c:'#E74C3C', workers:['Noureddine Ouzzat','Mohamed Elkarmani'] },
]

const TODAY = new Date(2026,4,21) // 21 mai 2026
const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam']

function monday(d) {
  const r = new Date(d)
  const dow = r.getDay() === 0 ? 6 : r.getDay()-1
  r.setDate(r.getDate() - dow)
  r.setHours(0,0,0,0)
  return r
}
function addD(d,n) { const r=new Date(d); r.setDate(r.getDate()+n); return r }
function fDay(d) { return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0') }
function fDayShort(d) { return d.getDate() }
function sameD(a,b) { return a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear() }
function isWeekend(d) { return d.getDay()===0||d.getDay()===6 }
function ini(n) { return n.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase() }

export default function Planning() {
  const [weekStart, setWeekStart] = useState(() => monday(TODAY))
  const [plan, setPlan]           = useState([]) // [{id,ref,client,estJ,color,workerName,startDate,status}]
  const [adding, setAdding]       = useState(null) // {workerName, date} — cellule qu'on est en train de remplir
  const [selRef, setSelRef]       = useState('')   // commande sélectionnée dans dropdown
  const [showTwoWeeks, setShowTwoWeeks] = useState(true)

  // Jours affichés (6 par semaine, lun-sam)
  const days = useMemo(() => {
    const d = []
    const weeks = showTwoWeeks ? 2 : 1
    for (let w=0; w<weeks; w++)
      for (let i=0; i<6; i++) d.push(addD(weekStart, w*7+i))
    return d
  }, [weekStart, showTwoWeeks])

  // Commandes non encore planifiées
  const nonPlan = useMemo(() =>
    ORDERS_REAL.filter(o => !plan.some(p => p.ref===o.ref))
  , [plan])

  // Toutes les workers (flat)
  const allWorkers = ATELIERS.flatMap(at => at.workers.map(w => ({name:w, at})))

  // Vérifie si un worker est occupé sur un jour donné
  function isBusy(workerName, day) {
    return plan.some(p => {
      if (p.workerName !== workerName) return false
      const s = new Date(p.startDate), e = addD(s, p.estJ-1)
      return day >= s && day <= e
    })
  }

  // Récupère l'assignment pour un worker/jour
  function getAssignment(workerName, day) {
    return plan.find(p => {
      if (p.workerName !== workerName) return false
      const s = new Date(p.startDate), e = addD(s, p.estJ-1)
      return day >= s && day <= e
    })
  }

  // Est-ce le premier jour de cet assignment ?
  function isFirstDay(assignment, day) {
    return sameD(new Date(assignment.startDate), day)
  }

  // Combien de colonnes restantes pour afficher le bloc
  function blockSpan(assignment, dayIdx) {
    const s = new Date(assignment.startDate)
    const e = addD(s, assignment.estJ-1)
    let span = 0
    for (let i=dayIdx; i<days.length; i++) {
      if (days[i] > e) break
      if (isWeekend(days[i])) break
      span++
    }
    return Math.max(1, span)
  }

  function doAssign() {
    if (!adding || !selRef) return
    const ord = ORDERS_REAL.find(o => o.ref===selRef)
    if (!ord) return
    // Trouver le premier jour libre depuis la date sélectionnée
    let startDay = new Date(adding.date)
    // Avancer si occupé
    let tries = 0
    while (isBusy(adding.workerName, startDay) && tries < 14) {
      startDay = addD(startDay, 1)
      if (startDay.getDay()===0) startDay = addD(startDay,1) // skip dimanche
      tries++
    }
    setPlan(p => [...p, { id: Math.random().toString(36).slice(2), ref:ord.ref, client:ord.client, estJ:ord.estJ, color:ord.color, workerName:adding.workerName, startDate:startDay.toISOString(), status:'planned', late:ord.late, liv:ord.liv }])
    setAdding(null); setSelRef('')
  }

  function removeAssign(id) { setPlan(p => p.filter(x=>x.id!==id)) }

  function lancer(id) { setPlan(p => p.map(x => x.id===id ? {...x, status:'running'} : x)) }
  function terminer(id) { setPlan(p => p.map(x => x.id===id ? {...x, status:'done'} : x)) }

  const weekLabel = `${fDay(weekStart)} → ${fDay(addD(weekStart, showTwoWeeks?13:5))}`

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 120px)', overflow:'hidden', fontFamily:'var(--font-sans)' }}>

      {/* ═══ PANNEAU GAUCHE — Articles à fabriquer ═══ */}
      <div style={{ width:190, flexShrink:0, borderRight:'.5px solid var(--bd)', overflowY:'auto', paddingRight:0 }}>
        <div style={{ padding:'8px 10px', borderBottom:'.5px solid var(--bd)', position:'sticky', top:0, background:'var(--c1)', zIndex:5 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--tx)' }}>Articles à fabriquer</div>
          <div style={{ fontSize:9, color:'var(--mu)' }}>{nonPlan.length} non planifiés · {plan.length} planifiés</div>
        </div>

        {/* En retard */}
        {nonPlan.filter(o=>o.late>0).length > 0 && (
          <div style={{ padding:'6px 8px 2px' }}>
            <div style={{ fontSize:8, fontWeight:700, color:'#DC2626', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>🔴 En retard</div>
            {nonPlan.filter(o=>o.late>0).map(o => (
              <div key={o.ref} style={{ padding:'6px 8px', marginBottom:3, borderRadius:6, background:o.color+'12', border:`.5px solid ${o.color}44`, borderLeft:`2px solid ${o.color}`, cursor:'pointer' }}
                onClick={() => { setAdding(null) }}>
                <div style={{ fontSize:10, fontWeight:700, color:o.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.client}</div>
                <div style={{ fontSize:9, color:'var(--mu)' }}>+{o.late}j · est. {o.estJ}j</div>
              </div>
            ))}
          </div>
        )}

        {/* Avec date */}
        {nonPlan.filter(o=>o.liv&&o.late===0).length > 0 && (
          <div style={{ padding:'6px 8px 2px' }}>
            <div style={{ fontSize:8, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>📅 Avec date</div>
            {nonPlan.filter(o=>o.liv&&o.late===0).map(o => (
              <div key={o.ref} style={{ padding:'6px 8px', marginBottom:3, borderRadius:6, background:o.color+'10', border:`.5px solid ${o.color}33`, borderLeft:`2px solid ${o.color}`, cursor:'pointer' }}>
                <div style={{ fontSize:10, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.client}</div>
                <div style={{ fontSize:9, color:'var(--mu)' }}>Liv. {o.liv?.slice(5).replace('-','/')} · {o.estJ}j</div>
              </div>
            ))}
          </div>
        )}

        {/* Sans date */}
        {nonPlan.filter(o=>!o.liv).length > 0 && (
          <div style={{ padding:'6px 8px 2px' }}>
            <div style={{ fontSize:8, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>⬜ Sans date</div>
            {nonPlan.filter(o=>!o.liv).map(o => (
              <div key={o.ref} style={{ padding:'6px 8px', marginBottom:3, borderRadius:6, background:'var(--c2)', border:'.5px solid var(--bd)', cursor:'pointer' }}>
                <div style={{ fontSize:10, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.client}</div>
                <div style={{ fontSize:9, color:'var(--mu)' }}>est. {o.estJ}j</div>
              </div>
            ))}
          </div>
        )}

        {nonPlan.length === 0 && (
          <div style={{ padding:16, textAlign:'center', fontSize:11, color:'var(--mu)' }}>✅ Tout planifié</div>
        )}
      </div>

      {/* ═══ PANNEAU DROIT — Planning par ouvrier ═══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header navigation semaine */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', borderBottom:'.5px solid var(--bd)', background:'var(--c1)', flexShrink:0 }}>
          <button onClick={() => setWeekStart(d => addD(d,-7))} style={{ width:28, height:28, borderRadius:6, border:'.5px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <div style={{ flex:1, textAlign:'center' }}>
            <div style={{ fontSize:12, fontWeight:700 }}>{weekLabel}</div>
            <div style={{ fontSize:9, color:'var(--mu)' }}>{plan.filter(p=>p.status==='running').length} en cours · {plan.filter(p=>p.status==='done').length} terminés</div>
          </div>
          <button onClick={() => setWeekStart(d => addD(d,7))} style={{ width:28, height:28, borderRadius:6, border:'.5px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          <button onClick={() => setWeekStart(monday(TODAY))} style={{ padding:'3px 8px', borderRadius:6, border:'.5px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontSize:9, fontFamily:'inherit', fontWeight:700 }}>Auj.</button>
          <button onClick={() => setShowTwoWeeks(s=>!s)} style={{ padding:'3px 8px', borderRadius:6, border:'.5px solid var(--bd)', background:showTwoWeeks?'var(--or)':'var(--c2)', color:showTwoWeeks?'#fff':'var(--tx)', cursor:'pointer', fontSize:9, fontFamily:'inherit', fontWeight:700 }}>
            {showTwoWeeks?'1 sem.':'2 sem.'}
          </button>
        </div>

        {/* Grille planning */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:showTwoWeeks?900:500 }}>
            <thead style={{ position:'sticky', top:0, zIndex:4 }}>
              <tr>
                {/* Colonne ouvrier */}
                <th style={{ width:110, background:'var(--c1)', border:'.5px solid var(--bd)', padding:'5px 8px', textAlign:'left', fontSize:9, fontWeight:700, color:'var(--mu)', textTransform:'uppercase', letterSpacing:'.04em' }}>Ouvrier</th>
                {/* Colonnes jours */}
                {days.map((d,i) => {
                  const isToday = sameD(d, TODAY)
                  const isMon = d.getDay()===1
                  const isLast = i===days.length-1
                  return (
                    <th key={i} style={{ background:isToday?'rgba(196,113,79,.08)':'var(--c1)', border:`.5px solid ${isToday?'rgba(196,113,79,.4)':'var(--bd)'}`, borderRight:isMon&&i>0?'2px solid rgba(196,113,79,.3)':'', padding:'3px 4px', textAlign:'center', minWidth:showTwoWeeks?52:70, maxWidth:showTwoWeeks?52:70 }}>
                      <div style={{ fontSize:8, color:isToday?'var(--or)':'var(--mu)', fontWeight:700, textTransform:'uppercase' }}>{JOURS[i%6]}</div>
                      <div style={{ fontSize:11, fontWeight:isToday?700:400, color:isToday?'var(--or)':'var(--tx)' }}>
                        {isToday ? <span style={{ background:'var(--or)', color:'#fff', borderRadius:'50%', width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>{d.getDate()}</span> : d.getDate()}
                      </div>
                      <div style={{ fontSize:8, color:'var(--mu)' }}>{String(d.getMonth()+1).padStart(2,'0')+'/'}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {ATELIERS.map(at => (
                <React.Fragment key={at.id}>
                  {/* Header atelier */}
                  <tr>
                    <td colSpan={days.length+1} style={{ background:at.c+'12', borderTop:`1px solid ${at.c}33`, padding:'3px 10px' }}>
                      <span style={{ fontSize:9, fontWeight:700, color:at.c, textTransform:'uppercase', letterSpacing:'.05em' }}>{at.icon} {at.nom}</span>
                    </td>
                  </tr>
                  {/* Lignes ouvriers */}
                  {at.workers.map(wname => (
                    <tr key={wname}>
                      {/* Nom ouvrier */}
                      <td style={{ border:'.5px solid var(--bd)', padding:'3px 8px', background:'var(--c1)', verticalAlign:'middle' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', background:at.c+'22', color:at.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, flexShrink:0 }}>{ini(wname)}</div>
                          <div style={{ fontSize:10, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wname.split(' ')[0]}</div>
                        </div>
                      </td>

                      {/* Cellules jours */}
                      {days.map((day, dayIdx) => {
                        const isToday = sameD(day, TODAY)
                        const assign = getAssignment(wname, day)
                        const isFirst = assign && isFirstDay(assign, day)
                        const span = isFirst ? blockSpan(assign, dayIdx) : 1
                        const isAddingHere = adding?.workerName===wname && sameD(adding.date, day)
                        const isMon = day.getDay()===1 && dayIdx>0

                        // Si ce jour est couvert par un bloc (pas le premier) → skip
                        if (assign && !isFirst) return null

                        return (
                          <td key={dayIdx}
                            colSpan={assign ? span : 1}
                            onClick={() => {
                              if (assign) return
                              setAdding({workerName:wname, date:day}); setSelRef('')
                            }}
                            style={{ border:`.5px solid ${isToday?'rgba(196,113,79,.3)':'var(--bd)'}`, borderLeft:isMon?'2px solid rgba(196,113,79,.2)':'', background:isToday&&!assign?'rgba(196,113,79,.04)':'transparent', padding:2, verticalAlign:'top', cursor:assign?'default':'pointer', position:'relative', minWidth:showTwoWeeks?52:70 }}>

                            {/* Bloc commande planifiée */}
                            {assign && isFirst && (
                              <div style={{ background:assign.color+'18', border:`.5px solid ${assign.color}66`, borderLeft:`3px solid ${assign.color}`, borderRadius:5, padding:'3px 5px', margin:1, position:'relative' }}>
                                <div style={{ fontSize:9, fontWeight:700, color:assign.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {assign.status==='running'?'⚡ ':assign.status==='done'?'✅ ':''}{assign.client}
                                </div>
                                <div style={{ fontSize:8, color:'var(--mu)' }}>{assign.estJ}j{assign.late>0?` · +${assign.late}j retard`:''}</div>
                                {/* Boutons inline */}
                                <div style={{ display:'flex', gap:2, marginTop:2 }}>
                                  {assign.status==='planned' && (
                                    <button onClick={e=>{e.stopPropagation();lancer(assign.id)}} style={{ height:14, padding:'0 4px', borderRadius:3, border:'none', background:'#16A34A', color:'#fff', cursor:'pointer', fontSize:7, fontWeight:700 }}>▶</button>
                                  )}
                                  {assign.status==='running' && (
                                    <button onClick={e=>{e.stopPropagation();terminer(assign.id)}} style={{ height:14, padding:'0 4px', borderRadius:3, border:'none', background:'#2563EB', color:'#fff', cursor:'pointer', fontSize:7, fontWeight:700 }}>✓</button>
                                  )}
                                  <button onClick={e=>{e.stopPropagation();removeAssign(assign.id)}} style={{ height:14, width:14, borderRadius:3, border:'.5px solid var(--bd)', background:'var(--c2)', color:'var(--mu)', cursor:'pointer', fontSize:8, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                                </div>
                              </div>
                            )}

                            {/* Cellule vide — afficher + au hover */}
                            {!assign && !isAddingHere && (
                              <div style={{ height:44, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--bd)', fontSize:14, opacity:0 }} className="empty-cell">+</div>
                            )}

                            {/* Dropdown sélection commande */}
                            {isAddingHere && (
                              <div style={{ position:'absolute', top:'100%', left:0, zIndex:20, background:'var(--c1)', border:'1px solid var(--bd)', borderRadius:8, padding:8, width:200, boxShadow:'0 4px 16px rgba(0,0,0,.15)' }} onClick={e=>e.stopPropagation()}>
                                <div style={{ fontSize:10, fontWeight:700, marginBottom:6 }}>+ Ajouter commande</div>
                                <select value={selRef} onChange={e => setSelRef(e.target.value)}
                                  style={{ width:'100%', background:'var(--c2)', border:'1px solid var(--bd)', borderRadius:6, padding:'6px 8px', color:'var(--tx)', fontSize:11, outline:'none', fontFamily:'inherit', marginBottom:6 }}>
                                  <option value="">— Sélectionner —</option>
                                  {nonPlan.map(o => <option key={o.ref} value={o.ref}>{o.client} ({o.estJ}j{o.late>0?` +${o.late}j`:o.liv?' liv.'+o.liv?.slice(5).replace('-','/'):''})</option>)}
                                </select>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button onClick={() => { setAdding(null); setSelRef('') }} style={{ flex:1, padding:'5px', borderRadius:5, border:'.5px solid var(--bd)', background:'var(--c2)', color:'var(--tx)', cursor:'pointer', fontSize:10, fontFamily:'inherit' }}>✕</button>
                                  <button onClick={doAssign} disabled={!selRef} style={{ flex:2, padding:'5px', borderRadius:5, border:'none', background:selRef?'var(--or)':'var(--bd)', color:'#fff', cursor:selRef?'pointer':'not-allowed', fontSize:10, fontFamily:'inherit', fontWeight:700 }}>📌 Planifier</button>
                                </div>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Légende bas */}
        <div style={{ padding:'4px 12px', borderTop:'.5px solid var(--bd)', background:'var(--c1)', display:'flex', gap:12, fontSize:9, color:'var(--mu)', flexShrink:0 }}>
          <span>🔴 En retard (&gt;0j)</span>
          <span>🟠 Urgent</span>
          <span>🟡 Bientôt</span>
          <span>🟢 OK</span>
          <span>⬜ Sans date</span>
          <span style={{ marginLeft:'auto' }}>Cliquer sur une cellule vide pour assigner une commande</span>
        </div>
      </div>

      <style>{`.empty-cell:hover{opacity:1!important;color:var(--mu)!important}`}</style>
    </div>
  )
}
