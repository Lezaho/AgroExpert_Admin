import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { 
  Bug, Package, MapPin, Users, RefreshCcw, 
  Calculator, Link2, Layers
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ maladies: 0, produits: 0, distributeurs: 0, usersAll: 0 });
  const [productFamilies, setProductFamilies] = useState<any[]>([]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [snapDis, snapProd, snapDist, snapUsers] = await Promise.all([
        getDocs(collection(db, "diseases")),
        getDocs(collection(db, "products")),
        getDocs(collection(db, "distributors")),
        getDocs(collection(db, "users"))
      ]);

      const families: Record<string, number> = {};
      snapProd.docs.forEach(doc => {
        const cat = doc.data().category || "Général";
        families[cat] = (families[cat] || 0) + 1;
      });

      const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
      setProductFamilies(Object.keys(families).map((name, i) => ({
        name, value: families[name], color: colors[i % colors.length]
      })));

      setStats({
        maladies: snapDis.size, produits: snapProd.size,
        distributeurs: snapDist.size, usersAll: snapUsers.size
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const usageData = [
    { name: "Jan", conseiller: 10, admin: 5 },
    { name: "Fév", conseiller: 25, admin: 12 },
    { name: "Mar", conseiller: 18, admin: 20 },
  ];

  return (
    <div style={{ opacity: loading ? 0.6 : 1, transition: "0.3s" }}>
      <header style={dashStyles.header}>
        <h2 style={dashStyles.title}>Tableau de bord</h2>
        <button onClick={refreshData} style={dashStyles.syncBtn}>
          <RefreshCcw size={14} className={loading ? "spin" : ""} /> Sync
        </button>
      </header>

      {/* ROW 1: ACTIONS RAPIDES */}
      <section style={dashStyles.grid4}>
        <QuickCard icon={<Layers color="#064e3b"/>} label="Pathologies" onClick={() => navigate("/admin/diseases")} />
        <QuickCard icon={<Bug color="#064e3b"/>} label="Catalogue Produit" onClick={() => navigate("/admin/products")} />
        <QuickCard icon={<Link2 color="#064e3b"/>} label="Distribution" onClick={() => navigate("/admin/distributors")} />
        <QuickCard icon={<Calculator color="#064e3b"/>} label="Inventaire" onClick={() => navigate("/admin/stock")} />
      </section>

      {/* ROW 2: CARTES KPI */}
      <section style={dashStyles.grid4}>
        <KPICard label="PRODUITS" value={stats.produits} icon={<Package color="#3b82f6"/>} />
        <KPICard label="MALADIES" value={stats.maladies} icon={<Bug color="#ef4444"/>} />
        <KPICard label="UTILISATEURS" value={stats.usersAll} icon={<Users color="#10b981"/>} />
        <KPICard label="POINTS DE VENTE" value={stats.distributeurs} icon={<MapPin color="#f59e0b"/>} />
      </section>

      {/* ROW 3: GRAPHIQUES */}
      <div style={dashStyles.chartsLayout}>
        <div style={dashStyles.chartCardMain}>
          <div style={dashStyles.chartHeader}>
            <h3 style={dashStyles.chartTitle}>Utilisation</h3>
            <span style={dashStyles.redText}>6 mois :</span>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Bar dataKey="conseiller" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="admin" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={dashStyles.chartCardSide}>
          <div style={{ height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={productFamilies} innerRadius={60} outerRadius={80} dataKey="value">
                  {productFamilies.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Composants de style réutilisables
const QuickCard = ({ icon, label, onClick }: any) => (
  <div style={dashStyles.quickCard} onClick={onClick}>
    <div style={dashStyles.quickIcon}>{icon}</div>
    <span style={dashStyles.quickLabel}>{label}</span>
  </div>
);

const KPICard = ({ label, value, icon }: any) => (
  <div style={dashStyles.kpiCard}>
    <div>
      <div style={dashStyles.kpiLabel}>{label}</div>
      <div style={dashStyles.kpiValue}>{value}</div>
    </div>
    <div style={dashStyles.kpiIconBox}>{icon}</div>
  </div>
);

const dashStyles: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title: { fontSize: "24px", fontWeight: "800", color: "#064e3b", margin: 0 },
  syncBtn: { background: "#fff", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#64748b" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "25px" },
  quickCard: { background: "#fff", padding: "20px", borderRadius: "16px", textAlign: "center", border: "1px solid #f1f5f9", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
  quickIcon: { marginBottom: "5px" },
  quickLabel: { fontSize: "13px", fontWeight: "700", color: "#1e293b" },
  kpiCard: { background: "#fff", padding: "20px", borderRadius: "16px", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" },
  kpiLabel: { fontSize: "10px", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.5px" },
  kpiValue: { fontSize: "32px", fontWeight: "900", color: "#1e293b" },
  kpiIconBox: { width: "40px", height: "40px", background: "#f8fafc", borderRadius: "10px", display: "grid", placeItems: "center" },
  chartsLayout: { display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "25px" },
  chartCardMain: { background: "#fff", padding: "25px", borderRadius: "20px", border: "1px solid #f1f5f9" },
  chartCardSide: { background: "#fff", padding: "25px", borderRadius: "20px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center" },
  chartHeader: { marginBottom: "15px" },
  chartTitle: { fontSize: "22px", fontWeight: "800", margin: 0 },
  redText: { color: "#ef4444", fontSize: "12px", fontWeight: "700" }
};