import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api/v1";
const MEDIA_BASE = "http://127.0.0.1:8000";

const translations = {
  uz: {
    title: "Savatcha",
    back: "Bosh sahifaga qaytish",
    empty: "Savatchangiz bo'sh",
    emptySubtitle: "Xarid qilishni boshlash uchun bosh sahifaga qayting",
    goShopping: "Xarid qilishni boshlash",
    perItem: "so'm / dona",
    remove: "Butunlay o'chirish",
    clearCart: "Savatchani tozalash",
    summary: "Buyurtma xulosasi",
    items: "Mahsulotlar",
    delivery: "Yetkazib berish",
    free: "Bepul",
    total: "Jami",
    checkout: "Buyurtma berish",
    checkingOut: "Yuborilmoqda...",
    orderSuccess: "Buyurtma qabul qilindi!",
    orderNumber: "Buyurtma raqami",
    orderTotal: "Jami summa",
    continueShopping: "Xaridni davom ettirish",
    cancelOrder: "Bekor qilish",
    connectionError: "Ma'lumotlarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.",
    checkoutError: "Buyurtma berishda xatolik yuz berdi.",
  },
  ru: {
    title: "Корзина",
    back: "Вернуться на главную",
    empty: "Ваша корзина пуста",
    emptySubtitle: "Вернитесь на главную, чтобы начать покупки",
    goShopping: "Начать покупки",
    perItem: "сум / шт",
    remove: "Удалить полностью",
    clearCart: "Очистить корзину",
    summary: "Итог заказа",
    items: "Товары",
    delivery: "Доставка",
    free: "Бесплатно",
    total: "Итого",
    checkout: "Оформить заказ",
    checkingOut: "Отправка...",
    orderSuccess: "Заказ принят!",
    orderNumber: "Номер заказа",
    orderTotal: "Сумма заказа",
    continueShopping: "Продолжить покупки",
    cancelOrder: "Отменить",
    connectionError: "Не удалось загрузить данные. Проверьте backend.",
    checkoutError: "Ошибка при оформлении заказа.",
  },
  en: {
    title: "Cart",
    back: "Back to home",
    empty: "Your cart is empty",
    emptySubtitle: "Go back to the homepage to start shopping",
    goShopping: "Start shopping",
    perItem: "so'm / item",
    remove: "Remove completely",
    clearCart: "Clear cart",
    summary: "Order summary",
    items: "Items",
    delivery: "Delivery",
    free: "Free",
    total: "Total",
    checkout: "Place order",
    checkingOut: "Submitting...",
    orderSuccess: "Order placed!",
    orderNumber: "Order number",
    orderTotal: "Order total",
    continueShopping: "Continue shopping",
    cancelOrder: "Cancel",
    connectionError: "Couldn't load data. Check that the backend is running.",
    checkoutError: "Something went wrong while placing the order.",
  },
};

