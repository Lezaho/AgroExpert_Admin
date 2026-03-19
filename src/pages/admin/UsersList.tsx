import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase.ts";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { ShieldCheck, UserMinus, Mail } from "lucide-react";

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleAdmin = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (confirm(`Passer cet utilisateur en mode ${newRole} ?`)) {
      await updateDoc(doc(db, "users", id), { role: newRole });
      fetchUsers();
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestion des Utilisateurs</h1>
          <p style={styles.subtitle}>{users.length} comptes enregistrés</p>
        </div>
      </header>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Utilisateur</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Rôle</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.userCell}>
                    <div style={styles.avatar}>{u.displayName?.charAt(0) || "U"}</div>
                    <strong>{u.displayName || "Anonyme"}</strong>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Mail size={14} color="#64748b" /> {u.email}
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={u.role === "admin" ? styles.badgeAdmin : styles.badgeUser}>
                    {u.role || "user"}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button 
                      onClick={() => toggleAdmin(u.id, u.role)} 
                      style={styles.roleBtn} 
                      title="Changer le rôle"
                    >
                      {u.role === "admin" ? <UserMinus size={18} /> : <ShieldCheck size={18} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ padding: 40, textAlign: "center" }}>Chargement des membres...</div>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "30px" },
  header: { marginBottom: "30px" },
  title: { margin: 0, color: "#1e293b", fontSize: "24px" },
  subtitle: { color: "#64748b", margin: 0 },
  tableCard: { background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  thead: { background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "15px 20px", fontSize: "13px", color: "#64748b", fontWeight: "600" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "15px 20px", fontSize: "14px", color: "#1e293b" },
  userCell: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "32px", height: "32px", background: "#0f766e", color: "#fff", borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: "12px" },
  badgeAdmin: { background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  badgeUser: { background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" },
  actions: { display: "flex", gap: "10px" },
  roleBtn: { background: "none", border: "1px solid #e2e8f0", padding: "6px", borderRadius: "6px", cursor: "pointer", color: "#64748b" },
};