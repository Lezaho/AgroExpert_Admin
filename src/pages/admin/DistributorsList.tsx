import { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase/firebase.ts";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import DistributorForm from "./DistributorForm";

export default function DistributorsList() {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  /** Charger la liste depuis Firestore */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "distributors"));
      setDistributors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Erreur chargement distributeurs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /** Filtre de recherche (Nom ou Ville) */
  const filtered = useMemo(() => {
    const k = q.toLowerCase().trim();
    return distributors.filter(d => 
      d.name?.toLowerCase().includes(k) || 
      d.city?.toLowerCase().includes(k)
    );
  }, [distributors, q]);

  /** Fonction Itinéraire Google Maps */
  const openInMaps = (city: string, address: string) => {
    const query = encodeURIComponent(`${address} ${city}, Côte d'Ivoire`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.mainTitle}>Réseau de Distribution</h2>
          <p style={styles.subTitle}>{distributors.length} points de vente enregistrés</p>
        </div>
        <button 
          onClick={() => { setSelectedId(undefined); setOpenForm(true); }}
          style={styles.addBtn}
        >
          + Nouveau Distributeur
        </button>
      </header>

      {/* Barre de recherche */}
      <div style={styles.searchContainer}>
        <input 
          placeholder="Rechercher un distributeur par nom ou ville (ex: Korhogo, Bouaké...)" 
          style={styles.searchBar}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={styles.loader}>Analyse du réseau Callivoire...</div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(d => (
            <div key={d.id} style={styles.card}>
              <div style={styles.imgWrapper}>
                <img 
                  src={d.imageUrl || "https://via.placeholder.com/400x200?text=Boutique+Callivoire"} 
                  style={styles.cardImg} 
                  alt={d.name}
                />
                <span style={styles.cityBadge}>{d.city}</span>
              </div>

              <div style={styles.cardContent}>
                <h3 style={styles.distName}>{d.name}</h3>
                <p style={styles.manager}>👤 Resp: {d.manager || "Non précisé"}</p>
                
                <div style={styles.contactBlock}>
                  <a href={`tel:${d.phone}`} style={styles.contactLink}>📞 {d.phone}</a>
                  {d.whatsapp && (
                    <a href={`https://wa.me/${d.whatsapp}`} target="_blank" rel="noreferrer" style={styles.contactLink}>
                      💬 WhatsApp
                    </a>
                  )}
                </div>

                <p style={styles.addressText}>📍 {d.address || "Aucune adresse précise"}</p>

                {/* BOUTON ITINÉRAIRE */}
                <button 
                  onClick={() => openInMaps(d.city, d.address)}
                  style={styles.mapsBtn}
                >
                  🗺️ Voir l'itinéraire (GPS)
                </button>

                <div style={styles.cardActions}>
                  <button 
                    onClick={() => { setSelectedId(d.id); setOpenForm(true); }}
                    style={styles.editBtn}
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={async () => { if(confirm("Supprimer ce distributeur ?")) { await deleteDoc(doc(db, "distributors", d.id)); fetchAll(); } }}
                    style={styles.deleteBtn}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={styles.empty}>Aucun distributeur trouvé.</div>
      )}

      {/* MODAL FORMULAIRE */}
      <DistributorForm 
        open={openForm} 
        onClose={() => setOpenForm(false)} 
        distributorId={selectedId} 
        onSaved={fetchAll} 
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "30px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
  mainTitle: { margin: 0, fontSize: "24px", color: "#1e293b" },
  subTitle: { margin: "5px 0 0 0", color: "#64748b", fontSize: "14px" },
  addBtn: { background: "#0f766e", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px -1px rgba(15, 118, 110, 0.2)" },
  searchContainer: { marginBottom: "25px" },
  searchBar: { width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", fontSize: "15px", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" },
  card: { background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", overflow: "hidden", transition: "transform 0.2s", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  imgWrapper: { position: "relative", height: "160px" },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  cityBadge: { position: "absolute", top: "12px", left: "12px", background: "#0f766e", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  cardContent: { padding: "20px" },
  distName: { margin: "0 0 10px 0", fontSize: "19px", color: "#0f172a" },
  manager: { fontSize: "13px", color: "#64748b", marginBottom: "12px" },
  contactBlock: { display: "flex", gap: "15px", marginBottom: "15px" },
  contactLink: { fontSize: "14px", color: "#0f766e", textDecoration: "none", fontWeight: "500" },
  addressText: { fontSize: "13px", color: "#94a3b8", marginBottom: "20px", fontStyle: "italic" },
  mapsBtn: { width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "#f0fdf4", color: "#166534", fontWeight: "bold", cursor: "pointer", marginBottom: "15px" },
  cardActions: { display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" },
  editBtn: { flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  deleteBtn: { padding: "10px", borderRadius: "8px", border: "1px solid #fee2e2", color: "#dc2626", background: "none", cursor: "pointer" },
  loader: { padding: "50px", textAlign: "center", color: "#0f766e", fontWeight: "bold" },
  empty: { textAlign: "center", padding: "50px", color: "#94a3b8" }
};