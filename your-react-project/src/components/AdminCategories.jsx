import { useState, useEffect } from "react";
import { API_BASE, MEDIA_BASE } from "./AdminPage";

const EMPTY_FORM = { name: "", slug: "", is_active: true };

export default function AdminCategories({ token, authHeaders }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  function imageUrl(obj) {
    if (!obj?.image || typeof obj.image !== "string") return null;
    return obj.image.startsWith("http") ? obj.image : `${MEDIA_BASE}${obj.image}`;
  }

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/categories-admin/`, { headers: authHeaders });
      if (!res.ok) throw new Error();
      setCategories(normalizeList(await res.json()));
    } catch (err) {
      setError("Bo'limlarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  }

  function openEdit(category) {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      is_active: !!category.is_active,
    });
    setImageFile(null);
    setImagePreview(imageUrl(category));
    setShowModal(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("slug", form.slug);
      body.append("is_active", form.is_active);
      if (imageFile) body.append("image", imageFile);

      const url = editingId
        ? `${API_BASE}/categories-admin/${editingId}/`
        : `${API_BASE}/categories-admin/`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: authHeaders,
        body,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(data));
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      setError("Saqlab bo'lmadi: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`"${category.name}" bo'limini o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`${API_BASE}/categories-admin/${category.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      setError("O'chirib bo'lmadi. Bu bo'limga bog'liq mahsulotlar bo'lishi mumkin.");
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Bo'limlar</h1>
          <p className="admin-subtitle">Do'kon kategoriyalarini boshqaring</p>
        </div>
        <button className="admin-btn-primary" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Yangi bo'lim
        </button>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {loading ? (
        <p className="admin-loading">Yuklanmoqda...</p>
      ) : categories.length === 0 ? (
        <p className="admin-empty">Hozircha bo'lim yo'q. "Yangi bo'lim" tugmasini bosing.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Slug</th>
                <th>Holati</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className="admin-name-cell">
                      <div className="admin-row-thumb">
                        {imageUrl(category) ? (
                          <img src={imageUrl(category)} alt={category.name} />
                        ) : null}
                      </div>
                      {category.name}
                    </div>
                  </td>
                  <td>{category.slug}</td>
                  <td>
                    <span className={category.is_active ? "admin-badge admin-badge-green" : "admin-badge admin-badge-gray"}>
                      {category.is_active ? "Faol" : "Faol emas"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-icon-btn" title="Tahrirlash" onClick={() => openEdit(category)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button className="admin-btn-danger" onClick={() => handleDelete(category)}>
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingId ? "Bo'limni tahrirlash" : "Yangi bo'lim"}</h2>
              <button className="admin-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-image-preview">
                {imagePreview ? <img src={imagePreview} alt="" /> : "Rasm tanlanmagan"}
              </div>
              <div className="admin-form-group">
                <label>Rasm {editingId ? "(o'zgartirish uchun tanlang)" : ""}</label>
                <input type="file" accept="image/*" onChange={handleImageChange} required={!editingId} />
              </div>

              <div className="admin-form-group">
                <label>Nomi</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="masalan: elektronika"
                  required
                />
              </div>

              <div className="admin-checkbox-row">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                <label htmlFor="cat-active">Faol bo'lim</label>
              </div>

              <div className="admin-modal-actions">
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                <button type="button" className="admin-btn-outline" onClick={() => setShowModal(false)}>
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
