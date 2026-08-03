import { useState, useEffect } from "react";
import { API_BASE, MEDIA_BASE } from "./AdminPage";

const EMPTY_FORM = {
  name: "",
  slug: "",
  category: "",
  price: "",
  total: "",
  expiry_date: "",
  is_active: true,
};

export default function AdminProducts({ token, authHeaders }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

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
    try {
      const res = await fetch(`${API_BASE}/categories-admin/`, { headers: authHeaders });
      if (!res.ok) return;
      setCategories(normalizeList(await res.json()));
    } catch (err) {
      /* jim o'tkaziladi */
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const qs = categoryFilter ? `?category=${categoryFilter}` : "";
      const res = await fetch(`${API_BASE}/products-admin/${qs}`, { headers: authHeaders });
      if (!res.ok) throw new Error();
      setProducts(normalizeList(await res.json()));
    } catch (err) {
      setError("Mahsulotlarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.");
    } finally {
      setLoading(false);
    }
  }

  function categoryName(id) {
    return categories.find((c) => c.id === id)?.name || "—";
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      category: product.category || "",
      price: product.price || "",
      total: product.total ?? "",
      expiry_date: product.expiry_date || "",
      is_active: !!product.is_active,
    });
    setImageFile(null);
    setImagePreview(imageUrl(product));
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
      body.append("category", form.category);
      body.append("price", form.price);
      body.append("total", form.total);
      if (form.expiry_date) body.append("expiry_date", form.expiry_date);
      body.append("is_active", form.is_active);
      if (imageFile) body.append("image", imageFile);

      const url = editingId
        ? `${API_BASE}/products-admin/${editingId}/`
        : `${API_BASE}/products-admin/`;
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
      loadProducts();
    } catch (err) {
      setError("Saqlab bo'lmadi: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`"${product.name}" mahsulotini o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`${API_BASE}/products-admin/${product.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError("O'chirib bo'lmadi.");
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Mahsulotlar</h1>
          <p className="admin-subtitle">Do'kondagi mahsulotlarni boshqaring</p>
        </div>
        <button className="admin-btn-primary" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Yangi mahsulot
        </button>
      </div>

      <div className="admin-form-group" style={{ maxWidth: 240, marginBottom: 18 }}>
        <label>Bo'lim bo'yicha filtr</label>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Barcha bo'limlar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {loading ? (
        <p className="admin-loading">Yuklanmoqda...</p>
      ) : products.length === 0 ? (
        <p className="admin-empty">Hozircha mahsulot yo'q.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Bo'lim</th>
                <th>Narxi</th>
                <th>Qoldiq</th>
                <th>Holati</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-name-cell">
                      <div className="admin-row-thumb">
                        {imageUrl(product) ? <img src={imageUrl(product)} alt={product.name} /> : null}
                      </div>
                      {product.name}
                    </div>
                  </td>
                  <td>{categoryName(product.category)}</td>
                  <td>{Number(product.price).toLocaleString("uz-UZ")} so'm</td>
                  <td>{product.total}</td>
                  <td>
                    <span className={product.is_active ? "admin-badge admin-badge-green" : "admin-badge admin-badge-gray"}>
                      {product.is_active ? "Faol" : "Faol emas"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-icon-btn" title="Tahrirlash" onClick={() => openEdit(product)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button className="admin-btn-danger" onClick={() => handleDelete(product)}>
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
              <h2>{editingId ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</h2>
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
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>Bo'lim</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  required
                >
                  <option value="">Tanlang</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Narxi (so'm)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Qoldiq (dona)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.total}
                    onChange={(e) => setForm((p) => ({ ...p, total: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Yaroqlilik muddati (ixtiyoriy)</label>
                <input
                  type="date"
                  value={form.expiry_date || ""}
                  onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))}
                />
              </div>

              <div className="admin-checkbox-row">
                <input
                  type="checkbox"
                  id="prod-active"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                <label htmlFor="prod-active">Faol mahsulot</label>
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
