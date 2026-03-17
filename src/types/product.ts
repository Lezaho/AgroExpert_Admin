/**
 * Liste des types de produits autorisés dans l'application.
 * (On laisse string dans Product pour ne pas bloquer les variantes,
 * mais on garde cette liste pour alimenter les dropdowns du formulaire.)
 */
export const PRODUCT_TYPES = [
  "Herbicide",
  "Fongicide",
  "Insecticide",
  "Bioinsecticide",
  "Bio-insecticide",
  "Biofongicide",
  "Biostimulant",
  "Nématicide",
  "biocontroles",
  "Engrais",
  "Adjuvant",
  "Absorbant",
  "Appareils",
  "Equipement de protection",
  "Hygine publique",
  "Irrigation",
  "Molusicide",
  "Outils",
  "Pheromones",
  "Raticides",
  "Semences",
] as const;

/** Type strict optionnel : si tu veux forcer le dropdown */
export type ProductType = (typeof PRODUCT_TYPES)[number];

/**
 * Cultures disponibles dans ton UI
 */
export const CULTURE_OPTIONS = [
  "Cacao",
  "Tomate",
  "Riz",
  "Oignon",
  "Maïs",
  "Aubergine",
  "Banane",
  "Piment",
  "Carote",
  "Concombre",
  "Courgette",
  "Gazon",
  "Gombo",
  "Haricot",
  "Poivron",
] as const;

/**
 * Structure complète d’un produit dans Firestore.
 * Les champs obligatoires sont alignés avec tes règles Firestore.
 */
export type Product = {
  /** Identifiant Firestore */
  id: string;

  /** Champs requis */
  name: string;
  type: string;              // on laisse string pour éviter blocage accents / libellés
  description: string;
  dose: string;              // "Dose et application" (fusionné)
  packaging: string;         // Conditionnement
  price: number;             // FCFA (number obligatoire)
  published: boolean;

  stock_quantity: number;    // Quantité en stock
  unit: string;

  /** Listes */
  activeSubstances: string[];  // Substances actives
  crops: string[];             // Cultures / usages

  /** Champs optionnels */
  strengths?: string;          // Points forts
  application?: string;        // (si jamais tu l'utilises encore)
  logoUrl?: string;            // Cloudinary image
  photoUrl?: string;           // Cloudinary image
  pdfEtiquetteUrl?: string;    // Cloudinary raw/pdf
  pdfFdsUrl?: string;          // Cloudinary raw/pdf

  /** Timestamps Firestore -> convertis en number (ms) dans l'API */
  createdAt?: number;
  updatedAt?: number;
};

/**
 * Pour créer un produit (sans id, createdAt, updatedAt)
 */
export type ProductCreate = Omit<Product, "id" | "createdAt" | "updatedAt">;

/**
 * Pour mise à jour Firestore partielle (patch)
 */
export type ProductPatch = Partial<Omit<Product, "id">>;

/**
 * Valeur par défaut pour initialiser un formulaire
 */
export const DEFAULT_PRODUCT: ProductCreate = {
  name: "",
  type: "Fongicide",
  description: "",
  dose: "",
  packaging: "",
  price: 0,
  published: false,
  activeSubstances: [],
  crops: [],
  strengths: "",
  application: "",
  logoUrl: "",
  photoUrl: "",
  pdfEtiquetteUrl: "",
  pdfFdsUrl: "",
  stock_quantity: 0,
  unit: ""
};