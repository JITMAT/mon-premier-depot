import React from 'react'
import { useApp } from '../store'
import { EMP, atI } from '../data/employees'
import { ATELIERS_MAP, WORKFLOWS } from '../data/workflows'

// ─────────────────────────────────────────────────────────────────
//  FICHE DE PRODUCTION — vue ouvrier (tablette) + impression A4
//  Consolide toutes les infos d'un article : commande, spécifications,
//  mesures, schéma, gamme de fabrication, matières, qualité.
//  (Pas de coûts/marge : fiche destinée à l'atelier.)
// ─────────────────────────────────────────────────────────────────

const fmt = v => (v === undefined || v === null || v === '') ? '—' : v
const fH = ms => { if (!ms || ms <= 0) return '0h'; const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000); return h>0?`${h}h${m>0?m+'m':''}`:`${m}m` }

function stepWorkedMs(step) {
  return (step.sessions || []).reduce((acc, s) => {
    const pause = s.totalPauseMs || 0
    if (s.end) return acc + (new Date(s.end) - new Date(s.t0) - pause)
    if (s.pausedAt) return acc + (new Date(s.pausedAt) - new Date(s.t0) - pause)
    return acc + (Date.now() - new Date(s.t0) - pause)
  }, 0)
}

export default function FicheProduction({ artId, onClose }) {
  const { arts, orders, stepProgress, mats, quals } = useApp()
  const art = arts[artId]
  if (!art) return null

  const o = orders.find(x => x.ref === art.ref) || {}
  const f = art.fiche || {}
  const at = atI(art.at)
  const steps = stepProgress[artId] || []
  const wf = art.wfId ? WORKFLOWS[art.wfId] : null
  const matList = mats[artId] || []
  const qual = quals[artId]

  const daysLeft = o.liv ? Math.ceil((new Date(o.liv) - new Date()) / 86400000) : null
  const isLate = daysLeft !== null && daysLeft < 0

  const dims = [
    ['Longueur', f.longueur], ['Largeur', f.largeur], ['Hauteur', f.hauteur],
    ['Prof. assise', f.profAssise], ['Haut. pied', f.hauteurPied], ['Larg. dossier', f.largeurDossier],
  ]
  const mesuresClient = [
    ['L', f.mesCliL], ['l', f.mesCliLa], ['H', f.mesCliH], ['Prof.', f.mesCliProf], ['Autre', f.mesCliAutre],
  ].filter(([, v]) => v)
  const nbCoussins = parseInt(f.nbCoussins) || 0

  // Styles
  const S = {
    section: { border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 10, overflow: 'hidden', background: '#fff' },
    head: { background: '#0F172A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '.04em' },
    body: { padding: 10 },
    row: { display: 'flex', fontSize: 12, padding: '3px 0', borderBottom: '1px dotted #e2e8f0' },
    lbl: { width: 130, color: '#64748b', flexShrink: 0 },
    val: { fontWeight: 600, color: '#0f172a' },
    th: { textAlign: 'left', fontSize: 9, color: '#64748b', textTransform: 'uppercase', padding: '5px 6px', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' },
    td: { fontSize: 11, padding: '5px 6px', borderBottom: '1px solid #eef2f7', verticalAlign: 'top' },
  }

  return (
    <div className="no-print-bg" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 80, overflowY: 'auto', padding: '16px 0' }}>
      {/* Barre d'actions (non imprimée) */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        <button onClick={() => window.print()} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#C4714F', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>🖨️ Imprimer (A4)</button>
        <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>✕ Fermer</button>
      </div>

      {/* Document A4 */}
      <div className="fiche-print" style={{ width: '210mm', maxWidth: 'calc(100% - 24px)', margin: '0 auto', background: '#fff', color: '#0f172a', padding: '16mm 14mm', boxShadow: '0 8px 30px rgba(0,0,0,.3)', fontFamily: 'system-ui, sans-serif' }}>

        {/* EN-TÊTE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #0F172A', paddingBottom: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px' }}>CREA<span style={{ color: '#C4714F' }}>JIT</span></div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', color: '#475569' }}>FICHE DE PRODUCTION</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: '#C4714F' }}>N° {fmt(o.ref || art.ref)}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>Édité le {new Date().toLocaleDateString('fr')}</div>
            {o.liv && (
              <div style={{ marginTop: 4, display: 'inline-block', padding: '3px 10px', borderRadius: 6, background: isLate ? '#fee2e2' : '#dcfce7', color: isLate ? '#b91c1c' : '#15803d', fontSize: 12, fontWeight: 700 }}>
                Livraison : {new Date(o.liv).toLocaleDateString('fr', { day: '2-digit', month: 'short', year: '2-digit' })}{daysLeft !== null ? ` (${isLate ? '+' + Math.abs(daysLeft) + 'j retard' : daysLeft + 'j'})` : ''}
              </div>
            )}
          </div>
        </div>

        {/* CLIENT + ARTICLE */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ ...S.section, flex: 1, marginBottom: 0 }}>
            <div style={S.head}>Commande</div>
            <div style={S.body}>
              <div style={S.row}><span style={S.lbl}>Client</span><span style={S.val}>{fmt(o.cl)}</span></div>
              <div style={S.row}><span style={S.lbl}>Téléphone</span><span style={S.val}>{fmt(o.tel)}</span></div>
              <div style={S.row}><span style={S.lbl}>Commerciale</span><span style={S.val}>{fmt(o.com)}</span></div>
              <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.lbl}>Quantité</span><span style={S.val}>{fmt(art.q)}</span></div>
            </div>
          </div>
          <div style={{ ...S.section, flex: 1, marginBottom: 0 }}>
            <div style={S.head}>Article</div>
            <div style={{ ...S.body, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {art.photo
                ? <img src={art.photo} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1', flexShrink: 0 }} />
                : <div style={{ width: 80, height: 80, borderRadius: 6, border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>{at.e}</div>}
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(art.nom)}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{at.e} Atelier {at.n}</div>
                {wf && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{wf.icon} {wf.nom}</div>}
                {art.dim && <div style={{ fontSize: 11, color: '#C4714F', marginTop: 2 }}>{art.dim}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* SPÉCIFICATIONS */}
        <div style={S.section}>
          <div style={S.head}>Spécifications techniques</div>
          <div style={S.body}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px 16px', marginBottom: 6 }}>
              {dims.map(([l, v]) => (
                <div key={l} style={S.row}><span style={S.lbl}>{l} (cm)</span><span style={S.val}>{fmt(v)}</span></div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '2px 16px' }}>
              <div style={S.row}><span style={S.lbl}>Tissu / couleur</span><span style={S.val}>{fmt(f.couleurTissu)}</span></div>
              <div style={S.row}><span style={S.lbl}>Bois / métal</span><span style={S.val}>{fmt(f.couleurBois)}</span></div>
              <div style={S.row}><span style={S.lbl}>Baguette / liseré</span><span style={S.val}>{fmt(f.couleurBaguette)}</span></div>
              <div style={S.row}><span style={S.lbl}>Finition</span><span style={S.val}>{fmt(f.finition)}</span></div>
              <div style={S.row}><span style={S.lbl}>Accoudoirs</span><span style={S.val}>{fmt(f.accoudoirs)}</span></div>
              <div style={S.row}><span style={S.lbl}>Bombage</span><span style={S.val}>{fmt(f.bombage)}</span></div>
              <div style={S.row}><span style={S.lbl}>Couture</span><span style={S.val}>{fmt(f.couture)}{f.coutureDetail ? ` — ${f.coutureDetail}` : ''}</span></div>
              <div style={S.row}><span style={S.lbl}>Coussins</span><span style={S.val}>{nbCoussins || '—'}</span></div>
            </div>
            {nbCoussins > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead><tr><th style={S.th}>Coussin</th><th style={S.th}>Taille</th><th style={S.th}>Dimensions</th><th style={S.th}>Note</th></tr></thead>
                <tbody>
                  {Array.from({ length: Math.min(nbCoussins, 12) }).map((_, i) => {
                    const c = f[`coussin${i}`] || {}
                    return (
                      <tr key={i}>
                        <td style={S.td}>#{i + 1}</td>
                        <td style={S.td}>{fmt(c.taille)}</td>
                        <td style={S.td}>{fmt(c.dims)}</td>
                        <td style={S.td}>{fmt(c.note)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            {f.notes && <div style={{ marginTop: 8, padding: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12 }}><b>Note :</b> {f.notes}</div>}
          </div>
        </div>

        {/* MESURES */}
        <div style={S.section}>
          <div style={S.head}>Mesures</div>
          <div style={S.body}>
            <div style={S.row}><span style={S.lbl}>Prises par</span><span style={S.val}>{fmt(f.mesuresPrisesParNom)}</span></div>
            {mesuresClient.length > 0 && (
              <div style={{ ...S.row, borderBottom: 'none', flexWrap: 'wrap' }}>
                <span style={S.lbl}>Mesures client</span>
                <span style={S.val}>{mesuresClient.map(([l, v]) => `${l}: ${v}`).join('  ·  ')} cm</span>
              </div>
            )}
            <div style={{ fontSize: 11, color: f.ficheMesureUrl ? '#15803d' : '#94a3b8', marginTop: 4 }}>
              {f.ficheMesureUrl ? `📎 Fiche mesures signée jointe (${f.ficheMesureNom || 'document'})` : '📎 Aucune fiche mesures signée'}
            </div>
          </div>
        </div>

        {/* SCHÉMA / PLAN */}
        <div style={S.section}>
          <div style={S.head}>Schéma / Croquis</div>
          <div style={S.body}>
            {f.ficheMesureUrl
              ? <img src={f.ficheMesureUrl} alt="schéma" style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 6, border: '1px solid #cbd5e1' }} />
              : <div style={{ height: 120, border: '1px dashed #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>Zone schéma / croquis — à compléter</div>}
          </div>
        </div>

        {/* GAMME DE FABRICATION */}
        <div style={S.section}>
          <div style={S.head}>Gamme de fabrication</div>
          <div style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={S.th}>#</th><th style={S.th}>Atelier</th><th style={S.th}>Opération</th>
                  <th style={S.th}>Matière prévue</th><th style={S.th}>Est.</th><th style={S.th}>Ouvrier(s)</th><th style={S.th}>Réel</th><th style={S.th}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {steps.length === 0 && (
                  <tr><td style={S.td} colSpan={8}><i style={{ color: '#94a3b8' }}>Aucune gamme définie — sélectionner le type de produit dans la fiche.</i></td></tr>
                )}
                {steps.map((s, i) => {
                  const atInfo = ATELIERS_MAP[s.at] || {}
                  const workers = [...new Set((s.sessions || []).map(x => x.empN))]
                  const stStatut = s.status === 'done' ? '✅ Terminé' : s.status === 'active' ? '🟢 En cours' : s.status === 'paused' ? '⏸ Pause' : s.status === 'todo' ? '⬜ À faire' : '⋯ En attente'
                  return (
                    <tr key={i}>
                      <td style={S.td}>{i + 1}</td>
                      <td style={S.td}>{atInfo.icon || ''} {atInfo.nom || s.at}</td>
                      <td style={S.td}>{s.nom}</td>
                      <td style={{ ...S.td, color: '#475569' }}>{fmt(s.matiere)}</td>
                      <td style={S.td}>{s.totalEstimatedH || s.estH || '—'}h</td>
                      <td style={S.td}>{workers.length ? workers.join(', ') : '—'}</td>
                      <td style={S.td}>{(s.sessions || []).length ? fH(stepWorkedMs(s)) : '—'}</td>
                      <td style={S.td}>{stStatut}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MATIÈRES + QUALITÉ côte à côte */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ ...S.section, flex: 1 }}>
            <div style={S.head}>Matières premières</div>
            <div style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f1f5f9' }}><th style={S.th}>Désignation</th><th style={S.th}>Qté</th><th style={S.th}>Unité</th></tr></thead>
                <tbody>
                  {matList.length === 0 && <tr><td style={S.td} colSpan={3}><i style={{ color: '#94a3b8' }}>À définir</i></td></tr>}
                  {matList.map(m => (
                    <tr key={m.id}><td style={S.td}>{m.n}</td><td style={S.td}>{m.q}</td><td style={S.td}>{m.u}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ ...S.section, flex: 1 }}>
            <div style={S.head}>Contrôle qualité</div>
            <div style={S.body}>
              {qual ? (
                <>
                  <div style={S.row}><span style={S.lbl}>Conforme</span><span style={{ ...S.val, color: qual.ok ? '#15803d' : '#b91c1c' }}>{qual.ok ? '✅ Oui' : '❌ Non'}</span></div>
                  <div style={S.row}><span style={S.lbl}>Vérifié par</span><span style={S.val}>{fmt(qual.par)}</span></div>
                  {qual.obs && <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{qual.obs}</div>}
                </>
              ) : (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Conforme : ☐ Oui&nbsp;&nbsp;☐ Non<br /><br />Vérifié par : __________________</div>
              )}
            </div>
          </div>
        </div>

        {/* PLAN DE DÉBITAGE (à venir) */}
        <div style={{ ...S.section, marginTop: 10 }}>
          <div style={S.head}>Plan de débitage</div>
          <div style={{ ...S.body, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 90, color: '#94a3b8', fontSize: 12, border: '1px dashed #cbd5e1', margin: 10, borderRadius: 6 }}>
            🪚 À établir — module à venir
          </div>
        </div>

        {/* SIGNATURES */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 10, borderTop: '1px solid #cbd5e1' }}>
          {['Commerciale (specs validées)', 'Chef d\'atelier (lancement)', 'Contrôle final'].map(s => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 40, borderBottom: '1px solid #94a3b8' }} />
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS impression : n'imprimer que la fiche, format A4 */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .fiche-print, .fiche-print * { visibility: visible !important; }
          .fiche-print { position: absolute !important; left: 0; top: 0; width: 210mm !important; max-width: 210mm !important; margin: 0 !important; box-shadow: none !important; padding: 10mm 12mm !important; }
          .no-print, .no-print-bg { display: none !important; background: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  )
}
