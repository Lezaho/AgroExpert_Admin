import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// Layouts & Auth
import AdminLayout from "./layout/AdminLayout";
import RequireRole from "./auth/RequireRole";

// Pages Authentification
import LoginPage from "./pages/LoginPage";
import PostLogin from "./pages/PostLogin";

// Pages Administration
import Dashboard from "./pages/admin/Dashboard";
import ProductsList from "./pages/admin/ProductsList";
import ProductDetail from "./pages/admin/ProductDetail";
import DiseasesList from "./pages/admin/DiseasesList";
import DiseaseDetail from "./pages/admin/DiseaseDetail";
import DistributorsList from "./pages/admin/DistributorsList";
import UsersList from "./pages/admin/UsersList";
import NewsList from "./pages/admin/NewsList";

// AJOUT : Import de la page de gestion de stock
import InventoryManagement from "./pages/admin/InventoryManagement"; 
import ItineraryForm from "./pages/admin/ItineraryForm";
import ItineraryDetail from "./pages/admin/ItineraryDetail";

/**
 * Composant de secours pour les fonctionnalités secondaires
 */
function Stub({ title }: { title: string }) {
  return (
    <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
      <h3>{title}</h3>
      <p>Cette section est en cours de configuration.</p>
    </div>
  );
}

const router = createBrowserRouter([
  // --- ROUTES PUBLIQUES ---
  { path: "/login", element: <LoginPage /> },
  { path: "/post-login", element: <PostLogin /> },

  // --- ESPACE ADMINISTRATION (SÉCURISÉ) ---
  {
    path: "/admin",
    element: (
      <RequireRole role="admin">
        <AdminLayout />
      </RequireRole>
    ),
    children: [
      // Redirection par défaut vers le Dashboard
      { index: true, element: <Navigate to="dashboard" replace /> },
      
      { path: "dashboard", element: <Dashboard /> },

      // Module Produits
      
        {
  path: "products",
  children: [
    { index: true, element: <ProductsList /> },
    { path: "itineraries/new", element: <ItineraryForm /> },
    { path: "itineraries/view/:id", element: <ItineraryDetail /> }, // <-- Cette ligne est cruciale
    { path: ":id", element: <ProductDetail /> },
  ],
},

      // Module Gestion de Stock (MISE À JOUR ICI)
      { path: "stock", element: <InventoryManagement /> },
      
      { path: "stock/list", element: <InventoryManagement /> }, // La liste et l'ajout (votre formulaire)
      

      // Module Pathologies (Maladies)
      {
        path: "diseases",
        children: [
          { index: true, element: <DiseasesList /> },
          { path: ":id", element: <DiseaseDetail /> },
        ],
      },

      // Module Actualités (News)
      {
        path: "news",
        children: [
          { index: true, element: <NewsList /> },
        ],
      },

      // Module Utilisateurs
      { path: "users", element: <UsersList /> },

      // Module Distributeurs
      { path: "distributors", element: <DistributorsList /> },

      // Paramètres
      { path: "settings", element: <Stub title="Paramètres Système" /> },
    ],
  },

  // --- REDIRECTION PAR DÉFAUT (FALLBACK) ---
  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}