import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  ArrowLeft, Calendar, Package, 
  Beaker, ClipboardCheck, Clock
} from "lucide-react";

export default function ItineraryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itin, setItin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItin = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, "cropCycles", id));
      if (docSnap.exists()) setItin(docSnap.data());
      setLoading(false);
    };
    fetchItin();
  }, [id]);

  if (loading) return <div style={styles.loader}>Chargement du protocole...</div>;
  if (!itin) return <div style={styles.loader}>Itinéraire introuvable.</div>;

  // Calcul du nombre total de produits utilisés dans tout l'itinéraire
  const totalProducts = itin.steps?.reduce((acc: number, step: any) => acc + (step.products?.length || 0), 0);

  return (
    <div style={styles.container}>
      {/* HEADER & RÉSUMÉ */}
      <header style={styles.headerSection}>
        <div style={styles.navRow}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}><ArrowLeft size={18} /> Retour</button>
          <h1 style={styles.title}>{itin.cultureName}</h1>
        </div>
        
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}><Calendar size={18} /> <strong>{itin.totalDuration}</strong> jours de cycle</div>
          <div style={styles.summaryItem}><ClipboardCheck size={18} /> <strong>{itin.steps?.length}</strong> étapes clés</div>
          <div style={styles.summaryItem}><Package size={18} /> <strong>{totalProducts}</strong> intrants prévus</div>
        </div>
      </header>

      {/* ZONE DE LA FLÈCHE HORIZONTALE */}
      <div style={styles.scrollWrapper}>
        <div style={styles.timelineArea}>
          
          {/* La Flèche de fond (Ligne de temps) */}
          <div style={styles.arrowLine}>
            <div style={styles.arrowHead}></div>
          </div>

          {itin.steps.map((step: any, index: number) => {
            const isTop = index % 2 === 0;
            return (
              <div key={index} style={styles.stepColumn}>
                
                {/* Point d'ancrage sur la flèche */}
                <div style={styles.anchor}>
                  <div style={styles.dot}><div style={styles.dotInner}></div></div>
                  <div style={styles.dayLabel}>J+{step.startDay}</div>
                </div>

                {/* Carte de détails */}
                <div style={{
                  ...styles.detailCard,
                  bottom: isTop ? "calc(50% + 30px)" : "auto",
                  top: isTop ? "auto" : "calc(50% + 30px)",
                }}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.stepName}>{step.name}</h3>
                  </div>

                  {step.description && (
                    <div style={styles.descBox}>
                      <p style={styles.descText}>{step.description}</p>
                    </div>
                  )}

                  {step.products && step.products.length > 0 && (
                    <div style={styles.productsList}>
                      {step.products.map((p: any, pIdx: number) => (
                        <div key={pIdx} style={styles.productBadge}>
                          <Beaker size={12} />
                          <span style={styles.pName}>{p.name}</span>
                          <span style={styles.pQty}>{p.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Petit connecteur visuel (ligne verticale) */}
                  <div style={{
                    ...styles.verticalLink,
                    [isTop ? 'bottom' : 'top']: '-30px',
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.helperText}>
        <Clock size={14} /> Faites défiler horizontalement pour voir toute la saison
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "30px", minHeight: "100vh", background: "#f8fafc" },
  headerSection: { marginBottom: "40px" },
  navRow: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" },
  backBtn: { background: "#fff", border: "1px solid #e2e8f0", padding: "8px 15px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontWeight: "600" },
  title: { fontSize: "32px", fontWeight: "900", color: "#064e3b", margin: 0 },
  
  summaryBar: { display: "flex", gap: "30px", background: "#fff", padding: "15px 25px", borderRadius: "15px", border: "1px solid #e2e8f0", width: "fit-content" },
  summaryItem: { display: "flex", alignItems: "center", gap: "10px", color: "#475569", fontSize: "14px" },

  scrollWrapper: { 
    overflowX: "auto", 
    padding: "250px 50px", // Grand padding pour laisser de la place aux cartes haut/bas
    background: "#fff", 
    borderRadius: "30px", 
    border: "1px solid #e2e8f0",
    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)"
  },
  
  timelineArea: { display: "flex", position: "relative", minWidth: "max-content", alignItems: "center", height: "40px" },
  
  arrowLine: { position: "absolute", left: 0, right: 60, height: "10px", background: "linear-gradient(to right, #10b981, #064e3b)", borderRadius: "10px" },
  arrowHead: { position: "absolute", right: "-20px", top: "-10px", width: 0, height: 0, borderTop: "15px solid transparent", borderBottom: "15px solid transparent", borderLeft: "25px solid #064e3b" },

  stepColumn: { width: "320px", position: "relative", display: "flex", justifyContent: "center" },
  
  anchor: { zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" },
  dot: { width: "26px", height: "26px", background: "#fff", border: "5px solid #10b981", borderRadius: "50%", display: "grid", placeItems: "center" },
  dotInner: { width: "8px", height: "8px", background: "#064e3b", borderRadius: "50%" },
  dayLabel: { position: "absolute", top: "35px", fontWeight: "900", color: "#064e3b", fontSize: "14px", background: "#ecfdf5", padding: "2px 8px", borderRadius: "6px" },

  detailCard: { 
    position: "absolute", 
    width: "280px", 
    background: "#fff", 
    borderRadius: "20px", 
    padding: "18px", 
    boxShadow: "0 15px 25px -5px rgba(0,0,0,0.08)", 
    border: "1px solid #f1f5f9" 
  },
  
  stepName: { fontSize: "17px", fontWeight: "800", color: "#1e293b", margin: "0 0 10px 0" },
  descBox: { marginBottom: "12px", borderLeft: "3px solid #e2e8f0", paddingLeft: "10px" },
  descText: { fontSize: "13px", color: "#64748b", lineHeight: "1.5", margin: 0 },
  
  productsList: { display: "flex", flexDirection: "column", gap: "6px" },
  productBadge: { display: "flex", alignItems: "center", gap: "8px", background: "#f0fdf4", padding: "6px 10px", borderRadius: "8px", border: "1px solid #dcfce7" },
  pName: { fontSize: "12px", fontWeight: "700", color: "#166534", flex: 1 },
  pQty: { fontSize: "11px", fontWeight: "900", color: "#059669" },

  verticalLink: { position: "absolute", left: "50%", width: "2px", height: "30px", background: "#10b981", opacity: 0.4 },
  helperText: { textAlign: "center", marginTop: "20px", color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  loader: { textAlign: "center", padding: "100px", color: "#64748b", fontWeight: "600" }
};