import React, { useState } from "react";
import { signUp } from "../services/auth";

const SignUp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<'student' | 'staff'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password, displayName, role);
      // remember the chosen role locally for later features
      try { localStorage.setItem('role', role); } catch {}
      alert("Account created. Check email verification if configured.");
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole('student');
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <h3>Sign Up</h3>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div>
        <label htmlFor="displayName">Display name</label>
        <input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create account"}
      </button>
    </form>
  );
};

export default SignUp;
