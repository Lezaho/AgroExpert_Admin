import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, ProductType } from "../../types/product";
import { createProduct, getProduct, updateProduct } from "../../api/productsApi";
import { uploadToCloudinary } from "../../utils/cloudinary";

/** Props */
type Props = {
  open: boolean;
  onClose: () => void;
  productId?: string;
  onSaved: () => void;
};

// 1. LISTE OFFICIELLE DES FAMILLES

const TYPES: readonly ProductType[] = [
  "Herbicide",
  "Fongicide",
  "Insecticide",
  "Bio-insecticide",
  "Biostimulant",
  "Adjuvant",
] as const;


const CULTURES = [
  "Cacao", "Tomate", "Riz", "Oignon", "Maïs", "Aubergine", "Banane", 
  "Piment", "Carote", "Concombre", "Courgette", "Gazon", "Gombo", "Haricot", "Poivron"
].sort();




type ProductDraft = Omit<Product, "id">;

const EMPTY: ProductDraft = {
  name: "",
  type: "Herbicide", // valeur valide au lieu de "famille"
  description: "",
  dose: "",
  strengths: "",
  packaging: "",
  price: 0,
  published: true,
  crops: [],
  activeSubstances: [],
  logoUrl: "",
  photoUrl: "",
  pdfEtiquetteUrl: "",
  stock_quantity: 0,
  unit: "",
};


