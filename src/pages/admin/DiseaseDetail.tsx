import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase.ts";
import { doc, getDoc } from "firebase/firestore";

export default function DiseaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [disease, setDisease] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "diseases", id));
        if (snap.exists()) {
          setDisease({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error("Erreur:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div style={styles.center}>Chargement des données...</div>;
  if (!disease) return <div style={styles.center}>Maladie introuvable.</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Retour à la liste</button>

      <div style={styles.card}>
        <div style={styles.imageHeader}>
          <img src={disease.imageUrl || "/placeholder.png"} alt={disease.name} style={styles.mainImg} />
          <div style={styles.cultureBadge}>{disease.culture}</div>
        </div>

        <div style={styles.content}>
          <h1 style={styles.title}>{disease.name}</h1>

          <div style={styles.infoGrid}>
            {/* Description Générale */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Description Générale</h3>
              <p style={styles.text}>{disease.description || "Aucune description fournie."}</p>
            </div>

            {/* Symptômes */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Symptômes & Identification</h3>
              <p style={styles.text}>{disease.symptoms}</p>
            </div>

            {/* Causes */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Causes & Facteurs</h3>
              <p style={styles.text}>{disease.causes || "Information non renseignée."}</p>
            </div>

            {/* Solutions */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Traitements & Solutions</h3>
              <div style={styles.solutionBox}>
                <p style={styles.text}>{disease.solutions || "Aucun traitement suggéré."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: "30px", maxWidth: "1000px", margin: "0 auto" },
  center: { padding: "100px", textAlign: "center", color: "#64748b" },
  backBtn: { background: "none", border: "none", color: "#0f766e", cursor: "pointer", fontWeight: "bold", marginBottom: "20px" },
  card: { background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" },
  imageHeader: { position: "relative", height: "350px" },
  mainImg: { width: "100%", height: "100%", objectFit: "cover" },
  cultureBadge: { position: "absolute", bottom: "20px", left: "20px", background: "#0f766e", color: "#fff", padding: "8px 20px", borderRadius: "30px", fontWeight: "bold", fontSize: "14px" },
  content: { padding: "40px" },
  title: { fontSize: "36px", margin: "0 0 30px 0", color: "#1e293b", borderBottom: "4px solid #f1f5f9", paddingBottom: "15px" },
  infoGrid: { display: "flex", flexDirection: "column", gap: "30px" },
  section: { borderLeft: "4px solid #e2e8f0", paddingLeft: "20px" },
  sectionTitle: { color: "#0f766e", fontSize: "18px", margin: "0 0 10px 0", fontWeight: "bold" },
  text: { color: "#475569", lineHeight: "1.7", margin: 0, whiteSpace: "pre-wrap" },
  solutionBox: { background: "#f0fdf4", padding: "20px", borderRadius: "12px", border: "1px solid #dcfce7" }
};