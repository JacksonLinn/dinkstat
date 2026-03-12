"use client";

import { useState } from "react";
import { registerUser, loginUser } from "@/lib/firebase";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) return setError("Enter your email");
    if (!pass) return setError("Enter your password");
    setLoading(true);
    try {
      const player = await loginUser(email.trim(), pass);
      onLogin(player);
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("No account found with that email/password");
      } else if (err.code === "auth/wrong-password") {
        setError("Wrong password");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!firstName.trim() || !lastName.trim())
      return setError("Enter your first and last name");
    if (!email.trim()) return setError("Enter your email");
    if (!pass) return setError("Enter a password");
    if (pass.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const player = await registerUser(
        email.trim(),
        pass,
        firstName.trim(),
        lastName.trim()
      );
      onLogin(player);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with that email already exists");
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl px-4 py-3 bg-white/[0.06] border border-dark-border text-[#F0F0F5] font-display text-sm outline-none focus:border-neon";

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center font-display">
      <div
        className="fixed pointer-events-none"
        style={{
          top: -300,
          right: -300,
          width: 800,
          height: 800,
          background:
            "radial-gradient(circle,rgba(191,255,0,0.06) 0%,transparent 70%)",
        }}
      />

      <div
        className="bg-dark-card border border-dark-border rounded-3xl w-[440px]"
        style={{ padding: "44px 40px", animation: "fadeUp 0.6s ease both" }}
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-[60px] h-[60px] rounded-2xl mx-auto mb-3.5 bg-gradient-to-br from-neon to-[#7CFF00] flex items-center justify-center text-3xl">
            
          </div>
          <h1 className="text-[28px] font-extrabold text-[#F0F0F5]">
            DINK<span className="text-neon">STAT</span>
          </h1>
          <p className="text-[#7A7A8E] text-[13px] font-mono mt-1.5">
            {mode === "login"
              ? "Sign in to your account"
              : "Create a new account — start at 0 LP"}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-xl p-[3px]">
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg border-none cursor-pointer text-[13px] font-semibold font-display transition-all ${
                mode === m
                  ? "bg-neon text-dark-bg"
                  : "bg-transparent text-[#7A7A8E]"
              }`}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {mode === "register" && (
            <div className="flex gap-2.5">
              <input
                className={inputCls}
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          )}

          <input
            className={inputCls}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className={inputCls}
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              (mode === "login" ? handleLogin() : handleRegister())
            }
          />

          {error && (
            <div className="text-loss text-xs font-mono px-3 py-1.5 bg-loss/10 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={loading}
            className="bg-neon text-dark-bg border-none rounded-xl py-3 text-[15px] font-bold cursor-pointer font-display hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}