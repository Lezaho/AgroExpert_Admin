import { useEffect, useRef, useState } from "react";
import { db } from "../../firebase/firebase.ts";
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { uploadToCloudinary } from "../../utils/cloudinary.ts";

const CATEGORIES = ["Conseils", "Météo", "Prix du Marché", "Événements", "Alertes"];

export default function NewsForm({ open, onClose, newsId, onSaved }: any) {
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState({ title: "", category: "Conseils", content: "", imageUrl: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && newsId) {
      (async () => {
        const snap = await getDoc(doc(db, "news", newsId));
        if (snap.exists()) {
          const data = snap.data() as any;
          setModel(data);
          setPreview(data.imageUrl);
        }
      })();
    } else {
      setModel({ title: "", category: "Conseils", content: "", imageUrl: "" });
      setPreview(null);
    }
  }, [open, newsId]);

  const save = async () => {
    if (!model.title || !model.content) return alert("Titre et contenu requis");
    setBusy(true);
    try {
      let url = model.imageUrl;
      const file = fileRef.current?.files?.[0];
      if (file) url = await uploadToCloudinary(file, "image");

      const finalData = { ...model, imageUrl: url, updatedAt: serverTimestamp() };

      if (newsId) {
        await updateDoc(doc(db, "news", newsId), finalData);
      } else {
        await addDoc(collection(db, "news"), { ...finalData, createdAt: serverTimestamp() });
      }
      onSaved();
      onClose();
    } catch (e) { console.error(e); } finally { setBusy(false); }
  };

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2>{newsId ? "Modifier" : "Nouvel"} Article</h2>
        </header>
        <div style={styles.body}>
          <label style={styles.label}>Titre de l'actualité
            <input style={styles.input} value={model.title} onChange={e => setModel({...model, title: e.target.value})} />
          </label>
          <label style={styles.label}>Catégorie
            <select style={styles.input} value={model.category} onChange={e => setModel({...model, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={styles.label}>Contenu de l'article
            <textarea style={styles.textarea} rows={8} value={model.content} onChange={e => setModel({...model, content: e.target.value})} />
          </label>
          <div style={{ marginTop: 10 }}>
            <span>Image de couverture</span>
            <input type="file" ref={fileRef} accept="image/*" onChange={e => e.target.files?.[0] && setPreview(URL.createObjectURL(e.target.files[0]))} />
            {preview && <img src={preview} style={styles.preview} alt="" />}
          </div>
        </div>
        <footer style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Annuler</button>
          <button onClick={save} disabled={busy} style={styles.saveBtn}>{busy ? "Enregistrement..." : "Publier"}</button>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "grid", placeItems: "center", zIndex: 1200 },
  modal: { background: "#fff", width: "90%", maxWidth: "600px", borderRadius: "12px", overflow: "hidden" },
  header: { padding: "20px", borderBottom: "1px solid #eee" },
  body: { padding: "20px", display: "flex", flexDirection: "column", gap: "15px" },
  label: { display: "flex", flexDirection: "column", gap: "5px", fontWeight: "600", fontSize: "14px" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd" },
  textarea: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", resize: "none" },
  preview: { width: "100%", height: "120px", objectFit: "cover", marginTop: "10px", borderRadius: "6px" },
  footer: { padding: "20px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: "10px" },
  saveBtn: { background: "#0f766e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" },
  cancelBtn: { background: "#f1f5f9", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer" }
};