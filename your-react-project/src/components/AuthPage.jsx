import { useState } from "react";

// JWT tokenning ichidagi ma'lumotni (masalan is_staff) o'qish uchun
export function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (err) {
    return null;
  }
}

// Backend manzilini shu yerda o'zgartiring (Django server manzili)
const API_BASE = "http://127.0.0.1:8000/api/v1";

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem("token");
    return saved && saved !== "undefined" && saved !== "null" ? saved : null;
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPassword2, setShowRegPassword2] = useState(false);

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    password: "",
    password2: "",
  });

  function updateLogin(field, value) {
    setLoginData((prev) => ({ ...prev, [field]: value }));
  }

  function updateRegister(field, value) {
    setRegisterData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setFormError("");
    setErrors({});
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        setFormError(
          data.non_field_errors?.[0] ||
            data.detail ||
            JSON.stringify(data) ||
            "Username yoki parol noto'g'ri."
        );
        return;
      }
      if (!data.access) {
        setFormError(
          "Server javobida 'access' topilmadi. Kelgan javob: " + JSON.stringify(data)
        );
        return;
      }
      setToken(data.access);
      localStorage.setItem("token", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);
      onAuthSuccess?.(data.access);
    } catch (err) {
      if (err.name === "AbortError") {
        setFormError(
          "Server 8 soniya ichida javob bermadi (vaqt tugadi). Backend ishlab turganini tekshiring."
        );
      } else {
        setFormError("Xato: " + err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setFormError("");
    setErrors({});

    if (registerData.password !== registerData.password2) {
      setErrors({ password2: ["Parollar mos kelmadi."] });
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const { password2, ...payload } = registerData;
      const res = await fetch(`${API_BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        setFormError(
          `Server javobini o'qib bo'lmadi (status ${res.status}). Backend ishlab turganini tekshiring.`
        );
        return;
      }

      if (!res.ok) {
        if (typeof data === "object" && data !== null) {
          setErrors(data);
          setFormError(
            data.detail || data.non_field_errors?.[0] || "Ro'yxatdan o'tishda xatolik yuz berdi."
          );
        } else {
          setFormError("Ro'yxatdan o'tishda xatolik yuz berdi. Status: " + res.status);
        }
        return;
      }

      const authToken = data.token || data.access;
      if (!authToken) {
        setFormError(
          "Server javobida token topilmadi. Kelgan javob: " + JSON.stringify(data)
        );
        return;
      }
      setToken(authToken);
      localStorage.setItem("token", authToken);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);
      onAuthSuccess?.(authToken);
    } catch (err) {
      if (err.name === "AbortError") {
        setFormError(
          "Server 8 soniya ichida javob bermadi (vaqt tugadi). Backend ishga tushganini tekshiring."
        );
      } else {
        setFormError("Xato: " + err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
      });
    } catch (err) {
      // Server bilan bog'lanmasa ham, mahalliy tokenni baribir tozalaymiz
    }
    localStorage.removeItem("token");
    setToken(null);
  }

  function EyeToggle({ visible, onToggle }) {
    return (
      <button
        type="button"
        className="eye-btn"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.7 9.7 0 0 1 12 5c5 0 8.7 3.6 10 7-.5 1.3-1.3 2.6-2.4 3.7M6.5 6.5C4.6 7.8 3.1 9.7 2 12c1.3 3.4 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
      </button>
    );
  }

  function fieldError(field) {
    if (!errors[field]) return null;
    const msg = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    return <p className="field-error">{msg}</p>;
  }

  if (token) {
    return (
      <div className="auth-shell">
        <style>{styles}</style>
        <div className="auth-card">
          <div className="success-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="success-title">Tizimga kirdingiz</h2>
          <p className="success-subtitle">Token muvaffaqiyatli olindi</p>
          <div className="token-box">{token}</div>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Chiqish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <style>{styles}</style>
      <div className="auth-card">
        <div className="brand">
          <span className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M9 8V6a3 3 0 0 1 6 0v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Online Do'kon
        </div>

        <div className="tabs">
          <button
            type="button"
            className={mode === "login" ? "tab tab-active" : "tab"}
            onClick={() => {
              setMode("login");
              setErrors({});
              setFormError("");
            }}
          >
            Kirish
          </button>
          <button
            type="button"
            className={mode === "register" ? "tab tab-active" : "tab"}
            onClick={() => {
              setMode("register");
              setErrors({});
              setFormError("");
            }}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {formError && <div className="alert">{formError}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="form">
            <div className="form-group">
              <label>Foydalanuvchi nomi</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => updateLogin("username", e.target.value)}
                placeholder="username"
                required
              />
            </div>
            <div className="form-group">
              <label>Parol</label>
              <div className="password-wrap">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => updateLogin("password", e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <EyeToggle
                  visible={showLoginPassword}
                  onToggle={() => setShowLoginPassword((prev) => !prev)}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Yuklanmoqda..." : "Kirish"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Ism</label>
                <input
                  type="text"
                  value={registerData.first_name}
                  onChange={(e) => updateRegister("first_name", e.target.value)}
                  required
                />
                {fieldError("first_name")}
              </div>
              <div className="form-group">
                <label>Familiya</label>
                <input
                  type="text"
                  value={registerData.last_name}
                  onChange={(e) => updateRegister("last_name", e.target.value)}
                  required
                />
                {fieldError("last_name")}
              </div>
            </div>

            <div className="form-group">
              <label>Foydalanuvchi nomi</label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => updateRegister("username", e.target.value)}
                required
              />
              {fieldError("username")}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => updateRegister("email", e.target.value)}
                required
              />
              {fieldError("email")}
            </div>

            <div className="form-group">
              <label>Telefon raqam</label>
              <input
                type="tel"
                value={registerData.phone_number}
                onChange={(e) => updateRegister("phone_number", e.target.value)}
                placeholder="+998901234567"
                required
              />
              <p className="hint">Format: +998901234567</p>
              {fieldError("phone_number")}
            </div>

            <div className="form-group">
              <label>Manzil</label>
              <input
                type="text"
                value={registerData.address}
                onChange={(e) => updateRegister("address", e.target.value)}
                required
              />
              {fieldError("address")}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Parol</label>
                <div className="password-wrap">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => updateRegister("password", e.target.value)}
                    required
                  />
                  <EyeToggle
                    visible={showRegPassword}
                    onToggle={() => setShowRegPassword((prev) => !prev)}
                  />
                </div>
                {fieldError("password")}
              </div>
              <div className="form-group">
                <label>Parolni tasdiqlang</label>
                <div className="password-wrap">
                  <input
                    type={showRegPassword2 ? "text" : "password"}
                    value={registerData.password2}
                    onChange={(e) => updateRegister("password2", e.target.value)}
                    required
                  />
                  <EyeToggle
                    visible={showRegPassword2}
                    onToggle={() => setShowRegPassword2((prev) => !prev)}
                  />
                </div>
                {fieldError("password2")}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Yuklanmoqda..." : "Ro'yxatdan o'tish"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = `
  .auth-shell {
    min-height: 520px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5fb;
    padding: 32px 16px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .auth-card {
    width: 100%;
    max-width: 440px;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    padding: 32px;
    box-shadow: 0 12px 32px rgba(76, 29, 149, 0.12);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 700;
    color: #18181b;
    margin-bottom: 24px;
  }

  .brand-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tabs {
    display: flex;
    background: #ede9fe;
    border-radius: 999px;
    padding: 4px;
    margin-bottom: 22px;
  }

  .tab {
    flex: 1;
    padding: 9px 0;
    border: none;
    background: transparent;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    color: #6d28d9;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .tab-active {
    background: #fff;
    color: #4f46e5;
    box-shadow: 0 1px 4px rgba(76, 29, 149, 0.18);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 13px;
    font-weight: 600;
    color: #18181b;
  }

  .form-group input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #f5f5fb;
    font-size: 14px;
    color: #18181b;
    outline: none;
    transition: border-color 0.15s ease, background 0.15s ease;
    box-sizing: border-box;
  }

  .form-group input:focus {
    border-color: #7c3aed;
    background: #fff;
  }

  .password-wrap {
    position: relative;
  }

  .password-wrap input {
    padding-right: 42px;
  }

  .eye-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 50%;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .eye-btn:hover {
    color: #6d28d9;
    background: #ede9fe;
  }

  .hint {
    font-size: 11px;
    color: #9ca3af;
    margin: 0;
  }

  .field-error {
    font-size: 12px;
    color: #ef4444;
    margin: 0;
  }

  .alert {
    background: #fee2e2;
    color: #b91c1c;
    padding: 11px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .btn-primary {
    margin-top: 4px;
    padding: 12px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(76, 29, 149, 0.25);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .success-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #dcfce7;
    color: #15803d;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .success-title {
    text-align: center;
    font-size: 18px;
    font-weight: 800;
    margin: 0 0 4px;
    color: #18181b;
  }

  .success-subtitle {
    text-align: center;
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 18px;
  }

  .token-box {
    background: #f5f5fb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 12px;
    font-family: monospace;
    color: #4f46e5;
    word-break: break-all;
    text-align: center;
  }

  .btn-logout {
    width: 100%;
    margin-top: 16px;
    padding: 11px;
    border: 1px solid #fee2e2;
    border-radius: 999px;
    background: #fff;
    color: #ef4444;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-logout:hover {
    background: #fee2e2;
  }
`;
