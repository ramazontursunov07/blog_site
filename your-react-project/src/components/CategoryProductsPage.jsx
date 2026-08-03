import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api/v1";
const MEDIA_BASE = "http://127.0.0.1:8000";

const translations = {
  uz: {
    home: "Bosh sahifa",
    totalProducts: "ta mahsulot",
    available: "Mavjud",
    pieces: "ta",
    noProducts: "Bu bo'limda hozircha mahsulot yo'q",
    loading: "Yuklanmoqda...",
    connectionError: "Ma'lumotlarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.",
    loginRequired: "Bu amal uchun tizimga kiring.",
  },
  ru: {
    home: "Главная",
    totalProducts: "товаров",
    available: "В наличии",
    pieces: "шт",
    noProducts: "В этой категории пока нет товаров",
    loading: "Загрузка...",
    connectionError: "Не удалось загрузить данные. Проверьте backend.",
    loginRequired: "Войдите в систему для этого действия.",
  },
  en: {
    home: "Home",
    totalProducts: "products",
    available: "In stock",
    pieces: "pcs",
    noProducts: "No products in this category yet",
    loading: "Loading...",
    connectionError: "Couldn't load data. Check that the backend is running.",
    loginRequired: "Please log in to do this.",
  },
};

export default function CategoryProductsPage({ token, categoryId, onBack, onLogout, onOpenProduct }) {
  const [language] = useState(() => localStorage.getItem("language") || "uz");
  const [theme] = useState(() => localStorage.getItem("theme") || "light");

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);

  const t = translations[language];
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [categoryRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/categories/${categoryId}/`, { headers: authHeaders }),
        fetch(`${API_BASE}/products/?category=${categoryId}`, { headers: authHeaders }),
      ]);
      setCategory(categoryRes.ok ? await categoryRes.json() : null);
      setProducts(normalizeList(await productsRes.json()));

      if (token) loadWishlist();
    } catch (err) {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  }

  async function loadWishlist() {
    try {
      const res = await fetch(`${API_BASE}/wishes/`, { headers: authHeaders });
      if (!res.ok) return;
      const items = normalizeList(await res.json());
      setWishlistIds(new Set(items.map((item) => item.product)));
    } catch (err) {
      /* jim o'tkaziladi */
    }
  }

  async function handleAddToCart(productId) {
    if (!token) {
      setError(t.loginRequired);
      return;
    }
    setBusyProductId(productId);
    try {
      await fetch(`${API_BASE}/cart/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ product: productId }),
      });
    } catch (err) {
      /* jim o'tkaziladi */
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleToggleWishlist(productId) {
    if (!token) {
      setError(t.loginRequired);
      return;
    }
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
    try {
      await fetch(`${API_BASE}/wishes/toggle/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ product: productId }),
      });
    } catch (err) {
      loadWishlist();
    }
  }

  function imageUrl(obj) {
    if (!obj?.image || typeof obj.image !== "string") return null;
    return obj.image.startsWith("http") ? obj.image : `${MEDIA_BASE}${obj.image}`;
  }

  return (
    <div className="cat-shell">
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
        <div className="breadcrumb">
          <button onClick={onBack}>{t.home}</button>
          <span className="crumb-sep">›</span>
          <span className="crumb-current">{category?.name || "..."}</span>
        </div>

        {error && <div className="alert">{error}</div>}

        {category && (
          <section className="category-banner">
            <div className="category-banner-img">
              {imageUrl(category) ? (
                <img src={imageUrl(category)} alt={category.name} />
              ) : (
                <div className="banner-placeholder">{category.name?.[0]}</div>
              )}
            </div>
            <div>
              <h1 className="category-banner-title">{category.name}</h1>
              <p className="category-banner-meta">
                {products.length} {t.totalProducts}
              </p>
            </div>
          </section>
        )}

        {loading ? (
          <p className="loading-text">{t.loading}</p>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m21 21-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="empty-title">{t.noProducts}</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => {
              const isWished = wishlistIds.has(product.id);
              return (
                <div key={product.id} className="product-card">
                  <button
                    className={isWished ? "wish-btn wish-active" : "wish-btn"}
                    onClick={() => handleToggleWishlist(product.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isWished ? "currentColor" : "none"}>
                      <path
                        d="M12 20s-7-4.4-9.5-8.8C.7 8 2 4.5 5.4 3.7c2-.5 4 .3 5.1 2 1.1-1.7 3.1-2.5 5.1-2 3.4.8 4.7 4.3 2.9 7.5C19 15.6 12 20 12 20Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="product-image" onClick={() => onOpenProduct?.(product.id)} style={{ cursor: "pointer" }}>
                    {imageUrl(product) ? (
                      <img src={imageUrl(product)} alt={product.name} />
                    ) : (
                      <div className="product-placeholder">{product.name?.[0]}</div>
                    )}
                  </div>
                  <div className="product-body">
                    <h3 className="product-title" onClick={() => onOpenProduct?.(product.id)} style={{ cursor: "pointer" }}>{product.name}</h3>
                    <p className="product-stock">
                      {t.available}: {product.total} {t.pieces}
                    </p>
                    <div className="product-footer">
                      <span className="product-price">
                        {Number(product.price).toLocaleString("uz-UZ")} so'm
                      </span>
                      <button
                        className="add-btn"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={busyProductId === product.id}
                      >
                        {busyProductId === product.id ? (
                          "..."
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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

  .cat-shell {
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
    max-width: 1200px;
    margin: 0 auto;
    padding: 22px 24px 56px;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 18px;
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

  .alert {
    background: #fee2e2;
    color: #b91c1c;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 18px;
  }

  .category-banner {
    display: flex;
    align-items: center;
    gap: 18px;
    background: linear-gradient(135deg, var(--violet-600), #9061f0);
    border-radius: 18px;
    padding: 22px 26px;
    color: #fff;
    margin-bottom: 26px;
  }

  .category-banner-img {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    flex-shrink: 0;
  }

  .category-banner-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .banner-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: var(--violet-700);
  }

  .category-banner-title {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 4px;
  }

  .category-banner-meta {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }

  .loading-text {
    color: var(--text-muted);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--bg-soft);
    color: var(--violet-600);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .empty-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 18px;
  }

  .product-card {
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    overflow: hidden;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .product-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(76, 29, 149, 0.1);
  }

  .wish-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.85);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .wish-btn.wish-active {
    color: #ef4444;
  }

  .product-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    background: var(--bg-page);
  }

  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: var(--violet-600);
    background: var(--bg-soft);
  }

  .product-body {
    padding: 13px;
  }

  .product-title {
    font-size: 13.5px;
    font-weight: 700;
    margin: 0 0 4px;
  }

  .product-stock {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0 0 10px;
  }

  .product-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .product-price {
    font-size: 13.5px;
    font-weight: 800;
    color: var(--violet-700);
  }

  .add-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: var(--bg-soft);
    color: var(--violet-700);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .add-btn:hover:not(:disabled) {
    background: var(--violet-600);
    color: #fff;
  }

  .add-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
