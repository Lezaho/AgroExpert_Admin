import { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase/firebase.ts";
import { 
  collection, getDocs, doc, 
  addDoc, deleteDoc, 
  serverTimestamp} from "firebase/firestore";
import { 
  UserPlus, X, 
  Trash2, TrendingUp} from "lucide-react";
import { 
  AreaChart, Area, XAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null); // Utilisateur dont on voit la courbe
  
  const [formData, setFormData] = useState({ displayName: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  // Simulation de données hebdomadaires réinitialisées le lundi
  // Dans un cas réel, ces données viendraient d'une collection "connections" filtrée par ID
  const generateWeeklyData = (userId: string) => {
    console.log("Chargement stats pour:", userId);
    // Ici on simule des variations selon l'ID pour l'exemple
    const hash = userId.length; 
    return [
      { day: "Lun", connexions: 2 + hash },
      { day: "Mar", connexions: 5 + hash },
      { day: "Mer", connexions: 3 + hash },
      { day: "Jeu", connexions: 8 + hash },
      { day: "Ven", connexions: 12 + hash },
      { day: "Sam", connexions: 0 },
      { day: "Dim", connexions: 0 },
    ];
  };

  const activityData = useMemo(() => {
    return selectedUser ? generateWeeklyData(selectedUser.id) : [];
  }, [selectedUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);
      if (list.length > 0) setSelectedUser(list[0]); // Par défaut, premier de la liste
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "users"), { ...formData, role: "conseiller", createdAt: serverTimestamp() });
      setShowForm(false);
      setFormData({ displayName: "", email: "", password: "" });
      fetchUsers();
    } catch (e) { alert("Erreur"); } finally { setSubmitting(false); }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Supprimer ${name} ?`)) {
      await deleteDoc(doc(db, "users", id));
      fetchUsers();
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion de l'Équipe</h1>
          <p style={styles.subtitle}>Suivi hebdomadaire des conseillers (Reset chaque Lundi)</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowForm(true)}>
          <UserPlus size={18} /> <span>Nouveau conseiller</span>
        </button>
      </header>

      {/* MODALE */}
      {showForm && (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <div style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Créer un accès</h2>
                    <button onClick={() => setShowForm(false)} style={styles.closeBtn}><X /></button>
                </div>
                <form onSubmit={handleAddAdvisor} style={styles.form}>
                    <input style={styles.input} placeholder="Nom complet" required onChange={e => setFormData({...formData, displayName: e.target.value})} />
                    <input style={styles.input} type="email" placeholder="Email" required onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input style={styles.input} type="password" placeholder="Mot de passe" required onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="submit" style={styles.submitBtn} disabled={submitting}>
                        {submitting ? "Création..." : "Enregistrer le conseiller"}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* TABLEAU */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Conseiller</th>
              <th style={styles.th}>Rôle</th>
              <th style={{...styles.th, textAlign: 'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr 
                key={u.id} 
                style={{...styles.tr, background: selectedUser?.id === u.id ? "#f0fdf4" : "transparent"}}
                onClick={() => setSelectedUser(u)}
              >
                <td style={styles.td}>
                  <div style={styles.userCell}>
                    <div style={{...styles.avatar, background: u.role === 'admin' ? '#064e3b' : '#10b981'}}>
                      {u.displayName?.charAt(0) || "U"}
                    </div>
                    <div>
                        <div style={{fontWeight: '700'}}>{u.displayName}</div>
                        <div style={{fontSize: '12px', color: '#64748b'}}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                    <span style={u.role === 'admin' ? styles.badgeAdmin : styles.badgeStaff}>{u.role}</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button onClick={(e) => {e.stopPropagation(); handleDeleteUser(u.id, u.displayName)}} style={styles.deleteBtn}><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* COURBE INDIVIDUELLE */}
      {selectedUser && (
        <div style={styles.chartSection}>
          <div style={styles.chartHeader}>
            <div style={styles.chartTitleGroup}>
                <div style={styles.iconCircle}><TrendingUp size={20} color="#064e3b" /></div>
                <div>
                    <h3 style={styles.chartTitle}>Activité de {selectedUser.displayName}</h3>
                    <p style={styles.chartSubtitle}>Connexions cette semaine (Lundi - Dimanche)</p>
                </div>
            </div>
            <div style={styles.weekBadge}>Semaine en cours</div>
          </div>

          <div style={{ height: 280, width: '100%', marginTop: 20 }}>
            <ResponsiveContainer>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.05)'}} />
                <Area type="monotone" dataKey="connexions" stroke="#10b981" strokeWidth={4} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "0px" },
  header: { marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { margin: 0, color: "#064e3b", fontSize: "24px", fontWeight: "900" },
  subtitle: { color: "#94a3b8", margin: 0, fontSize: "14px" },
  addBtn: { background: "#064e3b", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "600" },
  
  tableCard: { background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "30px" },
  table: { width: "100%", borderCollapse: "collapse", cursor: "pointer" },
  thead: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "18px 20px", fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", textAlign: 'left' },
  tr: { borderBottom: "1px solid #f8fafc", transition: "0.2s" },
  td: { padding: "16px 20px" },
  
  userCell: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "40px", height: "40px", color: "#fff", borderRadius: "12px", display: "grid", placeItems: "center", fontWeight: "bold" },
  
  badgeAdmin: { background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" },
  badgeStaff: { background: "#ecfdf5", color: "#065f46", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" },
  
  actions: { display: "flex", gap: "8px", justifyContent: "flex-end" },
  deleteBtn: { background: "#fff", border: "1px solid #fee2e2", padding: "8px", borderRadius: "10px", cursor: "pointer", color: "#ef4444" },

  chartSection: { background: "#fff", padding: "30px", borderRadius: "28px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02)" },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  chartTitleGroup: { display: 'flex', gap: '15px', alignItems: 'center' },
  iconCircle: { width: '40px', height: '40px', background: '#ecfdf5', borderRadius: '50%', display: 'grid', placeItems: 'center' },
  chartTitle: { margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e293b" },
  chartSubtitle: { margin: 0, fontSize: "13px", color: "#94a3b8" },
  weekBadge: { background: '#f1f5f9', color: '#475569', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },

  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modal: { background: "#fff", width: "400px", borderRadius: "24px", padding: "30px" },
  modalHeader: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  modalTitle: { margin: 0, color: "#064e3b" },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: { padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: 'none' },
  submitBtn: { background: "#064e3b", color: "#fff", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }
};