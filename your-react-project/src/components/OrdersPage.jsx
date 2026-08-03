import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api/v1";
const MEDIA_BASE = "http://127.0.0.1:8000";

const translations = {
  uz: {
    title: "Buyurtmalarim",
    back: "Bosh sahifa",
    empty: "Hali buyurtmalaringiz yo'q",
    emptySubtitle: "Xarid qilishni boshlash uchun bosh sahifaga qayting",
    goShopping: "Xarid qilishni boshlash",
    orderNumber: "Buyurtma",
    total: "Jami",
    date: "Sana",
    items: "Mahsulotlar",
    qty: "dona",
    connectionError: "Ma'lumotlarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.",
    loginRequired: "Buyurtmalarni ko'rish uchun tizimga kiring.",
    loading: "Yuklanmoqda...",
    status: {
      pending: "Kutilmoqda",
      processing: "Jarayonda",
      delivered: "Yetkazildi",
      cancelled: "Bekor qilindi",
    },
  },
  ru: {
    title: "Мои заказы",
    back: "На главную",
    empty: "У вас пока нет заказов",
    emptySubtitle: "Вернитесь на главную, чтобы начать покупки",
    goShopping: "Начать покупки",
    orderNumber: "Заказ",
    total: "Итого",
    date: "Дата",
    items: "Товары",
    qty: "шт",
    connectionError: "Не удалось загрузить данные. Проверьте backend.",
    loginRequired: "Войдите в систему, чтобы увидеть заказы.",
    loading: "Загрузка...",
    status: {
      pending: "В ожидании",
      processing: "В обработке",
      delivered: "Доставлено",
      cancelled: "Отменено",
    },
  },
  en: {
    title: "My Orders",
    back: "Back to home",
    empty: "You don't have any orders yet",
    emptySubtitle: "Go back to the homepage to start shopping",
    goShopping: "Start shopping",
    orderNumber: "Order",
    total: "Total",
    date: "Date",
    items: "Items",
    qty: "pcs",
    connectionError: "Couldn't load data. Check that the backend is running.",
    loginRequired: "Please log in to see your orders.",
    loading: "Loading...",
    status: {
      pending: "Pending",
      processing: "Processing",
      delivered: "Delivered",
      cancelled: "Cancelled",
    },
  },
};

