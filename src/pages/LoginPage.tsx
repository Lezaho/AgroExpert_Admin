import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState<string | null>(null);

  const { login, error, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from: string | undefined = location.state?.from?.pathname;

  useEffect(() => {
    // Si déjà connecté, passer directement à la redirection par rôle
    if (user) navigate("/post-login", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await login(email.trim(), pass);
      // On laisse onAuthStateChanged charger le rôle, puis PostLogin fera la redirection
      navigate(from ?? "/post-login", { replace: true });
    } catch (err: any) {
      let m = "Impossible de se connecter.";
      if (err.code === "auth/invalid-email") m = "Email invalide.";
      if (err.code === "auth/user-not-found") m = "Utilisateur introuvable.";
      if (err.code === "auth/wrong-password") m = "Mot de passe incorrect.";
      setMsg(m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <form onSubmit={submit} style={styles.card}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0 }}>Connexion Admin</h1>
          <p style={{ color: "#64748b" }}>Callivoire</p>
        </div>

        <label style={styles.label}>
          <span>Email</span>
          <input
            autoFocus
            type="email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom.nom@callivoire.ci"
            required
          />
        </label>

        <label style={styles.label}>
          <span>Mot de passe</span>
          <input
            type="password"
            style={styles.input}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {(msg || error) && (
          <p style={{ color: "#dc2626", marginTop: 4 }}>
            {msg ?? error}
          </p>
        )}

        <button disabled={busy} style={styles.button}>
          {busy ? "Connexion…" : "Se connecter"}
        </button>

        <PasswordResetHint email={email} />
      </form>
    </div>
  );
}

function PasswordResetHint({ email }: { email: string }) {
  const { resetPassword } = useAuth();
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onReset = async () => {
    if (!email) return setInfo("Renseigne d’abord ton email.");
    setBusy(true); setInfo(null);
    try {
      await resetPassword(email.trim());
      setInfo("Email de réinitialisation envoyé (vérifie le spam).");
    } catch (e: any) {
      setInfo("Impossible d’envoyer l’email.");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" onClick={onReset} disabled={busy} style={styles.linkBtn}>
        Mot de passe oublié ?
      </button>
      {info && <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>{info}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#f1f5f9" },
  card: { width: "100%", maxWidth: 420, background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 10px 30px rgba(2, 6, 23, .08)", display: "flex", gap: 12, flexDirection: "column" },
  label: { display: "flex", flexDirection: "column", gap: 6 },
  input: { border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" },
  button: { width: "100%", background: "#0f766e", color: "#fff", border: 0, padding: "10px 12px", borderRadius: 8, cursor: "pointer" },
  linkBtn: { background: "transparent", border: 0, color: "#0f766e", cursor: "pointer", padding: 0 }
};