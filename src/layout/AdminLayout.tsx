import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Layers, Bug, Link2, 
  Users, Calculator, Newspaper, LogOut, 
  ChevronLeft, ChevronRight 
} from "lucide-react";
import { auth } from "../firebase/firebase";
import logoImg from "../assets/logo.png"; // Importation de ton logo

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      {/* SIDEBAR */}
      <aside style={{ ...styles.sidebar, width: isCollapsed ? "80px" : "260px" }}>
        
        {/* LOGO EN HAUT À GAUCHE */}
        <div style={{ ...styles.logoContainer, justifyContent: isCollapsed ? "center" : "flex-start" }}>
          <img src={logoImg} alt="Logo" style={{ width: isCollapsed ? "40px" : "150px", transition: "0.3s" }} />
        </div>

        <div style={styles.sidebarHeader}>
          {!isCollapsed && <span style={styles.menuTitle}>Menu Principal</span>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} style={styles.collapseBtn}>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav style={styles.nav}>
          <MenuLink to="dashboard" icon={<LayoutDashboard size={20}/>} label="Tableau de bord" collapsed={isCollapsed} />
          <MenuLink to="diseases" icon={<Layers size={20}/>} label="Pathologies" collapsed={isCollapsed} />
          <MenuLink to="products" icon={<Bug size={20}/>} label="Catalogue Produit" collapsed={isCollapsed} />
          <MenuLink to="distributors" icon={<Link2 size={20}/>} label="Distribution" collapsed={isCollapsed} />
          <MenuLink to="users" icon={<Users size={20}/>} label="Équipe" collapsed={isCollapsed} />
          <MenuLink to="stock" icon={<Calculator size={20}/>} label="Inventaire" collapsed={isCollapsed} />
          <MenuLink to="news" icon={<Newspaper size={20}/>} label="Actualité" collapsed={isCollapsed} />
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfoSection}>
            <div style={styles.avatar}>{auth.currentUser?.email?.charAt(0).toUpperCase() || "A"}</div>
            {!isCollapsed && (
              <div style={styles.userMeta}>
                <span style={styles.userName}>Administrateur</span>
                <span style={styles.userCompany}>AgroExpert Sarl</span>
              </div>
            )}
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} /> 
            {!isCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={styles.main}>
        {/* Barre du haut simplifiée */}
        <header style={styles.topBar}>
           <div style={styles.topBarContent}>
              <span style={styles.topBarTitle}>Espace Administration</span>
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

function MenuLink({ to, icon, label, collapsed }: any) {
  return (
    <NavLink 
      to={to} 
      style={({ isActive }) => ({
        ...styles.navLink,
        background: isActive ? "#064e3b" : "transparent",
        color: isActive ? "#fff" : "#475569",
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "12px 0" : "12px 16px",
      })}
    >
      <div style={styles.iconWrapper}>{icon}</div>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appWrapper: { display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: "'Inter', sans-serif", background: "#f8fafc" },
  sidebar: { background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", padding: "15px 10px", transition: "width 0.3s ease", zIndex: 10 },
  logoContainer: { padding: "10px", marginBottom: "10px", display: "flex", alignItems: "center" },
  sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 5px", marginBottom: "15px" },
  menuTitle: { fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" },
  collapseBtn: { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer", borderRadius: "6px", padding: "4px" },
  nav: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  navLink: { display: "flex", alignItems: "center", gap: "12px", borderRadius: "12px", textDecoration: "none", transition: "0.2s", fontSize: "14px", height: "45px" },
  iconWrapper: { display: "flex", alignItems: "center", justifyContent: "center", width: "24px" },
  sidebarFooter: { marginTop: "auto", borderTop: "1px solid #f1f5f9", paddingTop: "20px" },
  userInfoSection: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px", padding: "0 8px" },
  avatar: { width: "38px", height: "38px", borderRadius: "50%", background: "#064e3b", color: "#fff", display: "grid", placeItems: "center", fontWeight: "bold" },
  userMeta: { display: "flex", flexDirection: "column" },
  userName: { fontSize: "13px", fontWeight: "700", color: "#1e293b" },
  userCompany: { fontSize: "11px", color: "#94a3b8" },
  logoutBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "12px", background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  main: { flex: 1, display: "flex", flexDirection: "column", background: "#fbfcfd" },
  topBar: { height: "60px", display: "flex", alignItems: "center", padding: "0 40px" },
  topBarContent: { width: "100%", display: "flex", justifyContent: "flex-end" },
  topBarTitle: { fontSize: "12px", color: "#94a3b8", fontWeight: "500" },
  contentScroll: { flex: 1, overflowY: "auto", padding: "10px 40px 40px 40px" },
  innerContent: { maxWidth: "1200px", margin: "0 auto" }
};