import { useEffect, useRef, useState } from "react";
import { db } from "../../firebase/firebase.ts";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../../utils/cloudinary.ts";

type Props = {
  open: boolean;
  onClose: () => void;
  diseaseId?: string;
  onSaved: () => void;
};

const CULTURES = [
  "Cacao", "Tomate", "Riz", "Oignon", "Maïs", "Aubergine", "Banane", 
  "Piment", "Carote", "Concombre", "Courgette", "Gazon", "Gombo", "Haricot", "Poivron"
];

export default function DiseaseForm({ open, onClose, diseaseId, onSaved }: Props) {
  const isEdit = Boolean(diseaseId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialisation propre de l'état
  const [model, setModel] = useState({
    name: "",
    culture: "Cacao",
    description: "",
    symptoms: "",
    causes: "",
    solutions: "",
    imageUrl: "",
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Reset ou Chargement des données à l'ouverture
  useEffect(() => {
    if (!open) return;
    
    if (!diseaseId) {
      setModel({ name: "", culture: "Cacao", description: "", symptoms: "", causes: "", solutions: "", imageUrl: "" });
      setPreview(null);
      setError(null);
    } else {
      const loadData = async () => {
        try {
          const snap = await getDoc(doc(db, "diseases", diseaseId));
          if (snap.exists()) {
            const data = snap.data();
            setModel(prev => ({ ...prev, ...data }));
            setPreview(data.imageUrl || null);
          }
        } catch (err) {
          console.error("Erreur de chargement:", err);
          setError("Impossible de charger les données.");
        }
      };
      loadData();
    }
  }, [open, diseaseId]);

  const save = async () => {
    // Validation simple
    if (!model.name.trim() || !model.symptoms.trim()) {
      return setError("Le nom et les symptômes sont obligatoires.");
    }

    setBusy(true);
    setError(null);

    try {
      let currentId = diseaseId;
      let finalImageUrl = model.imageUrl;

      // 1. Gérer l'image d'abord si un nouveau fichier est sélectionné
      const file = fileRef.current?.files?.[0];
      if (file) {
        try {
          finalImageUrl = await uploadToCloudinary(file, "image");
        } catch (imgErr) {
          console.error("Erreur Cloudinary:", imgErr);
          throw new Error("Échec de l'envoi de l'image.");
        }
      }

      const dataToSave = { ...model, imageUrl: finalImageUrl };

      // 2. Sauvegarder dans Firestore
      if (isEdit && diseaseId) {
        await updateDoc(doc(db, "diseases", diseaseId), dataToSave);
      } else {
        const docRef = await addDoc(collection(db, "diseases"), dataToSave);
        currentId = docRef.id;
      }

      console.log("Enregistrement réussi ! ID:", currentId);
      onSaved();
      onClose();
    } catch (e: any) {
      console.error("Erreur Save:", e);
      setError(e.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2 style={{ margin: 0 }}>{isEdit ? "Modifier" : "Nouvelle"} Pathologie</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </header>

        <div style={styles.body}>
          <div style={styles.grid}>
            <div style={styles.label}>
              <span>Nom de la maladie *</span>
              <input 
                style={styles.input} 
                value={model.name} 
                onChange={e => setModel({...model, name: e.target.value})} 
              />
            </div>

            <div style={styles.label}>
              <span>Culture *</span>
              <select 
                style={styles.input} 
                value={model.culture} 
                onChange={e => setModel({...model, culture: e.target.value})}
              >
                {CULTURES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={styles.labelFull}>
              <span>Description Générale</span>
              <textarea 
                style={styles.textarea} 
                rows={2} 
                value={model.description} 
                onChange={e => setModel({...model, description: e.target.value})} 
              />
            </div>

            <div style={styles.labelFull}>
              <span>Symptômes *</span>
              <textarea 
                style={styles.textarea} 
                rows={3} 
                value={model.symptoms} 
                onChange={e => setModel({...model, symptoms: e.target.value})} 
              />
            </div>

            <div style={styles.label}>
              <span>Causes</span>
              <textarea 
                style={styles.textarea} 
                rows={2} 
                value={model.causes} 
                onChange={e => setModel({...model, causes: e.target.value})} 
              />
            </div>

            <div style={styles.label}>
              <span>Solutions</span>
              <textarea 
                style={styles.textarea} 
                rows={2} 
                value={model.solutions} 
                onChange={e => setModel({...model, solutions: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <span style={{ display: "block", marginBottom: 5 }}>Image</span>
            <input 
              type="file" 
              ref={fileRef} 
              accept="image/*" 
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setPreview(URL.createObjectURL(f));
              }} 
            />
            {preview && <img src={preview} style={styles.preview} alt="Aperçu" />}
          </div>
        </div>

        <footer style={styles.footer}>
          {error && <div style={styles.errorText}>{error}</div>}
          <button onClick={onClose} style={styles.cancelBtn}>Annuler</button>
          <button onClick={save} disabled={busy} style={styles.saveBtn}>
            {busy ? "Patientez..." : "Enregistrer"}
          </button>
        </footer>
      </div>
    </div>
  );
}

// Styles inchangés ou légèrement nettoyés
const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modal: { background: "#fff", width: "90%", maxWidth: "650px", borderRadius: "12px", maxHeight: "95vh", display: "flex", flexDirection: "column" },
  header: { padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" },
  body: { padding: "20px", overflowY: "auto" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" },
  label: { display: "flex", flexDirection: "column", gap: "5px", fontSize: "13px", fontWeight: "600" },
  labelFull: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "5px", fontSize: "13px", fontWeight: "600" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", outline: "none" },
  textarea: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", outline: "none", fontFamily: "inherit" },
  preview: { width: "120px", height: "80px", objectFit: "cover", marginTop: "10px", borderRadius: "6px", border: "1px solid #eee" },
  footer: { padding: "15px 20px", borderTop: "1px solid #eee", display: "flex", gap: "10px", alignItems: "center" },
  saveBtn: { background: "#0f766e", color: "#fff", border: "none", padding: "10px 25px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  cancelBtn: { background: "#f1f5f9", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" },
  closeBtn: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8" },
  errorText: { color: "#e11d48", flex: 1, fontSize: "12px" }
};