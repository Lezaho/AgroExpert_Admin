import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { 
  Plus, Trash2, Save, ArrowLeft, 
  Info, LayoutList, Package, X 
} from "lucide-react";
import type { Product } from "../../types/product";

interface StepProduct {
  productId: string;
  name: string;
  quantity: string;
}

interface Step {
  name: string;
  startDay: number;
  description: string;
  products: StepProduct[]; // Liste des produits pour cette étape
}

export default function ItineraryForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // États du formulaire
  const [cultureName, setCultureName] = useState("");
  const [totalDuration, setTotalDuration] = useState<number>(90);
  const [steps, setSteps] = useState<Step[]>([
    { name: "Préparation du sol", startDay: 0, description: "", products: [] }
  ]);

  // Charger les produits pour le sélecteur
  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, "products"));
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    };
    fetchProducts();
  }, []);

  const addStep = () => {
    setSteps([...steps, { name: "", startDay: 0, description: "", products: [] }]);
  };

  const updateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  // --- GESTION DES PRODUITS DANS L'ÉTAPE ---
  const addProductToStep = (stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].products.push({ productId: "", name: "", quantity: "" });
    setSteps(newSteps);
  };

  const updateProductInStep = (stepIndex: number, prodIndex: number, productId: string) => {
    const newSteps = [...steps];
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      newSteps[stepIndex].products[prodIndex] = { 
        ...newSteps[stepIndex].products[prodIndex], 
        productId: product.id!, 
        name: product.name 
      };
      setSteps(newSteps);
    }
  };

  const updateProductQuantity = (stepIndex: number, prodIndex: number, qty: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].products[prodIndex].quantity = qty;
    setSteps(newSteps);
  };

  const removeProductFromStep = (stepIndex: number, prodIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].products = newSteps[stepIndex].products.filter((_, i) => i !== prodIndex);
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sortedSteps = [...steps].sort((a, b) => a.startDay - b.startDay);
      await addDoc(collection(db, "cropCycles"), {
        cultureName,
        totalDuration,
        steps: sortedSteps,
        createdAt: serverTimestamp(),
      });
      navigate("/admin/products");
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}><ArrowLeft size={18} /> Retour</button>
        <h1 style={styles.title}>Créer un Itinéraire Technique</h1>
      </header>

      <form onSubmit={handleSubmit}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}><Info size={18} /> Configuration de base</h2>
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nom de la Culture</label>
              <input required style={styles.input} value={cultureName} onChange={e => setCultureName(e.target.value)} placeholder="Ex: Maïs Hybride" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Cycle total (Jours)</label>
              <input required type="number" style={styles.input} value={totalDuration} onChange={e => setTotalDuration(parseInt(e.target.value))} />
            </div>
          </div>
        </section>

        <section style={{ ...styles.card, marginTop: 25 }}>
          <div style={styles.cardHeaderFlex}>
            <h2 style={styles.cardTitle}><LayoutList size={18} /> Étapes & Intrants</h2>
            <button type="button" onClick={addStep} style={styles.addStepBtn}><Plus size={16} /> Ajouter une étape</button>
          </div>

          <div style={styles.stepsList}>
            {steps.map((step, sIdx) => (
              <div key={sIdx} style={styles.stepItem}>
                <div style={styles.stepHeaderRow}>
                  <div style={styles.stepNumber}>{sIdx + 1}</div>
                  <input required placeholder="Nom de l'étape" style={{ ...styles.input, flex: 2 }} value={step.name} onChange={e => updateStep(sIdx, "name", e.target.value)} />
                  <input required type="number" placeholder="Jour" style={{ ...styles.input, width: 80 }} value={step.startDay} onChange={e => updateStep(sIdx, "startDay", parseInt(e.target.value))} />
                  <button type="button" onClick={() => setSteps(steps.filter((_, i) => i !== sIdx))} style={styles.deleteBtn}><Trash2 size={18} /></button>
                </div>

                <textarea placeholder="Conseils techniques..." style={styles.textarea} value={step.description} onChange={e => updateStep(sIdx, "description", e.target.value)} />

                {/* --- SOUS-SECTION PRODUITS --- */}
                <div style={styles.productSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Package size={14} /> Produits recommandés
                    </span>
                    <button type="button" onClick={() => addProductToStep(sIdx)} style={styles.smallAddBtn}>+ Ajouter un produit</button>
                  </div>

                  {step.products.map((p, pIdx) => (
                    <div key={pIdx} style={styles.productRow}>
                      <select 
                        style={{ ...styles.input, flex: 2, fontSize: 13 }}
                        value={p.productId}
                        onChange={(e) => updateProductInStep(sIdx, pIdx, e.target.value)}
                        required
                      >
                        <option value="">Sélectionner un produit...</option>
                        {allProducts.map(prod => (
                          <option key={prod.id} value={prod.id}>{prod.name} ({prod.type})</option>
                        ))}
                      </select>
                      <input 
                        placeholder="Dose (ex: 2L/ha)" 
                        style={{ ...styles.input, flex: 1, fontSize: 13 }} 
                        value={p.quantity}
                        onChange={(e) => updateProductQuantity(sIdx, pIdx, e.target.value)}
                        required
                      />
                      <button type="button" onClick={() => removeProductFromStep(sIdx, pIdx)} style={styles.miniDelete}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <button type="submit" disabled={loading} style={styles.saveBtn}>
          {loading ? "Enregistrement..." : <><Save size={20} /> Enregistrer l'itinéraire</>}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "900px", margin: "0 auto", padding: "20px 20px 100px 20px" },
  header: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px" },
  backBtn: { background: "#fff", border: "1px solid #e2e8f0", padding: "8px 15px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#64748b" },
  title: { fontSize: "24px", fontWeight: "900", color: "#064e3b", margin: 0 },
  card: { background: "#fff", padding: "25px", borderRadius: "20px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" },
  cardTitle: { fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" },
  cardHeaderFlex: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  row: { display: "flex", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", flex: 1 },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  input: { padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" },
  textarea: { padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none", width: "100%", height: "60px", marginTop: "10px", resize: "none", boxSizing: "border-box" },
  addStepBtn: { background: "#ecfdf5", color: "#065f46", border: "1px solid #10b981", padding: "8px 15px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" },
  stepsList: { display: "flex", flexDirection: "column", gap: "25px" },
  stepItem: { padding: "20px", background: "#f8fafc", borderRadius: "20px", border: "1px solid #f1f5f9" },
  stepHeaderRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  stepNumber: { width: "28px", height: "28px", background: "#064e3b", color: "#fff", borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: "12px" },
  productSection: { marginTop: "15px", padding: "15px", background: "#fff", borderRadius: "12px", border: "1px solid #edf2f7" },
  productRow: { display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" },
  smallAddBtn: { background: "none", border: "1px dashed #10b981", color: "#10b981", padding: "4px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer" },
  miniDelete: { background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: "6px", width: "24px", height: "24px", cursor: "pointer", display: 'grid', placeItems: 'center' },
  deleteBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer" },
  saveBtn: { background: "#064e3b", color: "#fff", border: "none", padding: "18px", borderRadius: "15px", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "40px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
};