import { useState, useEffect } from "react";
import { API_BASE } from "./AdminPage";

export default function AdminProfiles({ token, authHeaders }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  async function loadProfiles() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/profiles-admin/`, { headers: authHeaders });
      if (!res.ok) throw new Error();
      setProfiles(normalizeList(await res.json()));
    } catch (err) {
      setError("Foydalanuvchilarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = profiles.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.phone_number || "").includes(q)
    );
  });

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Foydalanuvchilar</h1>
          <p className="admin-subtitle">Ro'yxatdan o'tgan mijozlar (faqat ko'rish uchun)</p>
        </div>
      </div>

      <div className="admin-form-group" style={{ maxWidth: 280, marginBottom: 18 }}>
        <label>Qidirish</label>
        <input
          type="text"
          placeholder="Ism, email yoki telefon"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {loading ? (
        <p className="admin-loading">Yuklanmoqda...</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">Foydalanuvchi topilmadi.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>F.I.SH</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Manzil</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((profile, i) => (
                <tr key={i}>
                  <td>
                    <div className="admin-name-cell">
                      <div className="admin-row-thumb" style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-soft)", color: "var(--violet-700)", fontWeight: 800 }}>
                        {(profile.first_name?.[0] || "U").toUpperCase()}
                      </div>
                      {profile.first_name} {profile.last_name}
                    </div>
                  </td>
                  <td>{profile.email}</td>
                  <td>{profile.phone_number}</td>
                  <td>{profile.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
