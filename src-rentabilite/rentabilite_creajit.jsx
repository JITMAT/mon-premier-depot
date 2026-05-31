import { useState, useEffect, useCallback } from "react";

/* ============================================================
   CREAJIT — Rentabilité & Coût de revient
   ------------------------------------------------------------
   PRINCIPE DE CALCUL (corrigé) :
   - Coût total atelier/mois = (salaires atelier / salaires totaux) × charges totales
     -> chaque atelier "absorbe" sa quote-part de TOUTES les charges fixes
        (loyer, CNSS, leasing, électricité...) au prorata de ses salaires.
   - Coût horaire CHARGÉ = coût total atelier / (nb ouvriers × heures productives/mois)
     -> c'est ce nombre (~50-60 DH/h, PAS 454) qu'on utilise pour chiffrer un produit.
   - Coût de revient produit = Σ(heures par atelier × coût horaire chargé)
                               + matières premières + transport + commission.
   ============================================================ */

const CHARGES_FIXES = {
  salaires:        { label: "Masse salariale ateliers", icon: "👷", default: 202800 },
  loyer:           { label: "Loyer atelier/usine",       icon: "🏠", default: 90000 },
  cnss:            { label: "CNSS",                       icon: "🏦", default: 20000 },
  leasing_machine: { label: "Leasing machine",           icon: "⚙️", default: 16000 },
  leasing_voiture: { label: "Leasing voiture",           icon: "🚗", default: 15931 },
  electricite:     { label: "Électricité + eau",         icon: "⚡", default: 8000 },
  assurance:       { label: "Assurance + tel + ADSL",    icon: "🛡️", default: 7500 },
};

const ATELIERS_DEFAULT = [
  { id: "tap", nom: "Tapisserie",   emoji: "🧵", ouvriers: 12, salaires: 63800 },
  { id: "men", nom: "Menuiserie",   emoji: "🪵", ouvriers: 10, salaires: 54500 },
  { id: "pei", nom: "Peinture",     emoji: "🎨", ouvriers: 5,  salaires: 25000 },
  { id: "fer", nom: "Ferronnerie",  emoji: "🔧", ouvriers: 4,  salaires: 20500 },
  { id: "cui", nom: "Cuivre",       emoji: "🟡", ouvriers: 1,  salaires: 6000  },
  { id: "pie", nom: "Pierre",       emoji: "🪨", ouvriers: 3,  salaires: 18000 },
  { id: "cnc", nom: "CNC",          emoji: "⚡", ouvriers: 2,  salaires: 10000 },
  { id: "pol", nom: "Polystyrène",  emoji: "💧", ouvriers: 1,  salaires: 5000  },
];

const PRODUIT_EXEMPLE = {
  id: "ex1",
  nom: "Canapé 3 places (exemple)",
  routing: [ { atelierId: "men", heures: 18 }, { atelierId: "tap", heures: 22 } ],
  materials: [
    { nom: "Bois carcasse", cout: 1200 },
    { nom: "Tissu",         cout: 1800 },
    { nom: "Mousse",        cout: 900  },
    { nom: "Accessoires",   cout: 400  },
  ],
  transport: 300,
  commissionPct: 0,
  pv: 9000,
};

const MOIS_LABELS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

const fmt   = (n) => Math.round(n || 0).toLocaleString("fr-FR");
const fmtDH = (n) => fmt(n) + " DH";
const pct   = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

const defaultData = () => {
  const charges = {};
  Object.keys(CHARGES_FIXES).forEach((k) => { charges[k] = CHARGES_FIXES[k].default; });
  return {
    mois: 4, annee: 2026, ca: 309243, charges,
    ateliers: ATELIERS_DEFAULT, heuresProd: 176, jours: 22,
    mp_pct: 20, marge_cible: 15,
  };
};

