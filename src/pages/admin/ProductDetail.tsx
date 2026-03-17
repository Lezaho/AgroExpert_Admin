import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProduct } from "../../api/productsApi";
import type { Product } from "../../types/product";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const p = await getProduct(id);
        setProduct(p);
      } catch (e) {
        console.error("Erreur chargement produit:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div style={styles.center}>Chargement du produit...</div>;
  if (!product) return <div style={styles.center}>Produit introuvable.</div>;

  return (
    <div style={styles.container}>
      {/* Bouton Retour */}
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Retour au catalogue
      </button>

      <div style={styles.mainGrid}>
        {/* COLONNE GAUCHE : IMAGE */}
        <div style={styles.imageSection}>
          <div style={styles.card}>
            <img 
              src={product.photoUrl || "/placeholder-product.png"} 
              alt={product.name} 
              style={styles.mainImage} 
            />
            {product.logoUrl && (
              <img src={product.logoUrl} alt="Logo" style={styles.brandLogo} />
            )}
          </div>
        </div>

        {/* COLONNE DROITE : INFOS */}
        <div style={styles.infoSection}>
          <div style={styles.header}>
            <span style={styles.badge}>{product.type}</span>
            <h1 style={styles.title}>{product.name}</h1>
            <p style={styles.price}>{product.price?.toLocaleString()} FCFA</p>
          </div>

          <div style={styles.content}>
            <h3 style={styles.sectionTitle}>Description</h3>
            <p style={styles.description}>{product.description}</p>

            <h3 style={styles.sectionTitle}>Cultures cibles</h3>
            <div style={styles.tagContainer}>
              {product.crops?.map((c) => (
                <span key={c} style={styles.tag}>{c}</span>
              ))}
            </div>

            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <strong>Dose & Application :</strong>
                <span>{product.dose || "Non spécifié"}</span>
              </div>
              <div style={styles.detailItem}>
                <strong>Conditionnement :</strong>
                <span>{product.packaging}</span>
              </div>
              {product.activeSubstances?.length > 0 && (
                <div style={styles.detailItem}>
                  <strong>Substances actives :</strong>
                  <span>{product.activeSubstances.join(", ")}</span>
                </div>
              )}
            </div>

            {/* DOCUMENTS PDF */}
            <div style={styles.docSection}>
              <h3 style={styles.sectionTitle}>Documents techniques</h3>
              <div style={styles.docGrid}>
                {product.pdfEtiquetteUrl && (
                  <a href={product.pdfEtiquetteUrl} target="_blank" rel="noreferrer" style={styles.docLink}>
                    📄 Étiquette Produit (PDF)
                  </a>
                )}
                {product.pdfFdsUrl && (
                  <a href={product.pdfFdsUrl} target="_blank" rel="noreferrer" style={styles.docLink}>
                    🛡️ Fiche de Sécurité (FDS)
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" },
  center: { display: "grid", placeItems: "center", height: "50vh", fontSize: "18px" },
  backBtn: { background: "none", border: "none", color: "#0f766e", cursor: "pointer", marginBottom: "20px", fontWeight: "600" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "40px", alignItems: "start" },
  imageSection: { position: "relative" },
  card: { background: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", textAlign: "center" },
  mainImage: { width: "100%", height: "auto", maxHeight: "500px", objectFit: "contain", borderRadius: "8px" },
  brandLogo: { position: "absolute", top: "20px", right: "20px", width: "60px", height: "60px", background: "#fff", padding: "5px", borderRadius: "50%", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" },
  infoSection: { display: "flex", flexDirection: "column", gap: "20px" },
  badge: { background: "#f0fdf4", color: "#166534", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", display: "inline-block", width: "fit-content" },
  title: { fontSize: "36px", margin: "10px 0", color: "#1e293b" },
  price: { fontSize: "24px", fontWeight: "bold", color: "#0f766e" },
  sectionTitle: { fontSize: "18px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px", marginTop: "20px", color: "#334155" },
  description: { lineHeight: "1.6", color: "#64748b" },
  tagContainer: { display: "flex", flexWrap: "wrap", gap: "8px", margin: "10px 0" },
  tag: { background: "#f1f5f9", padding: "5px 12px", borderRadius: "6px", fontSize: "14px", color: "#475569" },
  detailsGrid: { display: "grid", gap: "15px", marginTop: "20px", background: "#f8fafc", padding: "20px", borderRadius: "12px" },
  detailItem: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px" },
  docSection: { marginTop: "30px" },
  docGrid: { display: "grid", gap: "10px" },
  docLink: { display: "block", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", textDecoration: "none", color: "#1e293b", fontWeight: "500", transition: "0.2s" },
};