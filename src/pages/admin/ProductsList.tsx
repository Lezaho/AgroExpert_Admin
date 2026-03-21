import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/product";
import { listProducts, updateProduct } from "../../api/productsApi";
import ProductForm from "./ProductForm";
import { Leaf, Calendar, PlusCircle, ArrowRight, Package, Search, Trash2, Edit2 } from "lucide-react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";

const FAMILIES = [
  "Absorbant", "Adjuvant", "Appareils", "Biofongicide", "Bioinsecticide",
  "Biostimulant", "Engrais", "Equipement de protection", "Fongicide", "Herbicide",
  "Hygine publique", "Insecticide", "Irrigation", "Molusicide", "Nématicide",
  "Outils", "Pheromones", "Raticides", "Semences", "biocontroles"
].sort();

export default function ProductsList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Product[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [itineraries, setItineraries] = useState<any[]>([]);

  const fetchAll = async () => {
    try {
      setBusy(true); 
      const data = await listProducts();
      setItems(data);
      
      const itinSnap = await getDocs(collection(db, "cropCycles"));
      setItineraries(itinSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Erreur de chargement", e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // --- ACTIONS ITINÉRAIRES ---
  const handleDeleteItinerary = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Voulez-vous vraiment supprimer l'itinéraire "${name}" ?`)) {
      try {
        await deleteDoc(doc(db, "cropCycles", id));
        setItineraries(prev => prev.filter(it => it.id !== id));
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleEditItinerary = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Redirige vers la page de création mais avec l'ID pour le mode édition
    navigate(`/admin/products/itineraries/new?edit=${id}`);
  };

  // --- ACTIONS PRODUITS ---
  const handleUpdateStock = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation();
    const currentUnit = product.unit || "Pcs";
    const unitChoice = window.prompt(`Unité actuelle : ${currentUnit}\n1: L, 2: kg, 3: g, 4: Pcs`,"");
    let newUnit = currentUnit;
    if (unitChoice === "1") newUnit = "L"; 
    else if (unitChoice === "2") newUnit = "kg"; 
    else if (unitChoice === "3") newUnit = "g"; 
    else if (unitChoice === "4") newUnit = "Pcs";

    const action = window.prompt(`Stock : ${product.stock_quantity || 0}\n+ pour ajouter, = pour modifier`,"+");
    if (action !== "+" && action !== "=") return;
    
    const valStr = window.prompt("Valeur :");
    if (!valStr) return;
    const value = parseFloat(valStr);
    const finalQty = action === "=" ? value : (product.stock_quantity || 0) + value;

    try {
      setItems(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: finalQty, unit: newUnit } : p));
      await updateProduct(product.id!, { stock_quantity: finalQty, unit: newUnit });
    } catch (err) { 
        alert("Erreur mise à jour");
        fetchAll(); 
    }
  };

  const filteredProducts = useMemo(() => {
    return items.filter(p => p.type === selectedFamily && (p.name?.toLowerCase().includes(q.toLowerCase()) || !q));
  }, [items, selectedFamily, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach(p => { if (p.type) c[p.type] = (c[p.type] || 0) + 1; });
    return c;
  }, [items]);

  return (
    <div style={{ paddingBottom: 50 }}>
      {/* HEADER CATALOGUE */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 25 }}>
        <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 26, color: "#1e293b", fontWeight: "900" }}>
            {selectedFamily ? selectedFamily : "Catalogue Agritera"}
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Gérer vos produits et stocks par famille</p>
        </div>
        {selectedFamily && (
          <button onClick={() => setSelectedFamily(null)} style={secondaryBtn}>← Retour aux familles</button>
        )}
        <button onClick={() => { setEditId(undefined); setOpenForm(true); }} style={primaryBtn}>
          <PlusCircle size={18} /> Nouveau Produit
        </button>
      </div>

      {busy && items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Chargement du catalogue...</div>
      ) : !selectedFamily ? (
        <div style={styles.familyGrid}>
          {FAMILIES.map(family => (
            <div key={family} onClick={() => setSelectedFamily(family)} style={styles.familyCard}>
              <div style={styles.iconCircle}><Package size={20} color="#0f766e" /></div>
              <div style={{ fontWeight: "700", color: "#334155", marginBottom: 4 }}>{family}</div>
              <div style={styles.badge}>{counts[family] || 0} produits</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.panel}>
           <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: 14, color: '#94a3b8' }} />
                <input 
                    placeholder={`Rechercher un produit dans ${selectedFamily}...`} 
                    value={q} 
                    onChange={e => setQ(e.target.value)} 
                    style={{ ...searchInput, paddingLeft: 40 }} 
                />
           </div>
           
           <table style={table}>
              <thead>
                <tr>
                    <th style={th}>Nom du Produit</th>
                    <th style={th}>Disponibilité</th>
                    <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} style={rowStyle} onClick={() => navigate(`/admin/products/${p.id}`)}>
                    <td style={td}>
                        <div style={{ fontWeight: 700, color: "#0f766e" }}>{p.name}</div>
                    </td>
                    <td style={td}>
                        <span style={{
                            ...styles.stockTag, 
                            background: (p.stock_quantity || 0) <= 0 ? "#fee2e2" : "#f0fdf4",
                            color: (p.stock_quantity || 0) <= 0 ? "#991b1b" : "#166534"
                        }}>
                            {p.stock_quantity ?? 0} {p.unit ?? "Pcs"}
                        </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                        <button onClick={(e) => handleUpdateStock(e, p)} style={stockBtn}>📦 Stock</button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}

      {/* SECTION ITINÉRAIRES TECHNIQUES */}
      <div style={{ marginTop: 60 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, color: "#064e3b", fontWeight: "900" }}>Itinéraires Techniques</h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Protocoles de culture et calendriers de suivi</p>
          </div>
          <button 
            onClick={() => navigate("/admin/products/itineraries/new")} 
            style={{ ...primaryBtn, background: "#10b981" }}
          >
            <PlusCircle size={18} /> Enregistrer un itinéraire
          </button>
        </div>

        <div style={styles.itinGrid}>
          {itineraries.length === 0 ? (
            <div style={styles.emptyState}>
                <Leaf size={40} color="#e2e8f0" style={{ marginBottom: 10 }} />
                <p>Aucun itinéraire enregistré pour le moment.</p>
            </div>
          ) : (
            itineraries.map(itin => (
              <div key={itin.id} style={styles.itinCard}>
                <div style={styles.itinIcon}><Leaf size={24} color="#10b981" /></div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 17, color: "#1e293b", fontWeight: '800' }}>{itin.cultureName}</h3>
                  <div style={{ display: "flex", gap: 15, marginTop: 6 }}>
                    <span style={styles.itinMeta}><Calendar size={14}/> {itin.steps?.length || 0} étapes</span>
                    <span style={styles.itinMeta}>⏱️ {itin.totalDuration} jours</span>
                  </div>
                </div>
                
                <div style={styles.itinActions}>
                  <button 
                    style={styles.actionBtnEdit} 
                    onClick={(e) => handleEditItinerary(e, itin.id)}
                    title="Modifier"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    style={styles.actionBtnDelete} 
                    onClick={(e) => handleDeleteItinerary(e, itin.id, itin.cultureName)}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    style={styles.itinViewBtn} 
                    onClick={() => navigate(`/admin/products/itineraries/view/${itin.id}`)}
                  >
                    Détails <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ProductForm open={openForm} onClose={() => setOpenForm(false)} productId={editId} onSaved={fetchAll} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  familyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "20px" },
  familyCard: { background: "#fff", padding: "25px", borderRadius: "16px", border: "1px solid #e2e8f0", cursor: "pointer", textAlign: "center", transition: '0.2s' },
  iconCircle: { width: "45px", height: "45px", borderRadius: "12px", background: "#f0fdf4", margin: "0 auto 12px", display: "grid", placeItems: "center" },
  badge: { fontSize: "11px", color: "#0f766e", background: "#ccfbf1", padding: "4px 10px", borderRadius: "20px", fontWeight: '700' },
  stockTag: { padding: "6px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "800" },
  panel: { padding: "25px", background: "#fff", borderRadius: "20px", border: '1px solid #e2e8f0', boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" },
  itinGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "20px" },
  itinCard: { background: "#fff", padding: "20px", borderRadius: "20px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "18px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
  itinIcon: { width: "54px", height: "54px", background: "#ecfdf5", borderRadius: "15px", display: "grid", placeItems: "center", flexShrink: 0 },
  itinMeta: { fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: '500' },
  itinActions: { display: "flex", alignItems: "center", gap: "10px" },
  itinViewBtn: { background: "#f0fdf4", border: "none", color: "#10b981", fontWeight: "800", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "10px" },
  actionBtnEdit: { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", padding: "8px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center" },
  actionBtnDelete: { background: "#fff1f1", border: "1px solid #fee2e2", color: "#ef4444", padding: "8px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center" },
  emptyState: { gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "#94a3b8", border: "2px dashed #e2e8f0", borderRadius: "24px", display: 'flex', flexDirection: 'column', alignItems: 'center' }
};

const primaryBtn: React.CSSProperties = { background: "#0f766e", color: "#fff", border: 0, padding: "12px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "700", display: 'flex', alignItems: 'center', gap: 8 };
const secondaryBtn: React.CSSProperties = { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", padding: "10px 18px", borderRadius: "12px", cursor: "pointer", fontWeight: '600' };
const stockBtn: React.CSSProperties = { background: "#0f766e", color: "#fff", border: 0, padding: "8px 14px", borderRadius: "10px", cursor: "pointer", fontSize: "12px", fontWeight: "800" };
const searchInput: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", width: "100%", outline: "none", fontSize: "15px" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: React.CSSProperties = { textAlign: "left", padding: "15px", borderBottom: "1px solid #f1f5f9", color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", letterSpacing: '0.05em', fontWeight: '800' };
const td: React.CSSProperties = { padding: "18px 15px", borderBottom: "1px solid #f8fafc", fontSize: "15px" };
const rowStyle: React.CSSProperties = { cursor: "pointer" };