import React, { useState } from "react";
import { signIn, signOut } from "../services/auth";

type Props = {
  onSuccess?: () => void;
  onLogin?: (user: { email?: string; role?: string } | null) => void;
};

const SignIn: React.FC<Props> = ({ onSuccess, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<'student' | 'staff'>(() => {
    try { return (localStorage.getItem('role') as 'student' | 'staff') || 'student' } catch { return 'student' }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn(email, password, role);
      console.log("Signed in", res);
      // Stop loading before navigating or notifying parent to avoid updating
      // state on an unmounted component if the parent unmounts this form.
      setLoading(false);
      // persist chosen role locally for later features
      try { localStorage.setItem('role', role); } catch {}
      // Notify parent and navigate if requested, include role
      onLogin?.({ email: res.user?.email, role });
      onSuccess?.();
      alert("Signed in");
      return;
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    alert("Signed out");
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <h3>Sign In</h3>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>Account type</label>
        <label style={{ marginRight: 12 }}>
          <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} /> Student
        </label>
        <label>
          <input type="radio" name="role" value="staff" checked={role === 'staff'} onChange={() => setRole('staff')} /> Academic staff
        </label>
      </div>
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      <hr />
      <button onClick={handleSignOut}>Sign out</button>
    </div>
  );
};

export default SignIn;
