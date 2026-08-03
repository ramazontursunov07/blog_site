import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api/v1";
const MEDIA_BASE = "http://127.0.0.1:8000";

const translations = {
  uz: {
    home: "Bosh sahifa",
    available: "Mavjud",
    outOfStock: "Tugagan",
    pieces: "ta",
    addToCart: "Savatchaga qo'shish",
    adding: "Qo'shilmoqda...",
    back: "Ortga",
    loading: "Yuklanmoqda...",
    notFound: "Mahsulot topilmadi.",
    connectionError: "Ma'lumotlarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.",
    loginRequired: "Bu amal uchun tizimga kiring.",
    addedToCart: "Savatchaga qo'shildi!",
    expiry: "Yaroqlilik muddati",
  },
  ru: {
    home: "Главная",
    available: "В наличии",
    outOfStock: "Нет в наличии",
    pieces: "шт",
    addToCart: "Добавить в корзину",
    adding: "Добавление...",
    back: "Назад",
    loading: "Загрузка...",
    notFound: "Товар не найден.",
    connectionError: "Не удалось загрузить данные. Проверьте backend.",
    loginRequired: "Войдите в систему для этого действия.",
    addedToCart: "Добавлено в корзину!",
    expiry: "Срок годности",
  },
  en: {
    home: "Home",
    available: "In stock",
    outOfStock: "Out of stock",
    pieces: "pcs",
    addToCart: "Add to cart",
    adding: "Adding...",
    back: "Back",
    loading: "Loading...",
    notFound: "Product not found.",
    connectionError: "Couldn't load data. Check that the backend is running.",
    loginRequired: "Please log in to do this.",
    addedToCart: "Added to cart!",
    expiry: "Expiry date",
  },
};

