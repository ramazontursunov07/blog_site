import { useState, useEffect } from "react";
import { API_BASE } from "./AdminPage";

const STATUS_LABELS = {
  pending: { label: "Kutilmoqda", cls: "admin-badge-yellow" },
  processing: { label: "Jarayonda", cls: "admin-badge-blue" },
  delivered: { label: "Yetkazildi", cls: "admin-badge-green" },
  cancelled: { label: "Bekor qilindi", cls: "admin-badge-red" },
};

export default function AdminOrders({ token, authHeaders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/orders-admin/`, { headers: authHeaders });
      if (!res.ok) throw new Error();
      setOrders(normalizeList(await res.json()));
    } catch (err) {
      setError("Buyurtmalarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(order) {
    if (!window.confirm(`#${order.id} buyurtmani bekor qilmoqchimisiz?`)) return;
    setBusyId(order.id);
    try {
      const res = await fetch(`${API_BASE}/orders-admin/${order.id}/cancel/`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch (err) {
      setError("Buyurtmani bekor qilib bo'lmadi. Faqat 'Kutilmoqda' statusidagi buyurtmalar bekor qilinadi.");
    } finally {
      setBusyId(null);
    }
  }

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="admin-title">Buyurtmalar</h1>
          <p className="admin-subtitle">Barcha mijozlarning buyurtmalari</p>
        </div>
      </div>

      <div className="admin-form-group" style={{ maxWidth: 220, marginBottom: 18 }}>
        <label>Status bo'yicha filtr</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Barchasi</option>
          <option value="pending">Kutilmoqda</option>
          <option value="processing">Jarayonda</option>
          <option value="delivered">Yetkazildi</option>
          <option value="cancelled">Bekor qilindi</option>
        </select>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {loading ? (
        <p className="admin-loading">Yuklanmoqda...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="admin-empty">Hozircha buyurtma yo'q.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Foydalanuvchi (ID)</th>
                <th>Summasi</th>
                <th>Sana</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusInfo = STATUS_LABELS[order.status] || { label: order.status, cls: "admin-badge-gray" };
                return (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.user}</td>
                    <td>{Number(order.total_price).toLocaleString("uz-UZ")} so'm</td>
                    <td>{new Date(order.created_at).toLocaleString("uz-UZ")}</td>
                    <td>
                      <span className={`admin-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {order.status === "pending" && (
                          <button
                            className="admin-btn-danger"
                            disabled={busyId === order.id}
                            onClick={() => handleCancel(order)}
                          >
                            {busyId === order.id ? "..." : "Bekor qilish"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