export default function ProductForm({ open, onClose, productId, onSaved }: Props) {
  const isEdit = Boolean(productId);
  const [model, setModel] = useState<ProductDraft>(EMPTY);
  const [substancesInput, setSubstancesInput] = useState("");

  // Refs pour les fichiers (FDS supprimé)
  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const etiquetteRef = useRef<HTMLInputElement>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (!productId) {
      setModel(EMPTY);
      setSubstancesInput("");
      setLogoPreview(null);
      setPhotoPreview(null);
      return;
    }

    (async () => {
      const p = await getProduct(productId);
      if (p) {
        setModel({ ...EMPTY, ...p });
        setSubstancesInput((p.activeSubstances ?? []).join(", "));
        setLogoPreview(p.logoUrl || null);
        setPhotoPreview(p.photoUrl || null);
      }
    })();
  }, [open, productId]);

  const isValid = useMemo(() => {
    return (
      model.name.trim().length > 0 &&
      model.type.trim().length > 0 &&
      model.description.trim().length > 0 &&
      model.dose.trim().length > 0 &&
      model.packaging.trim().length > 0 &&
      !isNaN(Number(model.price))
    );
  }, [model]);

  const save = async () => {
    if (!isValid) {
      setError("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const finalSubstances = substancesInput.split(",").map(s => s.trim()).filter(Boolean);

      const finalData: ProductDraft = {
        ...model,
        activeSubstances: finalSubstances,
        price: Number(model.price),
      };

      let currentId = productId || "";
      if (!isEdit) {
        currentId = await createProduct(finalData);
      } else {
        await updateProduct(currentId, finalData);
      }

      const patch: Partial<ProductDraft> = {};
      const fileTasks = [
        { ref: logoRef, key: "logoUrl", type: "image", label: "du logo" },
        { ref: photoRef, key: "photoUrl", type: "image", label: "de l'image produit" },
        { ref: etiquetteRef, key: "pdfEtiquetteUrl", type: "raw", label: "du PDF Étiquette" },
      ];

      for (const task of fileTasks) {
        const file = task.ref.current?.files?.[0];
        if (file) {
          setUploading(`Upload ${task.label}...`);
          const url = await uploadToCloudinary(file, task.type as any);
          (patch as any)[task.key] = url;
        }
      }

      if (Object.keys(patch).length > 0) {
        await updateProduct(currentId, patch);
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'enregistrement.");
    } finally {
      setBusy(false);
      setUploading(null);
    }
  };

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <h2 style={{ margin: 0, color: "#0f172a" }}>{isEdit ? "Modifier" : "Ajouter"} un produit</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </header>

        <div style={styles.scrollArea}>
          <div style={styles.grid}>
            <label style={styles.label}>
              <span>Nom commercial *</span>
              <input style={styles.input} placeholder="Ex: AMPA 80 WP" value={model.name} onChange={e => setModel(m => ({ ...m, name: e.target.value }))} />
            </label>

            <label style={styles.label}>
              <span>Famille / Catégorie *</span>
              <select style={styles.input} value={model.type} onChange={e => setModel(m => ({ ...m, type: e.target.value as ProductType }))}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label style={styles.labelFull}>
              <span>Matières Actives (séparées par une virgule)</span>
              <input style={styles.input} placeholder="Ex: Bromacil, Diuron" value={substancesInput} onChange={e => setSubstancesInput(e.target.value)} />
            </label>

            <label style={styles.labelFull}>
              <span>Description détaillée *</span>
              <textarea style={styles.textarea} rows={3} value={model.description} onChange={e => setModel(m => ({ ...m, description: e.target.value }))} />
            </label>

            <label style={styles.label}>
              <span>Dose et application *</span>
              <textarea style={styles.textarea} rows={2} placeholder="Ex: 3 kg/ha" value={model.dose} onChange={e => setModel(m => ({ ...m, dose: e.target.value }))} />
            </label>

            <label style={styles.label}>
              <span>Points forts</span>
              <textarea style={styles.textarea} rows={2} value={model.strengths} onChange={e => setModel(m => ({ ...m, strengths: e.target.value }))} />
            </label>

            <label style={styles.label}>
              <span>Conditionnement *</span>
              <input style={styles.input} placeholder="Ex: 1L, 1Kg..." value={model.packaging} onChange={e => setModel(m => ({ ...m, packaging: e.target.value }))} />
            </label>

            <label style={styles.label}>
              <span>Prix estimé (FCFA)</span>
              <input type="number" style={styles.input} value={model.price} onChange={e => setModel(m => ({ ...m, price: Number(e.target.value) }))} />
            </label>
          </div>

          <div style={{ marginTop: 25 }}>
            <span style={styles.subTitle}>Cultures homologuées</span>
            <div style={styles.checkboxGrid}>
              {CULTURES.map(c => (
                <label key={c} style={styles.checkLabel}>
                  <input type="checkbox" checked={model.crops.includes(c)}
                    onChange={() => setModel(m => ({
                      ...m, crops: m.crops.includes(c) ? m.crops.filter(x => x !== c) : [...m.crops, c]
                    }))}
                  /> {c}
                </label>
              ))}
            </div>
          </div>

          <div style={styles.fileRow}>
            <div style={styles.fileBox}>
              <span style={{fontWeight: "600"}}>Logo de la marque</span>
              <input type="file" ref={logoRef} accept="image/*" onChange={e => e.target.files?.[0] && setLogoPreview(URL.createObjectURL(e.target.files[0]))} />
              {logoPreview && <img src={logoPreview} style={styles.miniPreview} alt="logo" />}
            </div>
            
            <div style={styles.fileBox}>
              <span style={{fontWeight: "600"}}>Image du produit (Bidon/Sachet)</span>
              <input type="file" ref={photoRef} accept="image/*" onChange={e => e.target.files?.[0] && setPhotoPreview(URL.createObjectURL(e.target.files[0]))} />
              {photoPreview && <img src={photoPreview} style={styles.miniPreview} alt="photo" />}
            </div>

            <div style={styles.fileBox}>
              <span style={{fontWeight: "600"}}>Fiche Technique (PDF Étiquette)</span>
              <input type="file" ref={etiquetteRef} accept=".pdf" style={{ marginTop: "5px" }} />
            </div>
          </div>

          <div style={styles.publishCard}>
            <label style={styles.publishLabel}>
              <input type="checkbox" style={styles.checkboxLarge} checked={model.published} onChange={e => setModel(m => ({ ...m, published: e.target.checked }))} />
              <div>
                <div style={{ fontWeight: "bold" }}>Activer la publication</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Rendre visible sur la tablette des conseillers</div>
              </div>
            </label>
          </div>
        </div>

        <footer style={styles.footer}>
          <div style={{ flex: 1 }}>
            {error && <div style={styles.errorMsg}>{error}</div>}
            {uploading && <div style={styles.infoMsg}>{uploading}</div>}
          </div>
          <button onClick={onClose} style={styles.cancelBtn}>Annuler</button>
          <button onClick={save} disabled={busy || !isValid} style={{...styles.saveBtn, opacity: (busy || !isValid) ? 0.6 : 1}}>
            {busy ? "Traitement..." : "Enregistrer le produit"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", display: "grid", placeItems: "center", zIndex: 1000, padding: "20px", backdropFilter: "blur(4px)" },
  modal: { background: "#fff", width: "100%", maxWidth: "850px", borderRadius: "16px", display: "flex", flexDirection: "column", maxHeight: "95vh", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  header: { padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" },
  scrollArea: { padding: "24px", overflowY: "auto", flex: 1 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  label: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "500", color: "#334155" },
  labelFull: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "500", color: "#334155" },
  input: { padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none" },
  textarea: { padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", resize: "none" },
  subTitle: { fontWeight: "bold", fontSize: "15px", display: "block", marginBottom: "12px", color: "#1e293b" },
  checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", padding: "15px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9" },
  checkLabel: { display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "12px" },
  fileRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" },
  fileBox: { display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" },
  miniPreview: { width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", border: "1px solid #e2e8f0", marginTop: "5px" },
  publishCard: { marginTop: "30px", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" },
  publishLabel: { display: "flex", alignItems: "center", gap: "15px", cursor: "pointer" },
  checkboxLarge: { width: "22px", height: "22px", accentColor: "#0f766e" },
  footer: { padding: "20px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "16px" },
  saveBtn: { background: "#0f766e", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "15px" },
  cancelBtn: { background: "none", border: "1px solid #cbd5e1", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", color: "#64748b", fontWeight: "500" },
  errorMsg: { color: "#e11d48", fontSize: "13px", fontWeight: "500" },
  infoMsg: { color: "#0f766e", fontSize: "13px", fontWeight: "500" },
  closeBtn: { background: "none", border: "none", fontSize: "24px", color: "#94a3b8", cursor: "pointer" }
};