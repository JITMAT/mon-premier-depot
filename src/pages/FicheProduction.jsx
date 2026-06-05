import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useApp } from '../store'
import { EMP, atI } from '../data/employees'
import { ATELIERS_MAP, WORKFLOWS } from '../data/workflows'

// ─── SCHÉMA COTÉ SVG ─────────────────────────────────────────────
// Dessine 3 vues (face / profil / dessus) à partir des dimensions
// saisies dans la fiche technique. Flèches de cote automatiques.

function Arrow({ x1, y1, x2, y2, label, labelOffset = [0, 0], stroke = '#0f172a' }) {
  const mx = (x1 + x2) / 2 + labelOffset[0]
  const my = (y1 + y2) / 2 + labelOffset[1]
  return (
    <g>
      <defs>
        <marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={stroke} />
        </marker>
        <marker id="ah2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L6,3 L0,6 Z" fill={stroke} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={1} markerEnd="url(#ah)" markerStart="url(#ah2)" />
      {label && <text x={mx} y={my} textAnchor="middle" fontSize={9} fill={stroke} fontFamily="monospace" fontWeight="700">{label}</text>}
    </g>
  )
}

function SchemaCote({ f }) {
  const L  = parseFloat(f.longueur)  || 0  // largeur totale
  const P  = parseFloat(f.largeur)   || 0  // profondeur totale
  const H  = parseFloat(f.hauteur)   || 0  // hauteur totale
  const hP = parseFloat(f.hauteurPied)    || Math.round(H * 0.10)
  const pA = parseFloat(f.profAssise)     || Math.round(P * 0.6)
  const eD = parseFloat(f.largeurDossier) || Math.round(P * 0.18)
  const hA = Math.round(H * 0.40)  // hauteur assise estimée

  if (!L || !P || !H) return (
    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 20, border: '1px dashed #cbd5e1', borderRadius: 6 }}>
      ✏️ Renseignez Longueur + Largeur + Hauteur pour générer le schéma coté automatiquement.
    </div>
  )

  const PAD = 34  // marge pour flèches

  // ── Vue FACE (L × H) ──
  const F_W = 180, F_H = 120
  const sfx = F_W / L, sfy = F_H / H
  const sf  = Math.min(sfx, sfy)
  const fW  = L * sf, fH = H * sf
  const fOx = PAD, fOy = PAD
  const fAcc = Math.round(L * 0.10) * sf     // largeur accoudoir en px
  const fDos = Math.round(H * 0.62) * sf     // hauteur dossier en px
  const fPied= hP * sf                        // hauteur pied en px
  const fHas = hA * sf                        // hauteur assise en px

  // ── Vue PROFIL (P × H) ──
  const P_W = 120, P_H = 120
  const ppx = P_W / P, ppy = P_H / H
  const sp  = Math.min(ppx, ppy)
  const pW  = P * sp, pH = H * sp
  const pOx = fOx + fW + PAD + 20, pOy = PAD
  const pDos = eD * sp                        // épaisseur dossier en px
  const pAs  = pA * sp                        // profondeur assise en px
  const pPied= hP * sp
  const pHas = hA * sp

  // ── Vue DESSUS (L × P) ──
  const D_W = 180, D_H = 100
  const dx = D_W / L, dy = D_H / P
  const sd  = Math.min(dx, dy)
  const dW  = L * sd, dH = P * sd
  const dOx = fOx, dOy = fOy + fH + PAD + 30
  const dAcc = Math.round(L * 0.10) * sd
  const dDos = eD * sd

  const svgW = pOx + pW + PAD + 10
  const svgH = dOy + dH + PAD + 10

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}>

        {/* ───── VUE FACE ───── */}
        <text x={fOx} y={fOy - 18} fontSize={10} fontWeight={700} fill="#475569" fontFamily="sans-serif">VUE DE FACE</text>

        {/* Pieds */}
        <rect x={fOx + fAcc} y={fOy + fH - fPied} width={fW - 2*fAcc} height={fPied} fill="#d1d5db" stroke="#6b7280" strokeWidth={1} />
        {/* Assise */}
        <rect x={fOx + fAcc} y={fOy + fH - fPied - fHas} width={fW - 2*fAcc} height={fHas} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />
        {/* Dossier */}
        <rect x={fOx + fAcc} y={fOy} width={fW - 2*fAcc} height={fH - fPied - fHas} fill="#93c5fd" stroke="#3b82f6" strokeWidth={1.5} />
        {/* Accoudoir gauche */}
        <rect x={fOx} y={fOy} width={fAcc} height={fH - fPied} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />
        {/* Accoudoir droit */}
        <rect x={fOx + fW - fAcc} y={fOy} width={fAcc} height={fH - fPied} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />

        {/* Flèche largeur (bas) */}
        <line x1={fOx} y1={fOy + fH + 16} x2={fOx + fW} y2={fOy + fH + 16} stroke="#0f172a" strokeWidth={1} markerEnd="url(#ah)" markerStart="url(#ah2)" />
        <text x={fOx + fW/2} y={fOy + fH + 28} textAnchor="middle" fontSize={9} fill="#0f172a" fontFamily="monospace" fontWeight={700}>{L} cm</text>
        {/* Flèche hauteur (gauche) */}
        <line x1={fOx - 16} y1={fOy} x2={fOx - 16} y2={fOy + fH} stroke="#0f172a" strokeWidth={1} markerEnd="url(#ah)" markerStart="url(#ah2)" />
        <text x={fOx - 28} y={fOy + fH/2} textAnchor="middle" fontSize={9} fill="#0f172a" fontFamily="monospace" fontWeight={700} transform={`rotate(-90,${fOx-28},${fOy + fH/2})`}>{H} cm</text>
        {/* Cote hauteur assise */}
        <line x1={fOx + fW + 8} y1={fOy + fH - fPied} x2={fOx + fW + 8} y2={fOy + fH - fPied - fHas} stroke="#C4714F" strokeWidth={1} strokeDasharray="3,2" markerEnd="url(#ah)" markerStart="url(#ah2)" />
        <text x={fOx + fW + 20} y={fOy + fH - fPied - fHas/2} textAnchor="start" fontSize={8} fill="#C4714F" fontFamily="monospace">{hA}cm</text>

        {/* Légende */}
        <rect x={fOx} y={fOy + fH + 36} width={8} height={8} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1} />
        <text x={fOx + 12} y={fOy + fH + 44} fontSize={8} fill="#475569" fontFamily="sans-serif">Assise / dossier</text>
        <text x={fOx + 90} y={fOy + fH + 44} fontSize={8} fill="#C4714F" fontFamily="monospace" fontWeight={700}>↕ Haut. assise</text>

        {/* ───── VUE PROFIL ───── */}
        <text x={pOx} y={pOy - 18} fontSize={10} fontWeight={700} fill="#475569" fontFamily="sans-serif">VUE DE PROFIL</text>

        {/* Pied */}
        <rect x={pOx + pDos} y={pOy + pH - pPied} width={pW - pDos} height={pPied} fill="#d1d5db" stroke="#6b7280" strokeWidth={1} />
        {/* Assise */}
        <rect x={pOx + pDos} y={pOy + pH - pPied - pHas} width={pAs} height={pHas} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />
        {/* Dossier */}
        <rect x={pOx} y={pOy} width={pDos} height={pH - pPied} fill="#93c5fd" stroke="#3b82f6" strokeWidth={1.5} />

        {/* Flèche profondeur */}
        <line x1={pOx} y1={pOy + pH + 16} x2={pOx + pW} y2={pOy + pH + 16} stroke="#0f172a" strokeWidth={1} markerEnd="url(#ah)" markerStart="url(#ah2)" />
        <text x={pOx + pW/2} y={pOy + pH + 28} textAnchor="middle" fontSize={9} fill="#0f172a" fontFamily="monospace" fontWeight={700}>{P} cm</text>
        {/* Flèche hauteur */}
        <line x1={pOx - 16} y1={pOy} x2={pOx - 16} y2={pOy + pH} stroke="#0f172a" strokeWidth={1} markerEnd="url(#ah)" markerStart="url(#ah2)" />
        <text x={pOx - 28} y={pOy + pH/2} textAnchor="middle" fontSize={9} fill="#0f172a" fontFamily="monospace" fontWeight={700} transform={`rotate(-90,${pOx-28},${pOy + pH/2})`}>{H} cm</text>
        {/* Cote profondeur assise */}
        <line x1={pOx + pDos} y1={pOy + pH - pPied - pHas - 10} x2={pOx + pDos + pAs} y2={pOy + pH - pPied - pHas - 10} stroke="#C4714F" strokeWidth={1} strokeDasharray="3,2" markerEnd="url(#ah)" markerStart="url(#ah2)" />
        <text x={pOx + pDos + pAs/2} y={pOy + pH - pPied - pHas - 16} textAnchor="middle" fontSize={8} fill="#C4714F" fontFamily="monospace">{pA}cm</text>

        {/* ───── VUE DESSUS ───── */}
        <text x={dOx} y={dOy - 6} fontSize={10} fontWeight={700} fill="#475569" fontFamily="sans-serif">VUE DE DESSUS</text>

        {/* Dossier */}
        <rect x={dOx + dAcc} y={dOy} width={dW - 2*dAcc} height={dDos} fill="#93c5fd" stroke="#3b82f6" strokeWidth={1.5} />
        {/* Assise */}
        <rect x={dOx + dAcc} y={dOy + dDos} width={dW - 2*dAcc} height={dH - dDos} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />
        {/* Accoudoir gauche */}
        <rect x={dOx} y={dOy} width={dAcc} height={dH} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />
        {/* Accoudoir droit */}
        <rect x={dOx + dW - dAcc} y={dOy} width={dAcc} height={dH} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} />

        {/* Flèche largeur */}
        <line x1={dOx} y1={dOy + dH + 16} x2={dOx + dW} y2={dOy + dH + 16} stroke="#0f172a" strokeWidth={1} markerEnd="url(#ah)" markerStart="url(#ah2)" />
        <text x={dOx + dW/2} y={dOy + dH + 28} textAnchor="middle" fontSize={9} fill="#0f172a" fontFamily="monospace" fontWeight={700}>{L} cm</text>
        {/* Flèche profondeur */}
        <line x1={dOx - 16} y1={dOy} x2={dOx - 16} y2={dOy + dH} stroke="#0f172a" strokeWidth={1} markerEnd="url(#ah)" markerStart="url(#ah2)" />
        <text x={dOx - 28} y={dOy + dH/2} textAnchor="middle" fontSize={9} fill="#0f172a" fontFamily="monospace" fontWeight={700} transform={`rotate(-90,${dOx-28},${dOy + dH/2})`}>{P} cm</text>

        {/* Indicateur Nord (haut = face avant) */}
        <text x={dOx + dW/2} y={dOy - 6} textAnchor="middle" fontSize={8} fill="#94a3b8" fontFamily="sans-serif">← avant →</text>

      </svg>
      <div style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
        Schéma généré automatiquement · cotes en centimètres · non contractuel
      </div>
    </div>
  )
}

