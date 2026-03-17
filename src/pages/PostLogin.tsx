import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authStore";

export default function PostLogin() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Pas de async directement ici
    const run = async () => {
      if (loading) return;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      // Redirections selon rôle
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "staff") {
        navigate("/staff/home", { replace: true });
      } else {
        navigate("/app/home", { replace: true });
      }
    };
    run();
  }, [user, role, loading, navigate]);

  return <div style={{ padding: 24 }}>Redirection…</div>;
}
