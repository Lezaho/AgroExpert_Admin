import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Bug, Package, MapPin, 
  Newspaper, Users, LogOut, Leaf, 
  BoxesIcon 
} from "lucide-react";
import { auth } from "../firebase/firebase";

interface MenuLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  return (
    <div style={styles.appWrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoCircle}>
            <Leaf size={20} color="#fff" fill="#fff" />
          </div>
          <h1 style={styles.logoText}>AGROEXPERT</h1>
        </div>

        <nav style={styles.nav}>
          <MenuLink to="dashboard" icon={<LayoutDashboard size={20}/>} label="Tableau de bord" />
          <MenuLink to="diseases" icon={<Bug size={20}/>} label="Pathologies" />
          <MenuLink to="products" icon={<Package size={20}/>} label="Catalogue Produits" />
          {/* Ce lien pointera vers la route "stock" qui affiche InventoryManagement */}
          <MenuLink to="stock" icon={<BoxesIcon size={20}/>} label="Gestion de Stock" />
          <MenuLink to="distributors" icon={<MapPin size={20}/>} label="Distributeurs" />
          <MenuLink to="news" icon={<Newspaper size={20}/>} label="Actualités" />
          <MenuLink to="users" icon={<Users size={20}/>} label="Utilisateurs" />
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} /> <span>Déconnexion</span>
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.topBar}>
          <div style={styles.adminInfo}>
            <span style={styles.roleTag}>Administrateur</span>
            <span style={styles.emailText}>{auth.currentUser?.email}</span>
          </div>
        </header>
        <div style={styles.contentScroll}>
          <div style={styles.innerContent}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

function MenuLink({ to, icon, label }: MenuLinkProps) {
  return (
    <NavLink 
      to={to} 
      style={({ isActive }) => ({
        ...styles.navLink,
        background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
        color: isActive ? "#fff" : "#cbd5e1",
        fontWeight: isActive ? "600" : "400",
        borderLeft: isActive ? "4px solid #10b981" : "4px solid transparent",
      })}
    >
      {icon} <span>{label}</span>
    </NavLink>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appWrapper: { display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "'Inter', sans-serif", background: "#f8fafc" },
  sidebar: { width: "260px", background: "#064e3b", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 16px" },
  logoSection: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px", padding: "0 10px" },
  logoCircle: { width: "36px", height: "36px", background: "#10b981", borderRadius: "10px", display: "grid", placeItems: "center" },
  logoText: { fontSize: "18px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navLink: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 12px", borderRadius: "0 8px 8px 0", textDecoration: "none", transition: "all 0.2s", fontSize: "14px" },
  logoutBtn: { marginTop: "auto", display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "rgba(255,255,255,0.05)", border: "none", color: "#fca5a5", borderRadius: "10px", cursor: "pointer" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  topBar: { height: "70px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 30px" },
  adminInfo: { display: "flex", alignItems: "center", gap: "12px" },
  roleTag: { fontSize: "10px", textTransform: "uppercase", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569", fontWeight: "bold" },
  emailText: { fontSize: "13px", color: "#1e293b" },
  contentScroll: { flex: 1, overflowY: "auto", padding: "30px" },
  innerContent: { maxWidth: "1100px", margin: "0 auto" }
};