export default function OrdersPage({ token, onBack, onLogout }) {
  const [language] = useState(() => localStorage.getItem("language") || "uz");
  const t = translations[language];
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openOrderId, setOpenOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    if (data && Array.isArray(data.orders)) return data.orders;
    return [];
  }

  async function loadOrders() {
    if (!token) {
      setError(t.loginRequired);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/orders/`, { headers: authHeaders });
      if (!res.ok) {
        setError(t.connectionError);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list = normalizeList(data);
      // Har bir foydalanuvchi uchun shaxsiy tartib raqamini hisoblaymiz
      // (eng eski buyurtma #1 bo'ladi), backenddagi haqiqiy id'ga tegmasdan.
      const byCreatedAsc = [...list].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      const numberById = {};
      byCreatedAsc.forEach((order, idx) => {
        numberById[order.id] = idx + 1;
      });
      const withDisplayNumber = list.map((order) => ({
        ...order,
        displayNumber: numberById[order.id],
      }));
      // eng yangi buyurtma birinchi bo'lib chiqishi uchun
      withDisplayNumber.sort((a, b) => (b.id || 0) - (a.id || 0));
      setOrders(withDisplayNumber);
    } catch (err) {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  }

  function imageUrl(path) {
    if (!path || typeof path !== "string") return null;
    return path.startsWith("http") ? path : `${MEDIA_BASE}${path}`;
  }

  // Serializer turli nom bilan qaytarishi mumkin bo'lgan maydonlarni moslab olamiz
  function getItemInfo(item) {
    const product = item.product;
    const isObj = product && typeof product === "object";

    const name =
      (isObj && (product.name || product.title)) ||
      item.product_name ||
      item.name ||
      `Mahsulot #${isObj ? product.id : product}`;

    const image =
      (isObj && (product.image || product.photo)) ||
      item.product_image ||
      item.image ||
      null;

    const unitPrice = Number(item.price ?? (isObj && product.price) ?? 0);
    const quantity = Number(item.quantity ?? 1);
    const lineTotal = Number(item.total_price ?? unitPrice * quantity);

    return { name, image: imageUrl(image), unitPrice, quantity, lineTotal };
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  }

  function statusLabel(status) {
    return t.status[status] || status;
  }

  function statusClass(status) {
    return `status-badge status-${status || "pending"}`;
  }

  return (
    <div className="orders-shell">
      <style>{styles}</style>

      <header className="orders-header">
        <button className="back-link" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.back}
        </button>
        {onLogout && (
          <button className="logout-link" onClick={onLogout} title={t.back}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </header>

      <div className="orders-content">
        <h1 className="orders-title">{t.title}</h1>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="loading-text">{t.loading}</p>
        ) : orders.length === 0 && !error ? (
          <div className="empty-wrap">
            <div className="empty-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 10h6M9 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="empty-title">{t.empty}</p>
            <p className="empty-subtitle">{t.emptySubtitle}</p>
            <button className="btn-primary" onClick={onBack}>
              {t.goShopping}
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const isOpen = openOrderId === order.id;
              const items = Array.isArray(order.items) ? order.items : [];
              return (
                <div className="order-card" key={order.id}>
                  <div
                    className="order-card-header"
                    onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                  >
                    <div>
                      <p className="order-id">
                        {t.orderNumber} #{order.displayNumber ?? order.id}
                      </p>
                      <p className="order-date">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="order-header-right">
                      <span className={statusClass(order.status)}>
                        {statusLabel(order.status)}
                      </span>
                      <p className="order-total">
                        {Number(order.total_price).toLocaleString("uz-UZ")} so'm
                      </p>
                      <svg
                        className={isOpen ? "chevron chevron-open" : "chevron"}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {isOpen && items.length > 0 && (
                    <div className="order-items">
                      <p className="order-items-label">{t.items}</p>
                      {items.map((item, idx) => {
                        const info = getItemInfo(item);
                        return (
                          <div className="order-item-row" key={item.id || idx}>
                            <div className="order-item-thumb">
                              {info.image ? (
                                <img src={info.image} alt={info.name} />
                              ) : (
                                <div className="order-item-placeholder">
                                  {info.name?.[0]}
                                </div>
                              )}
                            </div>
                            <div className="order-item-info">
                              <p className="order-item-name">{info.name}</p>
                              <p className="order-item-meta">
                                {info.quantity} {t.qty} ×{" "}
                                {info.unitPrice.toLocaleString("uz-UZ")} so'm
                              </p>
                            </div>
                            <p className="order-item-total">
                              {info.lineTotal.toLocaleString("uz-UZ")} so'm
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = `
  .orders-shell {
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
  }

  .orders-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-card);
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--text-primary);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
  }

  .logout-link {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .orders-content {
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 24px 60px;
  }

  .orders-title {
    text-align: center;
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 24px;
  }

  .error-banner {
    background: #fee2e2;
    color: #b91c1c;
    padding: 14px 18px;
    border-radius: 12px;
    text-align: center;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .loading-text {
    text-align: center;
    color: var(--text-secondary);
    padding: 40px 0;
  }

  .empty-wrap {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--bg-soft);
    color: var(--violet-600);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 800;
    margin: 0 0 6px;
  }

  .empty-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0 0 20px;
  }

  .btn-primary {
    padding: 10px 20px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .order-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
  }

  .order-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    cursor: pointer;
  }

  .order-id {
    font-size: 14px;
    font-weight: 800;
    margin: 0 0 4px;
  }

  .order-date {
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
  }

  .order-header-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .order-total {
    font-size: 14px;
    font-weight: 800;
    color: var(--violet-700);
    margin: 0;
  }

  .status-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .status-pending {
    background: #fef3c7;
    color: #92400e;
  }

  .status-processing {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .status-delivered {
    background: #dcfce7;
    color: #15803d;
  }

  .status-cancelled {
    background: #fee2e2;
    color: #b91c1c;
  }

  .chevron {
    transition: transform 0.15s ease;
    color: var(--text-secondary);
  }

  .chevron-open {
    transform: rotate(180deg);
  }

  .order-items {
    border-top: 1px solid var(--border-color);
    padding: 14px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .order-items-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary);
    margin: 0 0 4px;
  }

  .order-item-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .order-item-thumb {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-page);
    flex-shrink: 0;
  }

  .order-item-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .order-item-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .order-item-info {
    flex: 1;
    min-width: 0;
  }

  .order-item-name {
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 2px;
  }

  .order-item-meta {
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
  }

  .order-item-total {
    font-size: 13px;
    font-weight: 700;
    color: var(--violet-700);
    margin: 0;
    white-space: nowrap;
  }
`;
