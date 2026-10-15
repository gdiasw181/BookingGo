
import React, { useState } from "react";
import { signIn, signOut } from "../services/auth";

type Props = {
  onSuccess?: () => void;
  onLogin?: (user: { email?: string } | null) => void;
};

const SignIn: React.FC<Props> = ({ onSuccess, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn(email, password);
      console.log("Signed in", res);

      setLoading(false);

      // Firebase email can be null.
      // Convert null to undefined to match the callback type.
      onLogin?.({ email: res.user?.email ?? undefined });
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

      {error && (
        <div style={{ color: "red" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <hr />

      <button onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
};

export default SignIn;