export default function CartPage({ token, onBack, onLogout }) {
  const [language] = useState(() => localStorage.getItem("language") || "uz");
  const [theme] = useState(() => localStorage.getItem("theme") || "light");

  const [cartItems, setCartItems] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyItemId, setBusyItemId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const t = translations[language];
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  async function fetchAllPages(url) {
    let results = [];
    let nextUrl = url;
    while (nextUrl) {
      const res = await fetch(nextUrl, { headers: authHeaders });
      if (!res.ok) break;
      const data = await res.json();
      if (Array.isArray(data)) {
        results = results.concat(data);
        nextUrl = null;
      } else {
        results = results.concat(data.results || []);
        nextUrl = data.next || null;
      }
    }
    return results;
  }

  async function loadCart() {
    setLoading(true);
    setError("");
    try {
      const [cartData, productsData] = await Promise.all([
        fetchAllPages(`${API_BASE}/cart/`),
        fetchAllPages(`${API_BASE}/products/`),
      ]);

      const map = {};
      productsData.forEach((p) => (map[p.id] = p));

      setCartItems(cartData);
      setProductsById(map);
    } catch (err) {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  }

  async function handleIncrease(productId) {
    setBusyItemId(productId);
    try {
      await fetch(`${API_BASE}/cart/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ product: productId }),
      });
      await loadCart();
    } catch (err) {
      /* jim o'tkaziladi */
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleDecrease(itemId) {
    setBusyItemId(itemId);
    try {
      await fetch(`${API_BASE}/cart/${itemId}/decrease/`, {
        method: "POST",
        headers: authHeaders,
      });
      await loadCart();
    } catch (err) {
      /* jim o'tkaziladi */
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemove(itemId) {
    setBusyItemId(itemId);
    try {
      await fetch(`${API_BASE}/cart/${itemId}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await loadCart();
    } catch (err) {
      /* jim o'tkaziladi */
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleClearCart() {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/cart/clear/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await loadCart();
    } catch (err) {
      /* jim o'tkaziladi */
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    setCheckingOut(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/orders-admin/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.checkoutError);
        return;
      }
      setOrderResult(data);
      setCartItems([]);
    } catch (err) {
      setError(t.checkoutError);
    } finally {
      setCheckingOut(false);
    }
  }

  function imageUrl(obj) {
    if (!obj?.image || typeof obj.image !== "string") return null;
    return obj.image.startsWith("http") ? obj.image : `${MEDIA_BASE}${obj.image}`;
  }

  const enrichedItems = cartItems
    .map((item) => ({ ...item, productData: productsById[item.product] }))
    .filter((item) => item.productData);

  const totalPrice = enrichedItems.reduce(
    (sum, item) => sum + Number(item.productData.price) * item.quantity,
    0
  );

  if (orderResult) {
    return (
      <div className="cart-shell">
        <style>{styles}</style>
        <div className="success-wrap">
          <div className="success-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="success-title">{t.orderSuccess}</h2>
          <div className="success-row">
            <span>{t.orderNumber}</span>
            <strong>#{orderResult.id}</strong>
          </div>
          <div className="success-row">
            <span>{t.orderTotal}</span>
            <strong>{Number(orderResult.total_price).toLocaleString("uz-UZ")} so'm</strong>
          </div>
          <button className="btn-primary" onClick={onBack}>
            {t.continueShopping}
          </button>
          <button className="btn-cancel-order" onClick={onBack}>
            {t.cancelOrder}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-shell">
      <style>{styles}</style>

      <header className="site-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.back}
        </button>
        {token && (
          <button className="icon-btn logout" title="Logout" onClick={onLogout}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 8l-4 4 4 4M3 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </header>

      <main className="page-main">
        <h1 className="page-title">{t.title}</h1>

        {error && <div className="alert">{error}</div>}

        {loading ? (
          <p className="loading-text">...</p>
        ) : enrichedItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 4h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="empty-title">{t.empty}</p>
            <p className="empty-subtitle">{t.emptySubtitle}</p>
            <button className="btn-primary" onClick={onBack}>
              {t.goShopping}
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {enrichedItems.map((item) => (
                <div key={item.id} className="cart-row">
                  <div className="cart-thumb">
                    {imageUrl(item.productData) ? (
                      <img src={imageUrl(item.productData)} alt={item.productData.name} />
                    ) : (
                      <div className="thumb-placeholder">{item.productData.name?.[0]}</div>
                    )}
                  </div>

                  <div className="cart-info">
                    <p className="cart-item-title">{item.productData.name}</p>
                    <span className="cart-item-unit">
                      {Number(item.productData.price).toLocaleString("uz-UZ")} {t.perItem}
                    </span>
                  </div>

                  <div className="qty-stepper">
                    <button
                      className="qty-btn"
                      onClick={() => handleDecrease(item.id)}
                      disabled={busyItemId === item.id}
                    >
                      −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => handleIncrease(item.product)}
                      disabled={busyItemId === item.id}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-total">
                    {(Number(item.productData.price) * item.quantity).toLocaleString("uz-UZ")} so'm
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.id)}
                    title={t.remove}
                    disabled={busyItemId === item.id}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              <button className="clear-btn" onClick={handleClearCart}>
                {t.clearCart}
              </button>
            </div>

            <div className="cart-summary">
              <h3 className="summary-title">{t.summary}</h3>
              <div className="summary-row">
                <span>
                  {t.items} ({enrichedItems.length})
                </span>
                <span>{totalPrice.toLocaleString("uz-UZ")} so'm</span>
              </div>
              <div className="summary-row">
                <span>{t.delivery}</span>
                <span>{t.free}</span>
              </div>
              <div className="summary-total">
                <span>{t.total}</span>
                <span>{totalPrice.toLocaleString("uz-UZ")} so'm</span>
              </div>
              <button
                className="btn-primary checkout-btn"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? t.checkingOut : t.checkout}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = `
  :root {
    --violet-600: #7c3aed;
    --violet-700: #6d28d9;
    --indigo-600: #4f46e5;
    --bg-page: #f5f5fb;
    --bg-card: #ffffff;
    --bg-soft: #ede9fe;
    --text-primary: #18181b;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;
    --border-color: #e5e7eb;
  }

  [data-theme="dark"] {
    --bg-page: #131318;
    --bg-card: #1f1f27;
    --bg-soft: #2c2440;
    --text-primary: #f4f4f5;
    --text-secondary: #b8b8c2;
    --text-muted: #8a8a96;
    --border-color: #33333f;
  }

  .cart-shell {
    min-height: 100vh;
    background: var(--bg-page);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--text-primary);
  }

  .site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    padding: 14px 24px;
    position: sticky;
    top: 0;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 999px;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .back-btn:hover {
    background: var(--bg-soft);
    color: var(--violet-700);
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .icon-btn.logout:hover {
    background: #fee2e2;
    color: #ef4444;
  }

  .page-main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 28px 24px 56px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 22px;
    color: var(--text-primary);
  }

  [data-theme="dark"] .page-title {
    color: #f4f4f5 !important;
  }

  .alert {
    background: #fee2e2;
    color: #b91c1c;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .loading-text {
    color: var(--text-muted);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: var(--bg-soft);
    color: var(--violet-600);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
  }

  .empty-title {
    font-size: 17px;
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--text-primary);
  }

  .empty-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0 0 20px;
  }

  .btn-primary {
    padding: 11px 22px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 26px;
    align-items: start;
  }

  .cart-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cart-row {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 12px;
  }

  .cart-thumb {
    width: 62px;
    height: 62px;
    border-radius: 10px;
    overflow: hidden;
    background: var(--bg-page);
    flex-shrink: 0;
  }

  .cart-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: var(--violet-600);
    background: var(--bg-soft);
  }

  .cart-info {
    flex: 1;
    min-width: 0;
  }

  .cart-item-title {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 4px;
  }

  .cart-item-unit {
    font-size: 12px;
    color: var(--text-muted);
  }

  .qty-stepper {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--bg-soft);
    border-radius: 999px;
    padding: 3px;
  }

  .qty-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--violet-700);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qty-btn:hover:not(:disabled) {
    background: var(--violet-600);
    color: #fff;
  }

  .qty-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .qty-value {
    min-width: 26px;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
  }

  .cart-item-total {
    min-width: 100px;
    text-align: right;
    font-size: 14px;
    font-weight: 800;
    color: var(--violet-700);
  }

  .remove-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .remove-btn:hover:not(:disabled) {
    background: #fee2e2;
    color: #ef4444;
  }

  .remove-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .clear-btn {
    align-self: flex-start;
    margin-top: 4px;
    padding: 9px 16px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
  }

  .clear-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .cart-summary {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 20px;
    position: sticky;
    top: 80px;
  }

  .summary-title {
    font-size: 15px;
    font-weight: 800;
    margin: 0 0 16px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 10px;
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 800;
    padding-top: 12px;
    margin-top: 4px;
    border-top: 1px solid var(--border-color);
  }

  .summary-total span:last-child {
    color: var(--violet-700);
  }

  .checkout-btn {
    width: 100%;
    margin-top: 16px;
  }

  .success-wrap {
    max-width: 380px;
    margin: 80px auto;
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-color);
    padding: 32px;
    text-align: center;
  }

  .success-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #dcfce7;
    color: #15803d;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .success-title {
    font-size: 18px;
    font-weight: 800;
    margin: 0 0 18px;
  }

  .success-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color);
    font-size: 13px;
    color: var(--text-secondary);
  }

  .success-row strong {
    color: var(--text-primary);
  }

  .success-wrap .btn-primary {
    width: 100%;
    margin-top: 20px;
  }

  .btn-cancel-order {
    width: 100%;
    margin-top: 10px;
    padding: 10px 16px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-cancel-order:hover {
    background: var(--bg-soft);
  }

  @media (max-width: 720px) {
    .cart-layout {
      grid-template-columns: 1fr;
    }
    .cart-row {
      flex-wrap: wrap;
    }
  }
`;
