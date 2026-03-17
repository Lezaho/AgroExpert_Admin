import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase.ts";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Plus, Calendar, Trash2, Edit, Eye } from "lucide-react";
import NewsForm from "./NewsForm";

export default function NewsList() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Erreur news:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const onDelete = async (id: string) => {
    if (window.confirm("Supprimer cet article ?")) {
      await deleteDoc(doc(db, "news", id));
      setNews(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Actualités Agricoles</h1>
          <p style={styles.subtitle}>Gérez les articles et conseils pour les agriculteurs</p>
        </div>
        <button onClick={() => { setSelectedId(undefined); setIsFormOpen(true); }} style={styles.addBtn}>
          <Plus size={18} /> Rédiger un article
        </button>
      </header>

      {loading ? (
        <div style={styles.loader}>Chargement des actualités...</div>
      ) : (
        <div style={styles.grid}>
          {news.map(item => (
            <div key={item.id} style={styles.card}>
              <img src={item.imageUrl || "/placeholder-news.png"} style={styles.newsImg} alt="" />
              <div style={styles.cardBody}>
                <div style={styles.dateRow}>
                  <Calendar size={14} /> 
                  <span>{item.createdAt?.toDate().toLocaleDateString() || "Date inconnue"}</span>
                  <span style={styles.categoryBadge}>{item.category}</span>
                </div>
                <h3 style={styles.newsTitle}>{item.title}</h3>
                <p style={styles.excerpt}>{item.content?.substring(0, 100)}...</p>
                <div style={styles.actions}>
                  <button onClick={() => { setSelectedId(item.id); setIsFormOpen(true); }} style={styles.editBtn}><Edit size={16} /></button>
                  <button onClick={() => onDelete(item.id)} style={styles.deleteBtn}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewsForm 
        open={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        newsId={selectedId} 
        onSaved={fetchNews} 
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "30px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  title: { margin: 0, color: "#1e293b" },
  subtitle: { color: "#64748b", margin: 0 },
  addBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#0f766e", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  card: { background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  newsImg: { width: "100%", height: "160px", objectFit: "cover" },
  cardBody: { padding: "15px" },
  dateRow: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#64748b", marginBottom: "10px" },
  categoryBadge: { marginLeft: "auto", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", color: "#0f766e", fontWeight: "bold" },
  newsTitle: { margin: "0 0 10px 0", fontSize: "18px", color: "#1e293b" },
  excerpt: { fontSize: "14px", color: "#475569", marginBottom: "15px", lineHeight: "1.5" },
  actions: { display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" },
  editBtn: { flex: 1, background: "#f1f5f9", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer" },
  deleteBtn: { flex: 1, background: "#fff1f2", border: "none", color: "#e11d48", padding: "8px", borderRadius: "6px", cursor: "pointer" },
  loader: { textAlign: "center", padding: "100px", color: "#64748b" }
};