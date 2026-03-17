import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../types/product";
import { listProducts, updateProduct } from "../../api/productsApi";
import ProductForm from "./ProductForm";

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

  const fetchAll = async () => {
    try {
      setBusy(true); 
      const data = await listProducts();
      setItems(data);
    } catch (e) {
      console.error("Erreur de chargement");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // --- MISE À JOUR : GESTION DU STOCK ET DES UNITÉS ---
  const handleUpdateStock = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Choix de l'unité
    const currentUnit = product.unit || "Pcs";
    const unitChoice = window.prompt(
      `Unité actuelle : ${currentUnit}\nChanger l'unité ?\n1: Litre (L)\n2: Kilogramme (kg)\n3: Gramme (g)\n4: Pièce (Pcs)\n(Laissez vide pour garder ${currentUnit})`,
      ""
    );

    let newUnit = currentUnit;
    if (unitChoice === "1") newUnit = "L";
    else if (unitChoice === "2") newUnit = "kg";
    else if (unitChoice === "3") newUnit = "g";
    else if (unitChoice === "4") newUnit = "Pcs";

    // 2. Choix de l'action (+ ou =)
    const action = window.prompt(
      `Stock actuel : ${product.stock_quantity || 0} ${newUnit}\n\n` +
      `Tapez '+' pour AJOUTER au stock\n` +
      `Tapez '=' pour MODIFIER (Remplacer) le total`, 
      "+"
    );

    if (action !== "+" && action !== "=") return;

    // 3. Saisie de la valeur
    const valStr = window.prompt(
      action === "+" ? "Quantité à AJOUTER :" : "Nouvelle quantité TOTALE :"
    );

    if (valStr === null || valStr === "") return;
    const value = parseFloat(valStr);
    if (isNaN(value)) return alert("Veuillez entrer un nombre valide.");

    const finalQty = action === "=" ? value : (product.stock_quantity || 0) + value;

    try {
      // Mise à jour optimiste pour l'interface
      setItems(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: finalQty, unit: newUnit } : p));
      
      await updateProduct(product.id!, { 
        stock_quantity: finalQty,
        unit: newUnit 
      });
      
      alert(`✅ Stock mis à jour : ${finalQty} ${newUnit}`);
    } catch (err) {
      alert("Erreur lors de la mise à jour");
      fetchAll(); // Recharger en cas d'erreur
    }
  };

  const filteredProducts = useMemo(() => {
    return items.filter(p => 
      p.type === selectedFamily && 
      (p.name?.toLowerCase().includes(q.toLowerCase()) || !q)
    );
  }, [items, selectedFamily, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach(p => {
      if (p.type) c[p.type] = (c[p.type] || 0) + 1;
    });
    return c;
  }, [items]);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, flex: 1, color: "#1e293b" }}>
          {selectedFamily ? `Famille : ${selectedFamily}` : "Catalogue Agritera"}
        </h2>
        {selectedFamily && (
          <button onClick={() => setSelectedFamily(null)} style={secondaryBtn}>← Retour aux familles</button>
        )}
        <button onClick={() => { setEditId(undefined); setOpenForm(true); }} style={primaryBtn}>
          + Nouveau Produit
        </button>
      </div>

      {busy && items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Chargement...</div>
      ) : !selectedFamily ? (
        <div style={styles.familyGrid}>
          {FAMILIES.map(family => (
            <div key={`fam-${family}`} onClick={() => setSelectedFamily(family)} style={styles.familyCard}>
              <div style={styles.iconCircle}><span>📦</span></div>
              <div style={{ fontWeight: "600", color: "#334155" }}>{family}</div>
              <div style={styles.badge}>{counts[family] || 0} produits</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel" style={{ padding: 20, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <input
            placeholder={`Rechercher un produit dans ${selectedFamily}...`}
            value={q}
            onChange={e => setQ(e.target.value)}
            style={searchInput}
          />

          <div style={{ overflowX: "auto", marginTop: 15 }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Produit</th>
                  <th style={th}>Stock & Unité</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, idx) => (
                  <tr key={`prod-${p.id}-${idx}`} style={rowStyle} onClick={() => navigate(`/admin/products/${p.id}`)}>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {p.logoUrl && <img src={p.logoUrl} alt="" style={styles.logo} />}
                        <span style={{ fontWeight: 600, color: "#0f766e" }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{
                        ...styles.stockTag,
                        background: (p.stock_quantity || 0) <= 0 ? "#fee2e2" : "#f0fdf4",
                        color: (p.stock_quantity || 0) <= 0 ? "#991b1b" : "#166534",
                      }}>
                        {p.stock_quantity ?? 0} {p.unit ?? "Pcs"}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button 
                          onClick={(e) => handleUpdateStock(e, p)} 
                          style={stockBtn}
                        >📦 Stock</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditId(p.id); setOpenForm(true); }} 
                          style={ghostBtn}
                        >Editer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                Aucun produit trouvé dans cette famille.
              </div>
            )}
          </div>
        </div>
      )}

      <ProductForm open={openForm} onClose={() => setOpenForm(false)} productId={editId} onSaved={fetchAll} />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  familyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" },
  familyCard: { background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", cursor: "pointer", textAlign: "center" },
  iconCircle: { width: "40px", height: "40px", borderRadius: "50%", background: "#f0fdf4", margin: "0 auto 10px", display: "grid", placeItems: "center" },
  badge: { fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "10px" },
  logo: { height: 30, width: 30, borderRadius: 4, objectFit: "contain" },
  stockTag: { padding: "5px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }
};

const primaryBtn: React.CSSProperties = { background: "#0f766e", color: "#fff", border: 0, padding: "10px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" };
const secondaryBtn: React.CSSProperties = { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", padding: "10px 15px", borderRadius: "10px", cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" };
const stockBtn: React.CSSProperties = { background: "#0f766e", color: "#fff", border: 0, padding: "7px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" };
const searchInput: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", width: "100%", outline: "none", marginBottom: "15px" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: React.CSSProperties = { textAlign: "left", padding: "12px", borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: "11px", textTransform: "uppercase" };
const td: React.CSSProperties = { padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "14px" };
const rowStyle: React.CSSProperties = { cursor: "pointer" };