import { useEffect, useRef, useState } from "react";
import { db } from "../../firebase/firebase.ts";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../../utils/cloudinary";

type Props = {
  open: boolean;
  onClose: () => void;
  distributorId?: string;
  onSaved: () => void;
};

export default function DistributorForm({ open, onClose, distributorId, onSaved }: Props) {
  const isEdit = Boolean(distributorId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [model, setModel] = useState({
    name: "",
    manager: "",
    phone: "",
    whatsapp: "",
    city: "",
    address: "",
    imageUrl: "",
    active: true
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!distributorId) {
      setModel({ name: "", manager: "", phone: "", whatsapp: "", city: "", address: "", imageUrl: "", active: true });
      setPreview(null);
      return;
    }
    (async () => {
      const snap = await getDoc(doc(db, "distributors", distributorId));
      if (snap.exists()) {
        const data = snap.data() as any;
        setModel(data);
        setPreview(data.imageUrl);
      }
    })();
  }, [open, distributorId]);

  const save = async () => {
    if (!model.name || !model.city || !model.phone) return setError("Nom, Ville et Téléphone requis.");
    setBusy(true);
    try {
      let id = distributorId;
      if (!isEdit) {
        const docRef = await addDoc(collection(db, "distributors"), model);
        id = docRef.id;
      } else {
        await updateDoc(doc(db, "distributors", distributorId!), model);
      }

      const file = fileRef.current?.files?.[0];
      if (file && id) {
        const url = await uploadToCloudinary(file, "image");
        await updateDoc(doc(db, "distributors", id), { imageUrl: url });
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2>{isEdit ? "Modifier" : "Ajouter"} un distributeur</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </header>

        <div style={styles.body}>
          <div style={styles.grid}>
            <label style={styles.labelFull}>
              <span>Nom du point de vente *</span>
              <input style={styles.input} value={model.name} onChange={e => setModel({...model, name: e.target.value})} placeholder="Ex: Boutique Agricole du Centre" />
            </label>

            <label style={styles.label}>
              <span>Responsable</span>
              <input style={styles.input} value={model.manager} onChange={e => setModel({...model, manager: e.target.value})} />
            </label>

            <label style={styles.label}>
              <span>Ville / Commune *</span>
              <input style={styles.input} value={model.city} onChange={e => setModel({...model, city: e.target.value})} placeholder="Ex: Abidjan, Soubré..." />
            </label>

            <label style={styles.label}>
              <span>Téléphone *</span>
              <input style={styles.input} value={model.phone} onChange={e => setModel({...model, phone: e.target.value})} />
            </label>

            <label style={styles.label}>
              <span>Numéro WhatsApp</span>
              <input style={styles.input} value={model.whatsapp} onChange={e => setModel({...model, whatsapp: e.target.value})} />
            </label>

            <label style={styles.labelFull}>
              <span>Adresse précise</span>
              <textarea style={styles.textarea} rows={2} value={model.address} onChange={e => setModel({...model, address: e.target.value})} />
            </label>
          </div>

          <div style={{ marginTop: 20 }}>
            <span>Photo de la boutique</span>
            <input type="file" ref={fileRef} accept="image/*" onChange={e => e.target.files?.[0] && setPreview(URL.createObjectURL(e.target.files[0]))} />
            {preview && <img src={preview} style={styles.preview} alt="Aperçu" />}
          </div>
        </div>

        <footer style={styles.footer}>
          {error && <span style={{color:'red', fontSize: '13px'}}>{error}</span>}
          <button onClick={onClose} style={styles.cancelBtn}>Annuler</button>
          <button onClick={save} disabled={busy} style={styles.saveBtn}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", zIndex: 1100, backdropFilter: "blur(4px)" },
  modal: { background: "#fff", width: "95%", maxWidth: "600px", borderRadius: "16px", display: "flex", flexDirection: "column", maxHeight: "90vh" },
  header: { padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" },
  body: { padding: "20px", overflowY: "auto" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  label: { display: "flex", flexDirection: "column", gap: "5px", fontSize: "14px", fontWeight: "500" },
  labelFull: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "5px", fontSize: "14px", fontWeight: "500" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" },
  textarea: { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none" },
  preview: { width: "100%", height: "150px", objectFit: "cover", marginTop: "10px", borderRadius: "8px" },
  footer: { padding: "20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" },
  saveBtn: { background: "#0f766e", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  cancelBtn: { background: "none", border: "1px solid #cbd5e1", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", color: "#64748b" },
  closeBtn: { background: "none", border: "none", fontSize: "20px", cursor: "pointer" }
};