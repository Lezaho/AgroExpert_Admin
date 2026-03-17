import { db } from "../firebase/firebase";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  orderBy, query, updateDoc, serverTimestamp, Timestamp
} from "firebase/firestore";
import type { Product } from "../types/product";

const COLLECTION = "products"; 
const colRef = collection(db, COLLECTION);

function normalizeProduct(id: string, data: any): Product {
  return {
    id,
    name: data?.name ?? "",
    type: data?.type ?? "",
    description: data?.description ?? "",
    dose: data?.dose ?? "",
    packaging: data?.packaging ?? "",
    price: typeof data?.price === "number" ? data.price : Number(data?.price ?? 0),
    
    // ✅ AJOUT DES CHAMPS DE GESTION DE STOCK
    stock_quantity: typeof data?.stock_quantity === "number" ? data.stock_quantity : Number(data?.stock_quantity ?? 0),
    unit: data?.unit ?? "Pcs", // Unité par défaut : Pièces

    published: Boolean(data?.published ?? false),
    activeSubstances: Array.isArray(data?.activeSubstances) ? data.activeSubstances : [],
    crops: Array.isArray(data?.crops) ? data.crops : [],
    strengths: data?.strengths ?? undefined,
    application: data?.application ?? undefined,
    logoUrl: data?.logoUrl ?? undefined,
    photoUrl: data?.photoUrl ?? undefined,
    pdfEtiquetteUrl: data?.pdfEtiquetteUrl ?? undefined,
    pdfFdsUrl: data?.pdfFdsUrl ?? undefined,
    createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toMillis()
              : (typeof data?.createdAt === "number" ? data.createdAt : undefined),
    updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toMillis()
              : (typeof data?.updatedAt === "number" ? data.updatedAt : undefined),
  };
}

export async function listProducts(): Promise<Product[]> {
  const q = query(colRef, orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map(d => normalizeProduct(d.id, d.data()));
}

export async function getProduct(id: string): Promise<Product | null> {
  const d = await getDoc(doc(db, COLLECTION, id));
  return d.exists() ? normalizeProduct(d.id, d.data()) : null;
}

export type ProductCreate = Omit<Product, "id" | "createdAt" | "updatedAt">;
export async function createProduct(payload: ProductCreate): Promise<string> {
  const res = await addDoc(colRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return res.id;
}

// ✅ ProductPatch mis à jour pour accepter les nouveaux champs
export type ProductPatch = Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>;

export async function updateProduct(id: string, patch: ProductPatch): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erreur détaillée lors de l'update Firestore :", error);
    throw error;
  }
}

export async function removeProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}