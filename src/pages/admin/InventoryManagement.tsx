import { useEffect, useState, useCallback } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { 
  CheckCircle2, Truck, Package, FileText, 
  AlertTriangle, Search, RefreshCcw, 
  ArrowDownCircle, ArrowUpCircle, Plus // Ajout de l'icône Plus
} from "lucide-react";

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- RÉCUPÉRATION DES DONNÉES ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [snapStock, snapMove] = await Promise.all([
        getDocs(collection(db, "stocks")),
        getDocs(query(collection(db, "movements"), orderBy("date", "desc"), limit(30)))
      ]);
      setInventory(snapStock.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setMovements(snapMove.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error("Erreur Firebase:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- LOGIQUE DE CALCUL & FILTRE ---
  const stats = {
    qtyHand: inventory.reduce((acc, curr) => acc + (Number(curr.stockInitial) || 0), 0),
    lowStock: inventory.filter(item => Number(item.stockInitial) <= Number(item.seuil)).length,
    allItems: inventory.length
  };

  const filteredInventory = inventory.filter(item => 
    item.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const entrees = movements.filter(m => m.type === "ENTREE");
  const sorties = movements.filter(m => m.type === "SORTIE");

  return (
    <div style={styles.container}>

      {/* --- HEADER AVEC BOUTON D'AJOUT --- */}
      <div style={styles.headerRow}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Inventaire</h2>
        <button style={styles.addBtn} onClick={() => alert("Ouvrir le formulaire d'ajout")}>
          <Plus size={18} /> Nouveau Produit
        </button>
      </div>
      
      {/* --- SECTION 1 : ACTIVITÉ & RÉSUMÉ (STYLE ZOHO) --- */}
      <div style={styles.topSection}>
        <div style={styles.activityCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.sectionTitle}>Activité des ventes <span style={styles.unitText}>(en quantité)</span></h3>
            <button onClick={fetchData} style={styles.refreshBtn}>
              <RefreshCcw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
          <div style={styles.kpiRow}>
            <ActivityBox count={29} label="CONFIRMÉ" color="#3b82f6" icon={<CheckCircle2 size={14}/>} />
            <ActivityBox count={35} label="À EXPÉDIER" color="#ef4444" icon={<Package size={14}/>} />
            <ActivityBox count={17} label="À LIVRER" color="#10b981" icon={<Truck size={14}/>} />
            <ActivityBox count={24} label="À FACTURER" color="#f59e0b" icon={<FileText size={14}/>} />
          </div>
        </div>

        <div style={styles.summaryCard}>
          <h3 style={styles.sectionTitle}>Résumé de l'inventaire</h3>
          <div style={styles.summaryRow}><span>QUANTITÉ EN MAIN</span><strong>{stats.qtyHand}</strong></div>
          <div style={styles.summaryRow}><span>STOCK FAIBLE</span><strong style={{color:'#ef4444'}}>{stats.lowStock}</strong></div>
        </div>
      </div>

      {/* --- SECTION 2 : ANALYSE CATALOGUE --- */}
      <div style={styles.middleSection}>
        <div style={styles.detailsCard}>
          <h3 style={styles.sectionTitle}>Analyse du catalogue</h3>
          <div style={styles.detailsContent}>
            <div style={styles.detailsText}>
              <div style={styles.detailItem}><span>Articles actifs</span><strong>{stats.allItems}</strong></div>
              <div style={styles.detailItem}><span>Variantes</span><strong>{stats.allItems * 2}</strong></div>
            </div>
            <div style={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={[{v: 65}, {v: 35}]} innerRadius={30} outerRadius={45} dataKey="v" startAngle={90} endAngle={450}>
                    <Cell fill="#10b981" /><Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.chartLabel}>65%</div>
            </div>
          </div>
        </div>
        <div style={styles.infoCard}>
           <h3 style={styles.sectionTitle}>État Global</h3>
           <p style={{fontSize: 12, color: '#94a3b8', marginTop: 15}}>Dernière synchro : {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* --- SECTION 3 : LISTE DES PRODUITS EN STOCK --- */}
      <section style={styles.listSection}>
        <div style={styles.listHeader}>
          <h3 style={styles.sectionTitle}>Inventaire Actuel</h3>
          <div style={styles.searchBar}>
            <Search size={14} color="#94a3b8" />
            <input type="text" placeholder="Rechercher..." style={styles.searchInput} onChange={(e)=>setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr><th>NOM</th><th>REF</th><th>CATÉGORIE</th><th>STOCK</th><th>PRIX U.</th><th>TOTAL</th></tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{item.designation}</td>
                  <td style={styles.td}><span style={styles.refBadge}>{item.reference}</span></td>
                  <td style={styles.td}>{item.categorie}</td>
                  <td style={styles.td}>
                    {item.stockInitial} {Number(item.stockInitial) <= Number(item.seuil) && <AlertTriangle size={14} color="#ef4444" />}
                  </td>
                  <td style={styles.td}>{item.prixUnitaire?.toLocaleString()} €</td>
                  <td style={{...styles.td, fontWeight: '600'}}>{item.total?.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- SECTION 4 : LISTE DES ENTRÉES (BLEU) --- */}
      <section style={{...styles.listSection, borderTop: '4px solid #4f46e5'}}>
        <h3 style={{...styles.sectionTitle, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 20}}>
          <ArrowDownCircle size={18} /> Liste des entrées :
        </h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={{...styles.thead, background: '#f5f3ff'}}>
              <tr><th>DATE</th><th>RÉFÉRENCE</th><th>DÉSIGNATION</th><th>QTÉ</th><th>COÛT D'ACHAT</th><th>TOTAL</th></tr>
            </thead>
            <tbody>
              {entrees.map(m => (
                <tr key={m.id} style={styles.tr}>
                  <td style={styles.td}>{m.date?.toDate().toLocaleDateString()}</td>
                  <td style={styles.td}>{m.reference || "-"}</td>
                  <td style={styles.td}>{inventory.find(p => p.productId === m.productId)?.designation || "Produit"}</td>
                  <td style={{...styles.td, color: '#10b981', fontWeight: 'bold'}}>+ {m.quantity}</td>
                  <td style={styles.td}>{m.prixUnitaire?.toLocaleString()} €</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>{(m.quantity * m.prixUnitaire)?.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- SECTION 5 : LISTE DES SORTIES (ROUGE) --- */}
      <section style={{...styles.listSection, borderTop: '4px solid #ef4444'}}>
        <h3 style={{...styles.sectionTitle, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 20}}>
          <ArrowUpCircle size={18} /> Liste des sorties :
        </h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={{...styles.thead, background: '#fef2f2'}}>
              <tr><th>DATE</th><th>RÉFÉRENCE</th><th>DÉSIGNATION</th><th>QTÉ</th><th>PRIX DE VENTE</th><th>TOTAL</th></tr>
            </thead>
            <tbody>
              {sorties.map(m => (
                <tr key={m.id} style={styles.tr}>
                  <td style={styles.td}>{m.date?.toDate().toLocaleDateString()}</td>
                  <td style={styles.td}>{m.reference || "-"}</td>
                  <td style={styles.td}>{inventory.find(p => p.productId === m.productId)?.designation || "Produit"}</td>
                  <td style={{...styles.td, color: '#ef4444', fontWeight: 'bold'}}>- {m.quantity}</td>
                  <td style={styles.td}>{m.prixUnitaire?.toLocaleString()} €</td>
                  <td style={{...styles.td, fontWeight: 'bold'}}>{(m.quantity * m.prixUnitaire)?.toLocaleString()} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`.spin { animation: rotate 2s linear infinite; } @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---
const ActivityBox = ({ count, label, color, icon }: any) => (
  <div style={styles.kpiBox}><div style={{...styles.kpiCount, color}}>{count}</div><div style={styles.kpiLabel}>{icon} {label}</div></div>
);

// --- STYLES ---
const styles: Record<string, React.CSSProperties> = {
  container: { padding: "30px", background: "#fcfcfd", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  addBtn: { background: "#4f46e5", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" },
  topSection: { display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: "20px", marginBottom: "20px" },
  activityCard: { background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eef2f6" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  refreshBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer" },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "15px" },
  kpiBox: { textAlign: "center", padding: "15px", border: "1px solid #f1f5f9", borderRadius: "8px" },
  kpiCount: { fontSize: "24px", fontWeight: "400", marginBottom: "5px" },
  kpiLabel: { fontSize: "9px", color: "#94a3b8", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" },
  summaryCard: { background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eef2f6" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f8fafc", fontSize: "11px", color: "#64748b" },
  middleSection: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" },
  sectionTitle: { fontSize: "13px", color: "#64748b", fontWeight: "600", margin: 0 },
  detailsCard: { background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eef2f6" },
  detailsContent: { display: "flex", alignItems: "center", marginTop: "15px" },
  detailsText: { flex: 1, display: "flex", flexDirection: "column", gap: "12px" },
  detailItem: { display: "flex", justifyContent: "space-between", fontSize: "13px" },
  chartWrapper: { position: "relative", width: "100px" },
  chartLabel: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "12px", fontWeight: "bold" },
  infoCard: { background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eef2f6", textAlign: "center", display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  listSection: { background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #eef2f6", marginTop: "20px" },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  searchBar: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" },
  searchInput: { border: "none", background: "transparent", outline: "none", fontSize: "13px", width: "200px" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { textAlign: "left", fontSize: "11px", color: "#94a3b8" },
  th: { padding: "12px 15px", fontWeight: "600" },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "15px", fontSize: "13px", color: "#475569" },
  refBadge: { background: "#eff6ff", color: "#3b82f6", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }
};