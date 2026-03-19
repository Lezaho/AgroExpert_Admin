import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase.ts";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Plus, Search, ChevronRight } from "lucide-react"; // Optionnel: icônes lucide-react
import DiseaseForm from "./DiseaseForm";

// Typage pour la sécurité du code
interface Disease {
  id: string;
  name: string;
  culture: string;
  symptoms?: string;
  imageUrl?: string;
}

export default function DiseasesList() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  
  const navigate = useNavigate();

  /** Charger les données */
  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "diseases"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Disease));
      setDiseases(list);
    } catch (e) {
      console.error("Erreur lors du chargement:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, []);

  /** Filtrage intelligent */
  const filteredDiseases = useMemo(() => {
    const k = searchTerm.toLowerCase().trim();
    return diseases.filter(d => 
      d.name?.toLowerCase().includes(k) || 
      d.culture?.toLowerCase().includes(k)
    );
  }, [diseases, searchTerm]);

  /** Actions */
  const handleAdd = () => {
    setEditId(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Empêche d'ouvrir le détail lors du clic sur modifier
    setEditId(id);
    setIsFormOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Empêche d'ouvrir le détail
    if (window.confirm(`Supprimer la fiche : ${name} ?`)) {
      try {
        await deleteDoc(doc(db, "diseases", id));
        setDiseases(prev => prev.filter(d => d.id !== id)); // Maj optimiste
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const goToDetail = (id: string) => {
    navigate(`/admin/diseases/${id}`);
  };

  return (
    <div style={styles.container}>
      {/* Header avec Statistiques */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Pathologies Végétales</h1>
          <p style={styles.subtitle}>{diseases.length} maladies répertoriées</p>
        </div>
        <button onClick={handleAdd} style={styles.addBtn}>
          <Plus size={18} /> Identifier une maladie
        </button>
      </header>

      {/* Barre de recherche */}
      <div style={styles.searchBar}>
        <Search size={20} style={styles.searchIcon} />
        <input 
          placeholder="Rechercher par nom ou par culture (ex: Cacao, Rouille...)" 
          style={styles.input}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={styles.loader}>
          <p>Analyse de la base de données phytosanitaire...</p>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {filteredDiseases.map(d => (
              <div 
                key={d.id} 
                style={styles.card} 
                onClick={() => goToDetail(d.id)}
              >
                <div style={styles.imageWrapper}>
                  <img 
                    src={d.imageUrl || "https://via.placeholder.com/400x200?text=Pas+d'image"} 
                    alt={d.name} 
                    style={styles.img} 
                  />
                  <span style={styles.badge}>{d.culture}</span>
                </div>

                <div style={styles.cardContent}>
                  <h3 style={styles.diseaseName}>{d.name}</h3>
                  <p style={styles.symptomsPreview}>
                    {d.symptoms ? `${d.symptoms.substring(0, 90)}...` : "Aucun symptôme renseigné."}
                  </p>
                  
                  <div style={styles.footer}>
                    <div style={styles.actions}>
                      <button onClick={(e) => handleEdit(e, d.id)} style={styles.iconBtn}>Modifier</button>
                      <button onClick={(e) => handleDelete(e, d.id, d.name)} style={styles.deleteBtn}>Supprimer</button>
                    </div>
                    <ChevronRight size={20} color="#cbd5e1" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDiseases.length === 0 && (
            <div style={styles.empty}>
              <p>Aucun résultat pour "<strong>{searchTerm}</strong>"</p>
              <button onClick={() => setSearchTerm("")} style={styles.resetLink}>Voir tout</button>
            </div>
          )}
        </>
      )}

      {/* Formulaire Modal */}
      <DiseaseForm 
        open={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        diseaseId={editId} 
        onSaved={fetchDiseases} 
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "30px", maxWidth: "1300px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  title: { margin: 0, fontSize: "28px", color: "#0f172a", fontWeight: "800" },
  subtitle: { margin: "5px 0 0 0", color: "#64748b", fontSize: "14px" },
  addBtn: { display: "flex", alignItems: "center", gap: "8px", background: "#059669", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" },
  searchBar: { position: "relative", marginBottom: "30px" },
  searchIcon: { position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  input: { width: "100%", padding: "15px 15px 15px 45px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "16px", outline: "none", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" },
  card: { background: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #f1f5f9", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" },
  imageWrapper: { position: "relative", height: "180px" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  badge: { position: "absolute", top: "12px", right: "12px", background: "rgba(6, 78, 59, 0.85)", backdropFilter: "blur(4px)", color: "#fff", padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" },
  cardContent: { padding: "20px" },
  diseaseName: { margin: "0 0 10px 0", fontSize: "19px", color: "#1e293b", fontWeight: "700" },
  symptomsPreview: { fontSize: "14px", color: "#64748b", lineHeight: "1.6", height: "4.8em", overflow: "hidden", marginBottom: "20px" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "15px", borderTop: "1px solid #f1f5f9" },
  actions: { display: "flex", gap: "10px" },
  iconBtn: { padding: "6px 12px", borderRadius: "6px", border: "none", background: "#f1f5f9", color: "#475569", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  deleteBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #fee2e2", background: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer" },
  loader: { textAlign: "center", padding: "100px", color: "#059669" },
  empty: { textAlign: "center", padding: "80px", background: "#f8fafc", borderRadius: "20px", color: "#64748b" },
  resetLink: { background: "none", border: "none", color: "#059669", textDecoration: "underline", cursor: "pointer", marginLeft: "5px" }
};