// ─── CANVAS CROQUIS MAIN ─────────────────────────────────────────
function CanvasCroquis({ height = 160 }) {
  const ref = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f172a'
  }, [])

  const pos = (e, c) => {
    const r = c.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return { x: src.clientX - r.left, y: src.clientY - r.top }
  }

  const down = useCallback(e => {
    const c = ref.current; if (!c) return
    e.preventDefault()
    drawing.current = true
    last.current = pos(e, c)
    const ctx = c.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
  }, [])

  const move = useCallback(e => {
    if (!drawing.current) return
    const c = ref.current; if (!c) return
    e.preventDefault()
    const ctx = c.getContext('2d')
    const p = pos(e, c)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }, [])

  const up = useCallback(() => { drawing.current = false }, [])

  const clear = () => {
    const c = ref.current; if (!c) return
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={ref}
        width={560} height={height}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        style={{ width: '100%', height, border: '1px dashed #94a3b8', borderRadius: 6, cursor: 'crosshair', touchAction: 'none', background: '#fafafa', display: 'block' }}
      />
      <button onClick={clear} className="no-print" style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,.85)', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Effacer</button>
      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>✏️ Dessiner à main levée (doigt ou stylet)</div>
    </div>
  )
}

// ─── UPLOAD PHOTO TISSU ──────────────────────────────────────────
function PhotoTissu() {
  const [photos, setPhotos] = useState([])
  const inp = useRef(null)

  const onFile = e => {
    const files = Array.from(e.target.files || [])
    files.forEach(f => {
      const r = new FileReader()
      r.onload = ev => setPhotos(prev => [...prev, ev.target.result])
      r.readAsDataURL(f)
    })
    e.target.value = ''
  }

  const drop = e => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    files.forEach(f => {
      const r = new FileReader()
      r.onload = ev => setPhotos(prev => [...prev, ev.target.result])
      r.readAsDataURL(f)
    })
  }

  return (
    <div>
      <div
        onDrop={drop} onDragOver={e => e.preventDefault()}
        onClick={() => inp.current?.click()}
        style={{ border: '2px dashed #cbd5e1', borderRadius: 8, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', marginBottom: 8 }}
      >
        <div style={{ fontSize: 22 }}>🧵</div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Cliquer ou glisser une photo de tissu / cuir</div>
        <input ref={inp} type="file" accept="image/*" multiple onChange={onFile} style={{ display: 'none' }} />
      </div>
      {photos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {photos.map((src, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
              <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} className="no-print"
                style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
  const { arts, orders, stepProgress, mats, quals, modelPhotos } = useApp()
  const art = arts[artId]
  if (!art) return null

  // Photo : CreaJit en priorité, sinon photo déposée à la main pour ce modèle
  const photoUrl = art.photo || modelPhotos[(art.nom || '').trim().toUpperCase()] || ''

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
            <div style={S.head}>Article · صورة المنتج</div>
            <div style={{ ...S.body, padding: 0 }}>
              {/* Photo produit réelle — grande et centrale */}
              {photoUrl
                ? <img src={photoUrl} alt={art.nom}
                    style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', borderBottom: '1px solid #e2e8f0' }}
                  />
                : <div style={{ height: 110, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 42 }}>{at.e}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>Ajouter la photo dans le Catalogue</span>
                  </div>
              }
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(art.nom)}</div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{at.e} Atelier {at.n}</div>
                {wf && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{wf.icon} {wf.nom}</div>}
                {art.dim && <div style={{ fontSize: 11, color: '#C4714F', marginTop: 3, fontFamily: 'monospace' }}>{art.dim}</div>}
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

        {/* SCHÉMA COTÉ — 3 VUES AUTOMATIQUES */}
        <div style={S.section}>
          <div style={S.head}>📐 Schéma coté — 3 vues · الرسم التقني</div>
          <div style={S.body}>
            <SchemaCote f={f} />
          </div>
        </div>

        {/* CROQUIS + PHOTO TISSU côte à côte */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ ...S.section, flex: 2, marginBottom: 0 }}>
            <div style={S.head}>✏️ Croquis à main levée · رسم يدوي</div>
            <div style={S.body}>
              <CanvasCroquis height={150} />
            </div>
          </div>
          <div style={{ ...S.section, flex: 1, marginBottom: 0 }}>
            <div style={S.head}>🧵 Photo tissu / cuir · صورة القماش</div>
            <div style={S.body}>
              <PhotoTissu />
            </div>
          </div>
        </div>

        {/* Photo schéma mesuré si uploadée */}
        {f.ficheMesureUrl && (
          <div style={S.section}>
            <div style={S.head}>📎 Fiche mesures jointe</div>
            <div style={S.body}>
              <img src={f.ficheMesureUrl} alt="schéma" style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 6, border: '1px solid #cbd5e1' }} />
            </div>
          </div>
        )}

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
