// src/pages/Register.tsx
import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/layout/_auth.scss";
import { ThemeContext } from "../context/ThemeContext";
import { pushNotification } from "../utils/notify";

type Gender = "male" | "female" | "";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/;

function calcPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const label = ["Very weak", "Weak", "Okay", "Strong", "Very strong"][
    Math.min(score, 4)
  ];
  return { score, label };
}

const Register: React.FC<{ setIsLoggedIn?: (v: boolean) => void }> = ({
  setIsLoggedIn,
}) => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [bio, setBio] = useState(""); // 🆕 bio state
  const [terms, setTerms] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const pwStrength = calcPasswordStrength(password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Please enter your full name";
    if (!usernameRegex.test(username))
      e.username = "Username: 3-30 chars, letters/numbers/._-";
    if (!emailRegex.test(email)) e.email = "Invalid email";
    if (email !== confirmEmail) e.confirmEmail = "Emails do not match";
    if (password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))
      e.password =
        (e.password ? e.password + " • " : "") + "Include an uppercase letter";
    if (!/[0-9]/.test(password))
      e.password = (e.password ? e.password + " • " : "") + "Include a number";
    if (!/[^A-Za-z0-9]/.test(password))
      e.password =
        (e.password ? e.password + " • " : "") + "Include a special character";
    if (password !== confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!terms) e.terms = "You must accept Terms & Privacy";
    if (dob) {
      const diff = Date.now() - new Date(dob).getTime();
      const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      if (age < 13) e.dob = "You must be at least 13 years old";
    } else {
      e.dob = "Please provide your date of birth";
    }
    return e;
  };

  const handleSubmit = (ev?: React.FormEvent) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      pushNotification("Registration failed ❌ Please check the form", "error");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem("users_demo") || "[]");

      const newUser = {
        id: Date.now(),
        fullName,
        username,
        email: email.trim().toLowerCase(),
        password: password.trim(),
        phone,
        dob,
        gender,
        bio, // 🆕 نضيف الـbio
      };

      users.unshift(newUser);

      localStorage.setItem("users_demo", JSON.stringify(users));
      localStorage.setItem("currentUser", JSON.stringify(newUser));
      window.dispatchEvent(new Event("storage"));

      setSubmitting(false);
      if (setIsLoggedIn) setIsLoggedIn(true);

      pushNotification(
        `Welcome, ${fullName}! 🎉 Your account is ready.`,
        "success"
      );

      navigate("/profile");
    }, 900);
  };

  return (
    <div className={`auth-page ${darkMode ? "dark" : "light"}`}>
      <div className={`auth-card ${darkMode ? "dark" : ""}`}>
        <h2 className="title">Create your account</h2>
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* full name & username */}
          <div className="row">
            <div className="form-group">
              <label>Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <div className="error-text">{errors.fullName}</div>
              )}
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
              />
              {errors.username && (
                <div className="error-text">{errors.username}</div>
              )}
            </div>
          </div>

          {/* email & confirm email */}
          <div className="form-group">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
            />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>Confirm email</label>
            <input
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="you@mail.com"
            />
            {errors.confirmEmail && (
              <div className="error-text">{errors.confirmEmail}</div>
            )}
          </div>

          {/* password & confirm password */}
          <div className="row">
            <div className="form-group">
              <label>Password</label>
              <div className="pw-wrapper">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  type={showPw ? "text" : "password"}
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              <div className="pw-meta">
                <div className={`strength strength-${pwStrength.score}`}></div>
                <div className="strength-label">{pwStrength.label}</div>
              </div>
              {errors.password && (
                <div className="error-text">{errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                type="password"
              />
              {errors.confirmPassword && (
                <div className="error-text">{errors.confirmPassword}</div>
              )}
            </div>
          </div>

          {/* phone & dob */}
          <div className="row">
            <div className="form-group">
              <label>Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+201234567890"
              />
            </div>

            <div className="form-group">
              <label>Date of birth</label>
              <input
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                type="date"
              />
              {errors.dob && <div className="error-text">{errors.dob}</div>}
            </div>
          </div>

          {/* gender */}
          <div className="row small-gap">
            <div className="form-group inline">
              <label>Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* 🆕 bio */}
          <div className="form-group">
            <label>Bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a short bio about yourself..."
            />
          </div>

          {/* terms */}
          <div className="form-group terms">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              I agree to the <Link to="/terms">Terms</Link> &{" "}
              <Link to="/privacy">Privacy</Link>.
            </label>
            {errors.terms && <div className="error-text">{errors.terms}</div>}
          </div>

          <button type="submit" className="btn-auth" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>

          <p className="switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
