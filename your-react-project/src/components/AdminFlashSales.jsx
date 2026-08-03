import { useState, useEffect } from "react";
import { API_BASE } from "./AdminPage";

const EMPTY_FORM = { product: "", discount_percentage: "", start_time: "", end_time: "" };

export default function AdminFlashSales({ token, authHeaders }) {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSales();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  // Backenddan kelgan ISO sanani <input type="datetime-local"> uchun formatga o'tkazadi
  function toLocalInput(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function loadSales() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/flashes-admin/`, { headers: authHeaders });
      if (!res.ok) throw new Error();
      setSales(normalizeList(await res.json()));
    } catch (err) {
      setError("Flash-seyllarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch(`${API_BASE}/products-admin/`, { headers: authHeaders });
      if (!res.ok) return;
      setProducts(normalizeList(await res.json()));
    } catch (err) {
      /* jim o'tkaziladi */
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(sale) {
    setEditingId(sale.id);
    setForm({
      product: sale.product || "",
      discount_percentage: sale.discount_percentage ?? "",
      start_time: toLocalInput(sale.start_time),
      end_time: toLocalInput(sale.end_time),
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        product: Number(form.product),
        discount_percentage: Number(form.discount_percentage),
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      };
      const url = editingId
        ? `${API_BASE}/flashes-admin/${editingId}/`
        : `${API_BASE}/flashes-admin/`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(data));
      }
      setShowModal(false);
      loadSales();
    } catch (err) {
      setError("Saqlab bo'lmadi: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sale) {
    if (!window.confirm(`"${sale.product_name}" uchun flash-seylni o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`${API_BASE}/flashes-admin/${sale.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setSales((prev) => prev.filter((s) => s.id !== sale.id));
    } catch (err) {
      setError("O'chirib bo'lmadi.");
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Flash-seyllar</h1>
          <p className="admin-subtitle">Vaqtinchalik chegirmalarni boshqaring</p>
        </div>
        <button className="admin-btn-primary" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Yangi flash-seyl
        </button>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {loading ? (
        <p className="admin-loading">Yuklanmoqda...</p>
      ) : sales.length === 0 ? (
        <p className="admin-empty">Hozircha flash-seyl yo'q.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Chegirma</th>
                <th>Boshlanishi</th>
                <th>Tugashi</th>
                <th>Holati</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="admin-name-cell">{sale.product_name}</td>
                  <td>{sale.discount_percentage}%</td>
                  <td>{new Date(sale.start_time).toLocaleString("uz-UZ")}</td>
                  <td>{new Date(sale.end_time).toLocaleString("uz-UZ")}</td>
                  <td>
                    <span className={sale.is_active ? "admin-badge admin-badge-green" : "admin-badge admin-badge-gray"}>
                      {sale.is_active ? "Faol" : "Faol emas"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-icon-btn" title="Tahrirlash" onClick={() => openEdit(sale)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button className="admin-btn-danger" onClick={() => handleDelete(sale)}>
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
              <h2>{editingId ? "Flash-seylni tahrirlash" : "Yangi flash-seyl"}</h2>
              <button className="admin-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label>Mahsulot</label>
                <select
                  value={form.product}
                  onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))}
                  required
                >
                  <option value="">Tanlang</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Chegirma foizi (%)</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={form.discount_percentage}
                  onChange={(e) => setForm((p) => ({ ...p, discount_percentage: e.target.value }))}
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Boshlanish vaqti</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Tugash vaqti</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                    required
                  />
                </div>
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