const uid = () => Math.random().toString(36).slice(2, 9);

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(defaultData());
  const [historique, setHistorique] = useState([]);
  const [produits, setProduits] = useState([PRODUIT_EXEMPLE]);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // éditeur produit
  const [pNom, setPNom] = useState("");
  const [pRouting, setPRouting] = useState([{ atelierId: "tap", heures: 10 }]);
  const [pMaterials, setPMaterials] = useState([{ nom: "", cout: 0 }]);
  const [pTransport, setPTransport] = useState(0);
  const [pCommission, setPCommission] = useState(0);
  const [pPV, setPPV] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const d = await window.storage.get("creajit:rent:v2:data");
        if (d) setData(JSON.parse(d.value));
        const h = await window.storage.get("creajit:rent:v2:historique");
        if (h) setHistorique(JSON.parse(h.value));
        const p = await window.storage.get("creajit:rent:v2:produits");
        if (p) setProduits(JSON.parse(p.value));
      } catch {}
      setLoading(false);
    })();
  }, []);

  // ---------- calculs cœur ----------
  const totalCharges  = Object.values(data.charges).reduce((a, b) => a + Number(b), 0);
  const totalSalaires = data.ateliers.reduce((s, a) => s + Number(a.salaires), 0) || 1;
  const overheadMult  = totalCharges / totalSalaires; // ex : 1.776
  const heuresProd    = Number(data.heuresProd) || 176;

  const coutTotalAtelier = (a) => (Number(a.salaires) / totalSalaires) * totalCharges;
  const thAtelier = (a) => {
    const denom = (Number(a.ouvriers) || 1) * heuresProd;
    return denom > 0 ? coutTotalAtelier(a) / denom : 0;
  };
  const thById = (id) => {
    const a = data.ateliers.find((x) => x.id === id);
    return a ? thAtelier(a) : 0;
  };

  const resultatBrut  = data.ca - totalCharges;
  const objectifCA    = Math.round(totalCharges / (1 - (data.mp_pct + data.marge_cible) / 100));
  const tauxCouv      = pct(data.ca, totalCharges);
  const tauxObj       = pct(data.ca, objectifCA);
  const caJour        = Math.round(objectifCA / (data.jours || 22));
  const thMoyen       = totalCharges / ((data.ateliers.reduce((s, a) => s + Number(a.ouvriers), 0) || 1) * heuresProd);

  // ---------- calcul produit (éditeur) ----------
  const pCoutMO   = pRouting.reduce((s, r) => s + thById(r.atelierId) * Number(r.heures || 0), 0);
  const pCoutMP   = pMaterials.reduce((s, m) => s + Number(m.cout || 0), 0);
  const pCoutDir  = pCoutMO + pCoutMP + Number(pTransport || 0);
  const pComm     = (Number(pCommission) / 100) * Number(pPV || 0);
  const pCoutRev  = pCoutDir + pComm;
  const pMarge    = Number(pPV || 0) - pCoutRev;
  const pTauxM    = pPV > 0 ? (pMarge / pPV) * 100 : 0;
  const denomMarge = 1 - (data.marge_cible + Number(pCommission)) / 100;
  const pPVConseil = denomMarge > 0 ? pCoutDir / denomMarge : 0;

  const save = useCallback(async () => {
    try {
      await window.storage.set("creajit:rent:v2:data", JSON.stringify(data));
      const newHist = [
        ...historique.filter((h) => !(h.mois === data.mois && h.annee === data.annee)),
        { mois: data.mois, annee: data.annee, ca: data.ca, charges: data.charges, mp_pct: data.mp_pct, marge_cible: data.marge_cible },
      ].sort((a, b) => (a.annee !== b.annee ? a.annee - b.annee : a.mois - b.mois)).slice(-12);
      setHistorique(newHist);
      await window.storage.set("creajit:rent:v2:historique", JSON.stringify(newHist));
      setSaved(true); setTimeout(() => setSaved(false), 2000); setEditMode(false);
    } catch (e) { console.error(e); }
  }, [data, historique]);

  const saveProduits = useCallback(async (list) => {
    setProduits(list);
    try { await window.storage.set("creajit:rent:v2:produits", JSON.stringify(list)); } catch {}
  }, []);

  const enregistrerProduit = () => {
    const prod = {
      id: uid(), nom: pNom || "Produit sans nom",
      routing: pRouting, materials: pMaterials,
      transport: Number(pTransport), commissionPct: Number(pCommission), pv: Number(pPV),
    };
    saveProduits([...produits, prod]);
    setPNom(""); setPRouting([{ atelierId: "tap", heures: 10 }]); setPMaterials([{ nom: "", cout: 0 }]);
    setPTransport(0); setPCommission(0); setPPV(0);
  };

  const chargerProduit = (prod) => {
    setPNom(prod.nom); setPRouting(prod.routing); setPMaterials(prod.materials);
    setPTransport(prod.transport); setPCommission(prod.commissionPct); setPPV(prod.pv);
    setTab("cout");
  };

  const coutRevientProduit = (prod) => {
    const mo = prod.routing.reduce((s, r) => s + thById(r.atelierId) * Number(r.heures || 0), 0);
    const mp = prod.materials.reduce((s, m) => s + Number(m.cout || 0), 0);
    const dir = mo + mp + Number(prod.transport || 0);
    const comm = (Number(prod.commissionPct) / 100) * Number(prod.pv || 0);
    return { mo, mp, dir, rev: dir + comm, marge: Number(prod.pv || 0) - dir - comm };
  };

  const barColor = (v) => (v >= 100 ? "#22c55e" : v >= 80 ? "#eab308" : "#ef4444");

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, fontFamily: "monospace", color: "#888", background: "#0f0f0f" }}>
        Chargement des données CREAJIT…
      </div>
    );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f0f0f", minHeight: "100vh", color: "#e8e0d0" }}>
      {/* Header */}
      <div style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "#c4952a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: ".5px", color: "#f0e8d8" }}>CREAJIT</div>
            <div style={{ fontSize: 11, color: "#666", letterSpacing: "1px", textTransform: "uppercase" }}>Rentabilité & Coût de revient</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#666" }}>{MOIS_LABELS[data.mois]} {data.annee}</span>
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} style={btn("#2a2a2a", "#888")}>Annuler</button>
              <button onClick={save} style={btn(saved ? "#166534" : "#c4952a", saved ? "#fff" : "#0f0f0f", true)}>{saved ? "✓ Enregistré" : "Enregistrer"}</button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} style={btn("#2a2a2a", "#c4952a")}>Modifier les données</button>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", background: "#1a1a1a", borderBottom: "1px solid #2a2a2a", padding: "0 24px", overflowX: "auto" }}>
        {[["dashboard", "📊 Dashboard"], ["cout", "🧮 Coût de revient"], ["catalogue", "📦 Catalogue"], ["historique", "📈 Historique"], ["params", "⚙️ Paramètres"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ background: "none", border: "none", padding: "12px 16px", cursor: "pointer", whiteSpace: "nowrap", color: tab === k ? "#c4952a" : "#666", fontWeight: tab === k ? 600 : 400, fontSize: 13, borderBottom: tab === k ? "2px solid #c4952a" : "2px solid transparent" }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "20px 24px" }}>

        {/* ===================== DASHBOARD ===================== */}
        {tab === "dashboard" && (
          <div>
            {editMode && (
              <div style={{ display: "flex", gap: 12, marginBottom: 20, background: "#1a1a1a", borderRadius: 10, padding: "14px 18px", border: "1px solid #2a2a2a", flexWrap: "wrap" }}>
                <Field label="Mois"><select value={data.mois} onChange={(e) => setData((d) => ({ ...d, mois: +e.target.value }))} style={sel}>{MOIS_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}</select></Field>
                <Field label="Année"><input type="number" value={data.annee} onChange={(e) => setData((d) => ({ ...d, annee: +e.target.value }))} style={{ ...inp, width: 80 }} /></Field>
                <Field label="CA réalisé (DH)"><input type="number" value={data.ca} onChange={(e) => setData((d) => ({ ...d, ca: +e.target.value }))} style={{ ...inp, width: 140 }} /></Field>
                <Field label="Jours ouvrables"><input type="number" value={data.jours} onChange={(e) => setData((d) => ({ ...d, jours: +e.target.value }))} style={{ ...inp, width: 80 }} /></Field>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "CA réalisé", value: fmtDH(data.ca), sub: MOIS_LABELS[data.mois] + " " + data.annee, color: "#e8e0d0" },
                { label: "Charges totales", value: fmtDH(totalCharges), sub: "Charges fixes / mois", color: "#f87171" },
                { label: "Résultat brut", value: (resultatBrut >= 0 ? "+" : "−") + fmtDH(Math.abs(resultatBrut)), sub: "Avant matières", color: resultatBrut >= 0 ? "#4ade80" : "#f87171" },
                { label: "Coût horaire chargé moyen", value: fmt(thMoyen) + " DH/h", sub: "MO + charges absorbées", color: "#c4952a" },
              ].map((c, i) => <KPI key={i} {...c} />)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12, marginBottom: 20 }}>
              <Gauge title="CA vs seuil zéro" value={tauxCouv} sub={"Seuil : " + fmtDH(totalCharges)} color={barColor(tauxCouv)} />
              <Gauge title="CA vs objectif rentable" value={tauxObj} sub={"Objectif : " + fmtDH(objectifCA)} color={barColor(tauxObj)} />
            </div>

            {resultatBrut < 0 && (
              <div style={{ background: "#1f0a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>🔴</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>Déficit de {fmtDH(Math.abs(resultatBrut))} avant matières premières</div>
                  <div style={{ fontSize: 12, color: "#9f3a3a", marginTop: 2 }}>Il manque {fmtDH(objectifCA - data.ca)} pour l'objectif rentable — soit {fmtDH(Math.round((objectifCA - data.ca) / (data.jours || 22)))}/jour de plus.</div>
                </div>
              </div>
            )}

            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
              <div style={hdr}>Coût par atelier — coût horaire chargé (réel)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead><tr style={{ background: "#151515" }}>{["Atelier", "Ouvriers", "Salaires", "Charges absorbées", "Coût total/mois", "DH/heure chargé"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {data.ateliers.map((a) => {
                      const ct = coutTotalAtelier(a);
                      const absorbed = ct - a.salaires;
                      const thr = thAtelier(a);
                      const col = thr >= 60 ? "#fbbf24" : "#4ade80";
                      return (
                        <tr key={a.id} style={{ borderTop: "1px solid #202020" }}>
                          <td style={td}>{a.emoji} {a.nom}</td>
                          <td style={{ ...td, color: "#888" }}>{a.ouvriers}</td>
                          <td style={tdn}>{fmtDH(a.salaires)}</td>
                          <td style={{ ...tdn, color: "#888" }}>{fmtDH(absorbed)}</td>
                          <td style={{ ...tdn, fontWeight: 600 }}>{fmtDH(ct)}</td>
                          <td style={td}><span style={{ background: col + "22", color: col, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{fmt(thr)} DH/h</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "1px solid #333", background: "#151515" }}>
                      <td style={{ ...td, fontWeight: 700, color: "#c4952a" }}>TOTAL</td>
                      <td style={{ ...td, color: "#888" }}>{data.ateliers.reduce((s, a) => s + Number(a.ouvriers), 0)}</td>
                      <td style={{ ...tdn, fontWeight: 700 }}>{fmtDH(totalSalaires)}</td>
                      <td style={{ ...tdn, color: "#888" }}>{fmtDH(totalCharges - totalSalaires)}</td>
                      <td style={{ ...tdn, fontWeight: 700, color: "#f87171" }}>{fmtDH(totalCharges)}</td>
                      <td style={{ ...td, color: "#c4952a", fontWeight: 700 }}>{fmt(thMoyen)} DH/h</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{ padding: "10px 18px", fontSize: 11, color: "#666", borderTop: "1px solid #202020" }}>
                Base : {heuresProd} h productives / ouvrier / mois. Ce coût/heure inclut DÉJÀ la quote-part de toutes les charges fixes (loyer, CNSS, leasing…). C'est ce chiffre — pas un taux gonflé — qu'on applique aux heures d'un produit.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <KPI label="Seuil zéro (charges fixes)" value={fmtDH(totalCharges)} sub="Minimum absolu" color="#c4952a" />
              <KPI label="Objectif rentable" value={fmtDH(objectifCA)} sub={`MP ${data.mp_pct}% + marge ${data.marge_cible}%`} color="#c4952a" />
              <KPI label="CA journalier requis" value={fmtDH(caJour)} sub={`Sur ${data.jours} jours`} color="#c4952a" />
            </div>
          </div>
        )}

        {/* ===================== COÛT DE REVIENT ===================== */}
        {tab === "cout" && (
          <div style={{ maxWidth: 760 }}>
            <div style={{ background: "#12100a", border: "1px solid #4a3a12", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#c9a84a" }}>
              On chiffre les heures RÉELLES passées par un produit dans chaque atelier × le coût horaire chargé (~{fmt(thMoyen)} DH/h). Ce coût absorbe déjà toutes les charges fixes.
            </div>

            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 24 }}>
              <Field label="Nom du produit"><input value={pNom} onChange={(e) => setPNom(e.target.value)} placeholder="Ex : Canapé Marrakech 3 places" style={{ ...inp, width: "100%", marginTop: 4 }} /></Field>

              <div style={{ ...subhdr, marginTop: 22 }}>Main d'œuvre — passage par atelier</div>
              {pRouting.map((r, i) => {
                const thr = thById(r.atelierId);
                return (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <select value={r.atelierId} onChange={(e) => { const c = [...pRouting]; c[i] = { ...c[i], atelierId: e.target.value }; setPRouting(c); }} style={{ ...sel, flex: 1 }}>
                      {data.ateliers.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.nom} — {fmt(thAtelier(a))} DH/h</option>)}
                    </select>
                    <input type="number" value={r.heures} onChange={(e) => { const c = [...pRouting]; c[i] = { ...c[i], heures: +e.target.value }; setPRouting(c); }} style={{ ...inp, width: 70 }} />
                    <span style={{ fontSize: 12, color: "#666", width: 18 }}>h</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#c4952a", width: 90, textAlign: "right" }}>{fmtDH(thr * Number(r.heures || 0))}</span>
                    <button onClick={() => setPRouting(pRouting.filter((_, j) => j !== i))} style={{ ...btn("#2a2a2a", "#888"), padding: "6px 10px" }}>✕</button>
                  </div>
                );
              })}
              <button onClick={() => setPRouting([...pRouting, { atelierId: data.ateliers[0].id, heures: 5 }])} style={{ ...btn("#2a2a2a", "#c4952a"), marginTop: 4 }}>+ Ajouter un atelier</button>

              <div style={{ ...subhdr, marginTop: 22 }}>Matières premières</div>
              {pMaterials.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input value={m.nom} onChange={(e) => { const c = [...pMaterials]; c[i] = { ...c[i], nom: e.target.value }; setPMaterials(c); }} placeholder="Tissu, bois, marbre…" style={{ ...inp, flex: 1 }} />
                  <input type="number" value={m.cout} onChange={(e) => { const c = [...pMaterials]; c[i] = { ...c[i], cout: +e.target.value }; setPMaterials(c); }} style={{ ...inp, width: 100, textAlign: "right" }} />
                  <span style={{ fontSize: 12, color: "#666", width: 18 }}>DH</span>
                  <button onClick={() => setPMaterials(pMaterials.filter((_, j) => j !== i))} style={{ ...btn("#2a2a2a", "#888"), padding: "6px 10px" }}>✕</button>
                </div>
              ))}
              <button onClick={() => setPMaterials([...pMaterials, { nom: "", cout: 0 }])} style={{ ...btn("#2a2a2a", "#c4952a"), marginTop: 4 }}>+ Ajouter une matière</button>

              <div style={{ display: "flex", gap: 16, marginTop: 22, flexWrap: "wrap" }}>
                <Field label="Transport / livraison (DH)"><input type="number" value={pTransport} onChange={(e) => setPTransport(+e.target.value)} style={{ ...inp, width: 120, marginTop: 4 }} /></Field>
                <Field label="Commission commerciale (%)"><input type="number" value={pCommission} onChange={(e) => setPCommission(+e.target.value)} style={{ ...inp, width: 90, marginTop: 4 }} /></Field>
                <Field label="Prix de vente (DH)"><input type="number" value={pPV} onChange={(e) => setPPV(+e.target.value)} style={{ ...inp, width: 130, marginTop: 4 }} /></Field>
              </div>

              {/* résultats */}
              <div style={{ borderTop: "1px solid #2a2a2a", marginTop: 24, paddingTop: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 16 }}>
                  <Mini label="Main d'œuvre" value={fmtDH(pCoutMO)} color="#e8e0d0" />
                  <Mini label="Matières" value={fmtDH(pCoutMP)} color="#e8e0d0" />
                  <Mini label="Coût de revient" value={fmtDH(pCoutRev)} color="#fbbf24" />
                  <Mini label="Marge brute" value={(pMarge >= 0 ? "+" : "−") + fmtDH(Math.abs(pMarge))} color={pMarge >= 0 ? "#4ade80" : "#f87171"} />
                </div>

                <div style={{ background: pTauxM >= data.marge_cible ? "#052e16" : pTauxM >= 0 ? "#1c1007" : "#1f0a0a", border: `1px solid ${pTauxM >= data.marge_cible ? "#166534" : pTauxM >= 0 ? "#854f0b" : "#7f1d1d"}`, borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: pTauxM >= data.marge_cible ? "#4ade80" : pTauxM >= 0 ? "#fbbf24" : "#f87171" }}>
                      {pTauxM < 0 ? "Vendu à perte" : pTauxM < data.marge_cible ? `Marge insuffisante (< ${data.marge_cible}%)` : "Rentable"}
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Coût de revient {fmtDH(pCoutRev)} pour un PV de {fmtDH(pPV)}</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: pTauxM >= data.marge_cible ? "#4ade80" : pTauxM >= 0 ? "#fbbf24" : "#f87171" }}>{pTauxM.toFixed(1)}%</div>
                </div>

                {pPVConseil > 0 && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "#888", padding: "10px 14px", background: "#111", borderRadius: 8 }}>
                    💡 Prix de vente conseillé pour {data.marge_cible}% de marge : <strong style={{ color: "#c4952a" }}>{fmtDH(pPVConseil)}</strong>
                  </div>
                )}

                <button onClick={enregistrerProduit} style={{ ...btn("#c4952a", "#0f0f0f", true), width: "100%", marginTop: 16, padding: 12, fontSize: 14 }}>💾 Enregistrer ce produit au catalogue</button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== CATALOGUE ===================== */}
        {tab === "catalogue" && (
          <div>
            {produits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>Aucun produit. Chiffre-en un dans l'onglet « Coût de revient ».</div>
            ) : (
              <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                    <thead><tr style={{ background: "#151515" }}>{["Produit", "MO", "Matières", "Coût revient", "Prix vente", "Marge", "%", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {produits.map((p) => {
                        const c = coutRevientProduit(p);
                        const t = p.pv > 0 ? (c.marge / p.pv) * 100 : 0;
                        const col = t >= data.marge_cible ? "#4ade80" : t >= 0 ? "#fbbf24" : "#f87171";
                        return (
                          <tr key={p.id} style={{ borderTop: "1px solid #202020" }}>
                            <td style={{ ...td, fontWeight: 600 }}>{p.nom}</td>
                            <td style={{ ...tdn, color: "#888" }}>{fmtDH(c.mo)}</td>
                            <td style={{ ...tdn, color: "#888" }}>{fmtDH(c.mp)}</td>
                            <td style={{ ...tdn, color: "#fbbf24", fontWeight: 600 }}>{fmtDH(c.rev)}</td>
                            <td style={tdn}>{fmtDH(p.pv)}</td>
                            <td style={{ ...tdn, color: col }}>{(c.marge >= 0 ? "+" : "−") + fmtDH(Math.abs(c.marge))}</td>
                            <td style={td}><span style={{ color: col, fontWeight: 700 }}>{t.toFixed(0)}%</span></td>
                            <td style={td}>
                              <button onClick={() => chargerProduit(p)} style={{ ...btn("#2a2a2a", "#c4952a"), padding: "5px 9px", marginRight: 6 }}>Ouvrir</button>
                              <button onClick={() => saveProduits(produits.filter((x) => x.id !== p.id))} style={{ ...btn("#2a2a2a", "#888"), padding: "5px 9px" }}>✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== HISTORIQUE ===================== */}
        {tab === "historique" && (
          <div>
            {historique.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>Aucun historique. Enregistre le mois actuel pour démarrer le suivi.</div>
            ) : (
              <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                    <thead><tr style={{ background: "#151515" }}>{["Mois", "CA", "Charges", "Résultat", "Couverture", "Objectif"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...historique].reverse().map((h, i) => {
                        const tc = Object.values(h.charges).reduce((a, b) => a + Number(b), 0);
                        const res = h.ca - tc, cov = pct(h.ca, tc);
                        const obj = Math.round(tc / (1 - (h.mp_pct + h.marge_cible) / 100));
                        return (
                          <tr key={i} style={{ borderTop: "1px solid #202020" }}>
                            <td style={{ ...td, fontWeight: 600, color: "#c4952a" }}>{MOIS_LABELS[h.mois]} {h.annee}</td>
                            <td style={tdn}>{fmtDH(h.ca)}</td>
                            <td style={{ ...tdn, color: "#888" }}>{fmtDH(tc)}</td>
                            <td style={{ ...tdn, color: res >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>{(res >= 0 ? "+" : "−") + fmtDH(Math.abs(res))}</td>
                            <td style={td}><span style={{ color: barColor(cov), fontWeight: 700 }}>{cov}%</span></td>
                            <td style={{ ...tdn, color: "#666" }}>{fmtDH(obj)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== PARAMÈTRES ===================== */}
        {tab === "params" && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <div style={subhdr}>Charges fixes mensuelles</div>
              {Object.entries(CHARGES_FIXES).map(([k, meta]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f1f1f" }}>
                  <span style={{ fontSize: 13, color: "#aaa" }}>{meta.icon} {meta.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="number" value={data.charges[k]} onChange={(e) => setData((d) => ({ ...d, charges: { ...d.charges, [k]: +e.target.value } }))} style={{ ...inp, width: 110, textAlign: "right" }} />
                    <span style={{ fontSize: 12, color: "#555" }}>DH</span>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontWeight: 700 }}>
                <span style={{ fontSize: 13, color: "#c4952a" }}>Total charges</span>
                <span style={{ fontSize: 15, color: "#f87171" }}>{fmtDH(totalCharges)}</span>
              </div>
            </div>

            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <div style={subhdr}>Ateliers (ouvriers & salaires)</div>
              {data.ateliers.map((a, i) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f1f" }}>
                  <span style={{ flex: 1, fontSize: 13, color: "#aaa" }}>{a.emoji} {a.nom}</span>
                  <input type="number" value={a.ouvriers} onChange={(e) => { const c = [...data.ateliers]; c[i] = { ...c[i], ouvriers: +e.target.value }; setData((d) => ({ ...d, ateliers: c })); }} style={{ ...inp, width: 60, textAlign: "right" }} />
                  <span style={{ fontSize: 11, color: "#555" }}>ouvr.</span>
                  <input type="number" value={a.salaires} onChange={(e) => { const c = [...data.ateliers]; c[i] = { ...c[i], salaires: +e.target.value }; setData((d) => ({ ...d, ateliers: c })); }} style={{ ...inp, width: 90, textAlign: "right" }} />
                  <span style={{ fontSize: 11, color: "#555" }}>DH</span>
                  <span style={{ width: 78, textAlign: "right", fontSize: 12, fontWeight: 600, color: "#c4952a" }}>{fmt(thAtelier(a))} DH/h</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 24 }}>
              <div style={subhdr}>Paramètres de calcul</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Field label="Heures productives / ouvrier / mois"><input type="number" value={data.heuresProd} onChange={(e) => setData((d) => ({ ...d, heuresProd: +e.target.value }))} style={{ ...inp, width: 90, marginTop: 4 }} /></Field>
                <Field label="% Matières premières"><input type="number" value={data.mp_pct} onChange={(e) => setData((d) => ({ ...d, mp_pct: +e.target.value }))} style={{ ...inp, width: 70, marginTop: 4 }} /></Field>
                <Field label="Marge cible (%)"><input type="number" value={data.marge_cible} onChange={(e) => setData((d) => ({ ...d, marge_cible: +e.target.value }))} style={{ ...inp, width: 70, marginTop: 4 }} /></Field>
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#111", borderRadius: 8, fontSize: 12, color: "#666" }}>
                Multiplicateur de charges = charges totales / salaires = <strong style={{ color: "#c4952a" }}>{overheadMult.toFixed(3)}</strong> · Objectif CA = <strong style={{ color: "#c4952a" }}>{fmtDH(objectifCA)}</strong>
              </div>
            </div>

            <button onClick={save} style={{ ...btn("#c4952a", "#0f0f0f", true), width: "100%", marginTop: 16, padding: 14, fontSize: 14 }}>{saved ? "✓ Enregistré" : "Enregistrer les paramètres"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- petits composants ---------- */
function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{sub}</div>
    </div>
  );
}
function Mini({ label, value, color }) {
  return (
    <div style={{ background: "#111", borderRadius: 8, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
function Gauge({ title, value, sub, color }) {
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "#888" }}>{title}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: "#2a2a2a", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: Math.min(value, 100) + "%", background: color, borderRadius: 4, transition: "width .8s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#555" }}><span>0</span><span>{sub}</span></div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

const lbl    = { fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: ".8px", fontWeight: 600 };
const inp    = { background: "#111", border: "1px solid #333", borderRadius: 6, padding: "7px 10px", color: "#e8e0d0", fontSize: 13, outline: "none" };
const sel    = { background: "#111", border: "1px solid #333", borderRadius: 6, padding: "8px 10px", color: "#e8e0d0", fontSize: 13, outline: "none" };
const hdr    = { padding: "14px 18px", borderBottom: "1px solid #2a2a2a", fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "1px" };
const subhdr = { fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 };
const th     = { padding: "10px 16px", textAlign: "left", fontSize: 11, color: "#555", fontWeight: 600, letterSpacing: ".5px" };
const td     = { padding: "12px 16px", fontSize: 13 };
const tdn    = { padding: "12px 16px", fontSize: 13, fontVariantNumeric: "tabular-nums" };
const btn    = (bg, color, filled = false) => ({ background: filled ? bg : "transparent", color: filled ? color : bg, border: `1px solid ${bg}`, borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600 });
