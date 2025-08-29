// src/pages/Login.tsx
import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/layout/_auth.scss";
import { ThemeContext } from "../context/ThemeContext";
import { pushNotification } from "../utils/notify"; // 🛎️ جديد

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export interface User {
  id: string | number;
  email: string;
  password: string;
  fullName?: string;
  name?: string;
  username?: string;
}

const Login: React.FC<{ setIsLoggedIn?: (v: boolean) => void }> = ({
  setIsLoggedIn,
}) => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!emailRegex.test(email)) {
      setError("Enter a valid email");
      // اختياري: سجل فشل في الإشعارات
      pushNotification("Login failed: invalid email ❌", "error");
      return;
    }
    if (!password) {
      setError("Enter your password");
      // اختياري: سجل فشل في الإشعارات
      pushNotification("Login failed: missing password ❌", "error");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const users: User[] = JSON.parse(
        localStorage.getItem("users_demo") || "[]"
      );
      const user = users.find((u: User) => u.email === email);

      if (!user) {
        setError("No account found with this email");
        setLoading(false);
        // اختياري: سجل فشل في الإشعارات
        pushNotification("Login failed: account not found ❌", "error");
        return;
      }

      if (user.password !== password) {
        setError("Incorrect password");
        setLoading(false);
        // اختياري: سجل فشل في الإشعارات
        pushNotification("Login failed: incorrect password ❌", "error");
        return;
      }

      // success
      setLoading(false);
      localStorage.setItem("currentUser", JSON.stringify(user));
      window.dispatchEvent(new Event("storage")); // 🔥 أضف السطر ده
      const displayName =
        user.username ||
        user.fullName ||
        user.name ||
        (user.email?.split("@")[0] ?? "Friend");

      // 🛎️ إشعار نجاح (هيحدث Badge الجرس فورًا)
      pushNotification(`Welcome back, ${displayName}! 👋`, "success"); // ✅

      if (setIsLoggedIn) setIsLoggedIn(true);
      navigate("/");
    }, 700);
  };

  return (
    <div className={`auth-page ${darkMode ? "dark" : "light"}`}>
      <div className={`auth-card ${darkMode ? "dark" : ""}`}>
        <h2 className="title">Welcome back</h2>
        <p className="subtitle">Sign in to continue</p>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="form-group">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="pw-wrapper">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? "text" : "password"}
                placeholder="Your password"
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <div className="error-text">{error}</div>}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="switch-text">
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
