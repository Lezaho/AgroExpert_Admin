import { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { ArrowUpRight, ArrowDownLeft, History } from "lucide-react";

export default function StockMovements() {
  const [type, setType] = useState<"ENTREE" | "SORTIE">("ENTREE");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProd, setSelectedProd] = useState("");
  const [qty, setQty] = useState(0);

  // Enregistrer un mouvement et mettre à jour le stock réel
  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd || qty <= 0) return;

    try {
      // 1. Ajouter le mouvement à l'historique
      await addDoc(collection(db, "movements"), {
        productId: selectedProd,
        type,
        quantity: qty,
        date: serverTimestamp(),
      });

      // 2. Mettre à jour la quantité dans la collection 'stocks'
      const stockRef = doc(db, "stocks", selectedProd);
      await updateDoc(stockRef, {
        stockInitial: increment(type === "ENTREE" ? qty : -qty)
      });

      alert("Mouvement enregistré !");
    } catch (err) { console.error(err); }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Opérations de Stock</h2>
      
      <div style={styles.grid}>
        {/* FORMULAIRE D'OPÉRATION */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Enregistrer un flux</h3>
          <form onSubmit={handleMovement} style={styles.form}>
            <div style={styles.toggleGroup}>
              <button 
                type="button" 
                onClick={() => setType("ENTREE")}
                style={{...styles.typeBtn, background: type === "ENTREE" ? "#10b981" : "#f1f5f9", color: type === "ENTREE" ? "#fff" : "#64748b"}}
              >
                <ArrowDownLeft size={18} /> Entrée
              </button>
              <button 
                type="button" 
                onClick={() => setType("SORTIE")}
                style={{...styles.typeBtn, background: type === "SORTIE" ? "#ef4444" : "#f1f5f9", color: type === "SORTIE" ? "#fff" : "#64748b"}}
              >
                <ArrowUpRight size={18} /> Sortie
              </button>
            </div>
            
            <label style={styles.label}>Produit concerné</label>
            <select style={styles.input} onChange={(e) => setSelectedProd(e.target.value)}>
              <option value="">Choisir...</option>
              {/* Mapper vos produits ici */}
            </select>

            <label style={styles.label}>Quantité</label>
            <input type="number" style={styles.input} value={qty} onChange={(e) => setQty(parseInt(e.target.value))} />

            <button type="submit" style={styles.submitBtn}>Valider l'opération</button>
          </form>
        </div>

        {/* HISTORIQUE RÉCENT */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><History size={18} /> Historique récent</h3>
          <div style={styles.timeline}>
             {/* Liste des derniers mouvements récupérés de Firestore */}
             <p style={{color:'#94a3b8', textAlign:'center', marginTop:20}}>Aucun mouvement récent</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = { /* ... styles similaires à vos précédents ... */ };