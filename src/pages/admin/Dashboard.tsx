import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase.ts";
import { collection, getDocs } from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { 
  Bug, Package, MapPin, Users, 
  BarChart3, ShieldCheck, Database, Globe, RefreshCcw,
  BoxesIcon 
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    maladies: 0,
    produits: 0,
    distributeurs: 0,
    stockItems: 0, // Nouvelle statistique
    usersAll: 0,
    usersAdmin: 0,
    usersStaff: 0,
    usersFarmers: 0
  });

  const [productFamilies, setProductFamilies] = useState<any[]>([]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("--- Synchronisation Dashboard AgroExpert ---");

      // Ajout de getDocs pour la collection "stocks" (ou le nom exact en base)
      const [snapDis, snapProd, snapDist, snapUsers, snapStock] = await Promise.all([
        getDocs(collection(db, "diseases")),
        getDocs(collection(db, "products")),
        getDocs(collection(db, "distributors")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "stocks")) 
      ]);

      const usersList = snapUsers.docs.map(d => d.data());
      const admins = usersList.filter(u => u.role === "admin").length;
      const staff = usersList.filter(u => u.role === "conseiller").length;

      const families: Record<string, number> = {};
      snapProd.docs.forEach(doc => {
        const p = doc.data();
        const cat = p.Taper || p.category || p.type || "Non classé"; 
        families[cat] = (families[cat] || 0) + 1;
      });

      const colors = [
        "#0f766e", "#3b82f6", "#f43f5e", "#f59e0b", "#8b5cf6", 
        "#10b981", "#6366f1", "#ec4899", "#f97316", "#14b8a6"
      ];

      const formattedFamilies = Object.keys(families).map((name, i) => ({
        name,
        value: families[name],
        color: colors[i % colors.length]
      }));

      setStats({
        maladies: snapDis.size,
        produits: snapProd.size,
        distributeurs: snapDist.size,
        stockItems: snapStock.size, // Mise à jour de la valeur
        usersAll: snapUsers.size,
        usersAdmin: admins,
        usersStaff: staff,
        usersFarmers: snapUsers.size - (admins + staff)
      });

      setProductFamilies(formattedFamilies);

    } catch (error: any) {
      console.error("Erreur Dashboard :", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const userChartData = [
    { name: "Administrateurs", value: stats.usersAdmin, color: "#0f766e" },
    { name: "Conseillers", value: stats.usersStaff, color: "#2dd4bf" },
    { name: "Agriculteurs", value: stats.usersFarmers, color: "#94a3b8" },
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.mainTitle}>Tableau de bord AgroExpert</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Analyse globale de l'activité Callivoire</p>
        </div>
        <button onClick={refreshData} style={styles.refreshBtn}>
          <RefreshCcw size={16} style={{ animation: loading ? 'spin 2s linear infinite' : 'none' }} />
          {loading ? "Chargement..." : `Sync : ${new Date().toLocaleTimeString()}`}
        </button>
      </header>

      {/* KPI GRID - Avec ajout du bouton Stock */}
      <section style={styles.kpiGrid}>
        <StatCard title="Maladies" value={stats.maladies} icon={<Bug />} color="#ef4444" onClick={() => navigate("/admin/diseases")} />
        <StatCard title="Produits" value={stats.produits} icon={<Package />} color="#3b82f6" onClick={() => navigate("/admin/products")} />
        <StatCard title="Stock" value={stats.stockItems} icon={<BoxesIcon />} color="#8b5cf6" onClick={() => navigate("/admin/stock")} />
        <StatCard title="Distributeurs" value={stats.distributeurs} icon={<MapPin />} color="#f59e0b" onClick={() => navigate("/admin/distributors")} />
        <StatCard title="Utilisateurs" value={stats.usersAll} icon={<Users />} color="#10b981" onClick={() => navigate("/admin/users")} />
      </section>

      <section style={styles.topChartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}><Users size={18} /> Répartition des Utilisateurs</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={userChartData} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                  {userChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.statusCard}>
          <h3 style={styles.chartTitle}><ShieldCheck size={18} /> État des Services</h3>
          <div style={styles.statusList}>
            <StatusRow icon={<Database size={16}/>} label="Firestore (agroexpert)" value={loading ? "Maj..." : "Connecté"} color="#10b981" />
            <StatusRow icon={<Globe size={16}/>} label="Cloudinary" value="Opérationnel" color="#10b981" />
            <div style={styles.uptimeNote}>
              Total des fiches indexées : <strong>{stats.maladies + stats.produits + stats.stockItems}</strong>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.bottomChartFull}>
        <div style={styles.chartCard}>
          <div style={styles.cardHeaderFlex}>
            <h3 style={styles.chartTitle}><BarChart3 size={18} /> Répartition par Famille de Produits</h3>
            <span style={styles.infoText}>{stats.produits} produits enregistrés</span>
          </div>
          <div style={{ height: 350 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={productFamilies.length > 0 ? productFamilies : [{name: 'En attente', value: 1, color: '#f1f5f9'}]} 
                  innerRadius={80} 
                  outerRadius={110} 
                  dataKey="value"
                  paddingAngle={2}
                >
                  {productFamilies.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: "20px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const StatCard = ({ title, value, icon, color, onClick }: any) => (
  <div 
    style={{ ...styles.card, borderTop: `4px solid ${color}` }} 
    onClick={onClick}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-5px)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
  >
    <div style={{ color, opacity: 0.8 }}>{icon}</div>
    <div style={styles.cardInfo}>
      <span style={styles.cardLabel}>{title}</span>
      <span style={styles.cardValue}>{value}</span>
    </div>
  </div>
);

const StatusRow = ({ icon, label, value, color }: any) => (
  <div style={styles.statusRow}>
    <div style={styles.statusLabelGroup}>{icon} <span>{label}</span></div>
    <span style={{ color, fontWeight: 'bold', fontSize: '12px' }}>{value}</span>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "30px", background: "#f8fafc", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  mainTitle: { margin: 0, fontSize: "24px", color: "#1e293b", fontWeight: 'bold' },
  refreshBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#fff", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", color: "#64748b", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "none", cursor: "pointer" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginBottom: "30px" },
  card: { background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "15px", cursor: "pointer", transition: "all 0.3s ease" },
  cardInfo: { display: "flex", flexDirection: "column" },
  cardLabel: { fontSize: "11px", color: "#94a3b8", fontWeight: '600', textTransform: 'uppercase' },
  cardValue: { fontSize: "28px", fontWeight: "900", color: "#1e293b" },
  topChartsGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px", marginBottom: "25px" },
  bottomChartFull: { width: "100%" },
  chartCard: { background: "#fff", padding: "25px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" },
  cardHeaderFlex: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  chartTitle: { fontSize: "15px", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontWeight: '700' },
  infoText: { fontSize: "13px", color: "#94a3b8" },
  statusCard: { background: "#fff", padding: "25px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" },
  statusList: { display: "flex", flexDirection: "column", gap: "15px" },
  statusRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" },
  statusLabelGroup: { display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#475569" },
  uptimeNote: { marginTop: "20px", fontSize: "11px", color: "#94a3b8", textAlign: "center" }
};