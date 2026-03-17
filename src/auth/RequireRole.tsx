import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./authStore";
import type { Role } from "./authStore";
import type { JSX } from "react";

export default function RequireRole({
  role: required,
  children,
}: {
  role: Role;
  children: JSX.Element;
}) {
  const { user, role, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Chargement…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (role !== required) {
    return (
      <div style={{ padding: 24 }}>
        Accès refusé (rôle requis : <b>{required}</b>).
      </div>
    );
  }
  return children;
}