export default function ProductDetailPage({ token, productId, onBack, onOpenCategory, onLogout }) {
  const [language] = useState(() => localStorage.getItem("language") || "uz");
  const [theme] = useState(() => localStorage.getItem("theme") || "light");

  const [product, setProduct] = useState(null);
  const [isWished, setIsWished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState(false);

  const t = translations[language];
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  async function loadProduct() {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/`, { headers: authHeaders });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        setError(t.connectionError);
        return;
      }
      const data = await res.json();
      setProduct(data);

      if (token) loadWishlistState();
    } catch (err) {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  }

  async function loadWishlistState() {
    try {
      const res = await fetch(`${API_BASE}/wishlist/`, { headers: authHeaders });
      if (!res.ok) return;
      const items = normalizeList(await res.json());
      setIsWished(items.some((item) => item.product === Number(productId)));
    } catch (err) {
      /* jim o'tkaziladi */
    }
  }

  async function handleToggleWishlist() {
    if (!token) {
      setError(t.loginRequired);
      return;
    }
    setIsWished((prev) => !prev);
    try {
      await fetch(`${API_BASE}/wishlist/toggle/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ product: Number(productId) }),
      });
    } catch (err) {
      loadWishlistState();
    }
  }

  async function handleAddToCart() {
    if (!token) {
      setError(t.loginRequired);
      return;
    }
    setAdding(true);
    setAddedMessage(false);
    try {
      const res = await fetch(`${API_BASE}/cart-items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ product: Number(productId) }),
      });
      if (res.ok) {
        setAddedMessage(true);
        setTimeout(() => setAddedMessage(false), 2500);
      }
    } catch (err) {
      /* jim o'tkaziladi */
    } finally {
      setAdding(false);
    }
  }

  function imageUrl(obj) {
    if (!obj?.image || typeof obj.image !== "string") return null;
    return obj.image.startsWith("http") ? obj.image : `${MEDIA_BASE}${obj.image}`;
  }

  const inStock = product && Number(product.total) > 0;

  return (
    <div className="detail-shell">
      <style>{styles}</style>

      <header className="site-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.home}
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
        {error && <div className="alert">{error}</div>}

        {loading ? (
          <p className="loading-text">{t.loading}</p>
        ) : notFound ? (
          <div className="empty-state">
            <p className="empty-title">{t.notFound}</p>
            <button className="btn-outline" onClick={onBack}>
              {t.back}
            </button>
          </div>
        ) : product ? (
          <>
            <div className="breadcrumb">
              <button onClick={onBack}>{t.home}</button>
              {product.category && (
                <>
                  <span className="crumb-sep">›</span>
                  <button onClick={() => onOpenCategory?.(product.category)}>
                    {product.category_name || "Bo'lim"}
                  </button>
                </>
              )}
              <span className="crumb-sep">›</span>
              <span className="crumb-current">{product.name}</span>
            </div>

            <div className="detail-layout">
              <div className="detail-image">
                {imageUrl(product) ? (
                  <img src={imageUrl(product)} alt={product.name} />
                ) : (
                  <div className="image-placeholder">{product.name?.[0]}</div>
                )}
                <button
                  className={isWished ? "wish-float wish-active" : "wish-float"}
                  onClick={handleToggleWishlist}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"}>
                    <path
                      d="M12 20s-7-4.4-9.5-8.8C.7 8 2 4.5 5.4 3.7c2-.5 4 .3 5.1 2 1.1-1.7 3.1-2.5 5.1-2 3.4.8 4.7 4.3 2.9 7.5C19 15.6 12 20 12 20Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="detail-info">
                <h1 className="detail-title">{product.name}</h1>
                <div className="detail-price">
                  {Number(product.price).toLocaleString("uz-UZ")} so'm
                </div>

                <span className={inStock ? "stock-badge in-stock" : "stock-badge out-stock"}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    {inStock ? (
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    )}
                  </svg>
                  {inStock ? `${t.available}: ${product.total} ${t.pieces}` : t.outOfStock}
                </span>

                {(product.attributes?.length > 0 || product.expiry_date) && (
                  <table className="attr-table">
                    <tbody>
                      {product.attributes?.map((attr) => (
                        <tr key={attr.id}>
                          <td>{attr.key}</td>
                          <td>{attr.value}</td>
                        </tr>
                      ))}
                      {product.expiry_date && (
                        <tr>
                          <td>{t.expiry}</td>
                          <td>{new Date(product.expiry_date).toLocaleDateString("uz-UZ")}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {addedMessage && <div className="success-alert">{t.addedToCart}</div>}

                <div className="detail-actions">
                  <button
                    className="btn-primary"
                    onClick={handleAddToCart}
                    disabled={adding || !inStock}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 4h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {adding ? t.adding : t.addToCart}
                  </button>
                  <button className="btn-outline" onClick={onBack}>
                    {t.back}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
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

  .detail-shell {
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
    padding: 22px 24px 56px;
  }

  .alert {
    background: #fee2e2;
    color: #b91c1c;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 18px;
  }

  .success-alert {
    background: #dcfce7;
    color: #15803d;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 14px;
  }

  .loading-text {
    color: var(--text-muted);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .breadcrumb button {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    padding: 0;
  }

  .breadcrumb button:hover {
    color: var(--violet-700);
  }

  .crumb-sep {
    color: var(--text-muted);
  }

  .crumb-current {
    color: var(--text-primary);
    font-weight: 600;
  }

  .detail-layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 34px;
  }

  .detail-image {
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    aspect-ratio: 1 / 1;
  }

  .detail-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 800;
    color: var(--violet-600);
    background: var(--bg-soft);
  }

  .wish-float {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.9);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .wish-float.wish-active {
    color: #ef4444;
  }

  .detail-title {
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 12px;
  }

  .detail-price {
    font-size: 26px;
    font-weight: 800;
    color: var(--violet-700);
    margin-bottom: 16px;
  }

  .stock-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 999px;
    margin-bottom: 20px;
  }

  .stock-badge.in-stock {
    color: #15803d;
    background: #dcfce7;
  }

  .stock-badge.out-stock {
    color: #b91c1c;
    background: #fee2e2;
  }

  .attr-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 22px;
  }

  .attr-table td {
    padding: 9px 0;
    border-bottom: 1px solid var(--border-color);
    font-size: 13.5px;
  }

  .attr-table td:first-child {
    color: var(--text-muted);
    width: 40%;
  }

  .attr-table td:last-child {
    font-weight: 600;
  }

  .detail-actions {
    display: flex;
    gap: 12px;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
    padding: 12px 20px;
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

  .btn-outline {
    padding: 12px 20px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    background: transparent;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-outline:hover {
    border-color: var(--violet-600);
    color: var(--violet-700);
  }

  @media (max-width: 720px) {
    .detail-layout {
      grid-template-columns: 1fr;
    }
  }
`;
