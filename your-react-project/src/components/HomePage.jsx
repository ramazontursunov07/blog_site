import { useState, useEffect, useMemo } from "react";

// Backend manzilini shu yerda o'zgartiring
const API_BASE = "http://127.0.0.1:8000/api/v1";
const MEDIA_BASE = "http://127.0.0.1:8000";

// ---------- Tarjimalar ----------
const translations = {
  uz: {
    brand: "Online Do'kon",
    search: "Mahsulot qidiring...",
    sections: "Bo'limlar",
    newProducts: "Yangi mahsulotlar",
    discounted: "Chegirmadagi mahsulotlar",
    wishlist: "Saralangan mahsulotlar",
    profile: "Profil",
    logout: "Chiqish",
    save: "Saqlash",
    cancel: "Bekor qilish",
    editProfile: "Profilni tahrirlash",
    firstName: "Ism",
    lastName: "Familiya",
    email: "Email",
    phone: "Telefon raqam",
    address: "Manzil",
    available: "Mavjud",
    pieces: "ta",
    noCategories: "Hozircha bo'limlar mavjud emas.",
    noProducts: "Hozircha mahsulot mavjud emas.",
    noWishlist: "Saralangan mahsulotlar yo'q. Yurakcha belgisini bosib qo'shing.",
    noDiscount: "Hozircha faol chegirmalar yo'q.",
    loading: "Yuklanmoqda...",
    until: "Tugash vaqti",
    connectionError: "Ma'lumotlarni yuklab bo'lmadi. Backend ishga tushganini tekshiring.",
    loginRequired: "Bu amal uchun tizimga kiring.",
    off: "chegirma",
  },
  ru: {
    brand: "Онлайн Магазин",
    search: "Поиск товара...",
    sections: "Категории",
    newProducts: "Новые товары",
    discounted: "Товары со скидкой",
    wishlist: "Избранное",
    profile: "Профиль",
    logout: "Выйти",
    save: "Сохранить",
    cancel: "Отмена",
    editProfile: "Редактировать профиль",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Email",
    phone: "Телефон",
    address: "Адрес",
    available: "В наличии",
    pieces: "шт",
    noCategories: "Категорий пока нет.",
    noProducts: "Товаров пока нет.",
    noWishlist: "Список избранного пуст. Нажмите на сердечко, чтобы добавить.",
    noDiscount: "Активных скидок пока нет.",
    loading: "Загрузка...",
    until: "До",
    connectionError: "Не удалось загрузить данные. Проверьте, запущен ли backend.",
    loginRequired: "Войдите в систему для этого действия.",
    off: "скидка",
  },
  en: {
    brand: "Online Shop",
    search: "Search products...",
    sections: "Categories",
    newProducts: "New products",
    discounted: "Discounted products",
    wishlist: "Wishlist",
    profile: "Profile",
    logout: "Log out",
    save: "Save",
    cancel: "Cancel",
    editProfile: "Edit profile",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone number",
    address: "Address",
    available: "In stock",
    pieces: "pcs",
    noCategories: "No categories yet.",
    noProducts: "No products yet.",
    noWishlist: "Your wishlist is empty. Tap the heart to add items.",
    noDiscount: "No active discounts right now.",
    loading: "Loading...",
    until: "Ends",
    connectionError: "Couldn't load data. Check that the backend is running.",
    loginRequired: "Please log in to do this.",
    off: "off",
  },
};

export default function HomePage({ token, isStaff, onLogout, onOpenCart, onOpenCategory, onOpenProduct, onOpenOrders, onOpenFAQ, onOpenAdmin }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("language") || "uz"
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const [categories, setCategories] = useState([]);
  const [productsAll, setProductsAll] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState("loading"); // loading | ok | empty | error

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);

  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showWishlistPanel, setShowWishlistPanel] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const t = translations[language];
  // Backend JWT (SimpleJWT) ishlatadi, shuning uchun "Bearer" prefiksi kerak ("Token" emas)
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    loadHomeData();
    if (token) {
      loadCartCount();
      loadWishlist();
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    if (data && Array.isArray(data.categories)) return data.categories;
    if (data && Array.isArray(data.products)) return data.products;
    return [];
  }

  async function fetchAllPages(url) {
    let results = [];
    let nextUrl = url;
    let guard = 0;
    while (nextUrl && guard < 50) {
      guard += 1;
      const res = await fetch(nextUrl, { headers: authHeaders });
      if (!res.ok) break;
      const data = await res.json();
      if (Array.isArray(data)) {
        results = results.concat(data);
        nextUrl = null;
      } else {
        results = results.concat(data.results || data.products || data.categories || []);
        nextUrl = data.next || null;
      }
    }
    return results;
  }

  async function loadHomeData() {
    setLoading(true);
    setError("");
    try {
      const [categoriesData, productsData, flashRes] = await Promise.all([
        fetchAllPages(`${API_BASE}/categories/`),
        fetchAllPages(`${API_BASE}/products/`),
        fetch(`${API_BASE}/flash-sale/`, { headers: authHeaders }),
      ]);

      setCategories(categoriesData);
      setProductsAll(productsData);
      setFlashSales(flashRes.ok ? normalizeList(await flashRes.json()) : []);
    } catch (err) {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  }

  async function loadCartCount() {
    try {
      const res = await fetch(`${API_BASE}/cart/`, { headers: authHeaders });
      if (!res.ok) return;
      const items = normalizeList(await res.json());
      setCartCount(items.reduce((sum, item) => sum + (item.quantity || 1), 0));
    } catch (err) {
      /* jim o'tkaziladi */
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

  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/profile/`, { headers: authHeaders });
      if (!res.ok) {
        // Sabab aniq bo'lishi uchun konsolga chiqaramiz (F12 -> Console)
        console.error("Profil so'rovi muvaffaqiyatsiz:", res.status, res.statusText, await res.text().catch(() => ""));
        setProfileStatus(res.status === 404 ? "empty" : "error");
        return;
      }
      const data = await res.json();
      // Backend ba'zan ro'yxat (array/{results:[...]}) qaytaradi,
      // ba'zan esa "mening profilim" uchun bitta object qaytaradi.
      // Ikkala holatni ham to'g'ri qayta ishlaymiz.
      const items = normalizeList(data);
      const profileData =
        items.length > 0
          ? items[0]
          : data && typeof data === "object" && !Array.isArray(data) && data.id
          ? data
          : null;

      if (profileData) {
        setProfile(profileData);
        setProfileForm(profileData);
        setProfileStatus("ok");
      } else {
        console.error("Profil javobi kutilgan formatda emas:", data);
        setProfileStatus("empty");
      }
    } catch (err) {
      // Tarmoq xatosi, CORS yoki backend umuman javob bermayotgan bo'lishi mumkin
      console.error("Profilni yuklashda tarmoq xatosi:", err);
      setProfileStatus("error");
    }
  }

  async function handleAddToCart(productId) {
    if (!token) {
      setError(t.loginRequired);
      return;
    }
    setBusyProductId(productId);
    try {
      const res = await fetch(`${API_BASE}/cart/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ product: productId }),
      });
      if (res.ok) loadCartCount();
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
    // optimistik yangilash — darhol UI'da almashtiramiz
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
      // xato bo'lsa, orqaga qaytaramiz
      loadWishlist();
    }
  }

  function openProfileEdit() {
    setProfileForm(profile);
    setEditingProfile(true);
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    if (!profile?.id) return;
    setProfileSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile/${profile.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          email: profileForm.email,
          phone_number: profileForm.phone_number,
          address: profileForm.address,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditingProfile(false);
      }
    } catch (err) {
      /* jim o'tkaziladi */
    } finally {
      setProfileSaving(false);
    }
  }

  function imageUrl(obj) {
    if (!obj?.image || typeof obj.image !== "string") return null;
    return obj.image.startsWith("http") ? obj.image : `${MEDIA_BASE}${obj.image}`;
  }

  const productsById = useMemo(() => {
    const map = {};
    productsAll.forEach((p) => (map[p.id] = p));
    return map;
  }, [productsAll]);

  const newProducts = productsAll.slice(0, 8);
  const wishlistProducts = Array.from(wishlistIds)
    .map((id) => productsById[id])
    .filter(Boolean);

  function ProductCard({ product }) {
    const isWished = wishlistIds.has(product.id);
    return (
      <div className="product-card">
        <button
          className={isWished ? "wish-btn wish-active" : "wish-btn"}
          onClick={() => handleToggleWishlist(product.id)}
          title="Saralanganlarga qo'shish"
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
              title="Savatchaga qo'shish"
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
  }

  return (
    <div className="shop-shell">
      <style>{styles}</style>

      <header className="site-header">
        <div className="brand">
          <span className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          {t.brand}
        </div>

        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input type="text" placeholder={t.search} />
        </div>

        <div className="header-actions">
          <select
            className="lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="uz">UZ</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>

          <button
            className="icon-btn"
            title="Rejim"
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <button
            className="icon-btn wish-header-btn"
            title={t.wishlist}
            onClick={() => setShowWishlistPanel((prev) => !prev)}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20s-7-4.4-9.5-8.8C.7 8 2 4.5 5.4 3.7c2-.5 4 .3 5.1 2 1.1-1.7 3.1-2.5 5.1-2 3.4.8 4.7 4.3 2.9 7.5C19 15.6 12 20 12 20Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="wish-header-label">{t.wishlist}</span>
            {wishlistIds.size > 0 && <span className="badge">{wishlistIds.size}</span>}
          </button>

          {isStaff && (
            <button className="admin-entry-btn" title="Admin panel" onClick={onOpenAdmin}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              Admin
            </button>
          )}

          <button className="icon-btn" title="FAQ" onClick={onOpenFAQ}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M9.5 9.5a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 1.7-2.4 3.7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="12" cy="17" r="0.9" fill="currentColor" />
            </svg>
          </button>

          {token && (
            <button className="icon-btn" title="Buyurtmalarim" onClick={onOpenOrders}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <button className="icon-btn" title="Savatcha" onClick={onOpenCart}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 4h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="21" r="1.5" fill="currentColor" />
              <circle cx="17" cy="21" r="1.5" fill="currentColor" />
            </svg>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>

          {token && (
            <button
              className="avatar-btn"
              title={t.profile}
              onClick={() => setShowProfilePanel((prev) => !prev)}
            >
              {(profile?.first_name?.[0] || "U").toUpperCase()}
            </button>
          )}

          {token && (
            <button className="icon-btn logout" title={t.logout} onClick={onLogout}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 8l-4 4 4 4M3 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ---------- Profil paneli ---------- */}
      {showProfilePanel && (
        <div className="panel-overlay" onClick={() => setShowProfilePanel(false)}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2>{t.profile}</h2>
              <button className="close-btn" onClick={() => setShowProfilePanel(false)}>
                ✕
              </button>
            </div>

            {!profile && profileStatus === "loading" ? (
              <p className="loading-text">{t.loading}</p>
            ) : !profile && profileStatus === "error" ? (
              <p className="loading-text">
                Profilni yuklab bo'lmadi. Internetni yoki tizimga kirganingizni tekshiring.
              </p>
            ) : !profile && profileStatus === "empty" ? (
              <p className="loading-text">
                Profil ma'lumotlari topilmadi. Ro'yxatdan o'tishda xatolik yuz bergan bo'lishi mumkin.
              </p>
            ) : editingProfile ? (
              <form className="profile-form" onSubmit={handleProfileSave}>
                <div className="form-group">
                  <label>{t.firstName}</label>
                  <input
                    type="text"
                    value={profileForm.first_name || ""}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, first_name: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>{t.lastName}</label>
                  <input
                    type="text"
                    value={profileForm.last_name || ""}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, last_name: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>{t.email}</label>
                  <input
                    type="email"
                    value={profileForm.email || ""}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>{t.phone}</label>
                  <input
                    type="tel"
                    value={profileForm.phone_number || ""}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, phone_number: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>{t.address}</label>
                  <input
                    type="text"
                    value={profileForm.address || ""}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>
                <div className="panel-actions">
                  <button type="submit" className="btn-primary" disabled={profileSaving}>
                    {profileSaving ? "..." : t.save}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setEditingProfile(false)}
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-view">
                <div className="profile-avatar-big">
                  {(profile.first_name?.[0] || "U").toUpperCase()}
                </div>
                <p className="profile-name">
                  {profile.first_name} {profile.last_name}
                </p>
                <div className="profile-row">
                  <span>{t.email}</span>
                  <strong>{profile.email}</strong>
                </div>
                <div className="profile-row">
                  <span>{t.phone}</span>
                  <strong>{profile.phone_number}</strong>
                </div>
                <div className="profile-row">
                  <span>{t.address}</span>
                  <strong>{profile.address}</strong>
                </div>
                <button className="btn-primary" onClick={openProfileEdit}>
                  {t.editProfile}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Wishlist paneli ---------- */}
      {showWishlistPanel && (
        <div className="panel-overlay" onClick={() => setShowWishlistPanel(false)}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2>{t.wishlist}</h2>
              <button className="close-btn" onClick={() => setShowWishlistPanel(false)}>
                ✕
              </button>
            </div>
            {wishlistProducts.length === 0 ? (
              <p className="empty-text">{t.noWishlist}</p>
            ) : (
              <div className="wishlist-list">
                {wishlistProducts.map((product) => (
                  <div key={product.id} className="wishlist-row">
                    <div className="wishlist-thumb">
                      {imageUrl(product) ? (
                        <img src={imageUrl(product)} alt={product.name} />
                      ) : (
                        <div className="product-placeholder">{product.name?.[0]}</div>
                      )}
                    </div>
                    <div className="wishlist-info">
                      <p className="wishlist-title">{product.name}</p>
                      <span className="wishlist-price">
                        {Number(product.price).toLocaleString("uz-UZ")} so'm
                      </span>
                    </div>
                    <button
                      className="wish-btn wish-active"
                      onClick={() => handleToggleWishlist(product.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 20s-7-4.4-9.5-8.8C.7 8 2 4.5 5.4 3.7c2-.5 4 .3 5.1 2 1.1-1.7 3.1-2.5 5.1-2 3.4.8 4.7 4.3 2.9 7.5C19 15.6 12 20 12 20Z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="page-main">
        {error && <div className="alert">{error}</div>}

        {flashSales.length > 0 && (
          <section className="hero-banner">
            <div className="hero-eyebrow">Maxsus taklif</div>
            <h1 className="hero-title">
              {flashSales[0].product_name} — {flashSales[0].discount_percentage}% {t.off}!
            </h1>
            <p className="hero-subtitle">
              {t.until}: {new Date(flashSales[0].end_time).toLocaleString("uz-UZ")}
            </p>
          </section>
        )}

        <h2 className="section-eyebrow">{t.sections}</h2>

        {loading ? (
          <p className="loading-text">{t.loading}</p>
        ) : (
          <div className="category-grid">
            {categories.length === 0 && <p className="empty-text">{t.noCategories}</p>}
            {categories.map((category) => (
              <div key={category.id} className="category-card" onClick={() => onOpenCategory?.(category.id)}>
                <div className="category-image">
                  {imageUrl(category) ? (
                    <img src={imageUrl(category)} alt={category.name} />
                  ) : (
                    <div className="category-placeholder">{category.name?.[0]}</div>
                  )}
                </div>
                <h3 className="category-title">{category.name}</h3>
              </div>
            ))}
          </div>
        )}

        {/* ---------- Chegirmadagi mahsulotlar ---------- */}
        <div className="section-header">
          <h2>{t.discounted}</h2>
        </div>
        {!loading && (
          <div className="discount-grid">
            {flashSales.length === 0 && <p className="empty-text">{t.noDiscount}</p>}
            {flashSales.map((sale) => {
              const product = productsById[sale.product];
              return (
                <div key={sale.id} className="discount-card">
                  <span className="discount-badge">-{sale.discount_percentage}%</span>
                  <div className="product-image">
                    {sale.product_image ? (
                      <img
                        src={
                          sale.product_image.startsWith("http")
                            ? sale.product_image
                            : `${MEDIA_BASE}${sale.product_image}`
                        }
                        alt={sale.product_name}
                      />
                    ) : product && imageUrl(product) ? (
                      <img src={imageUrl(product)} alt={sale.product_name} />
                    ) : (
                      <div className="product-placeholder">{sale.product_name?.[0]}</div>
                    )}
                  </div>
                  <div className="product-body">
                    <h3 className="product-title">{sale.product_name}</h3>
                    {product && (
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------- Yangi mahsulotlar ---------- */}
        <div className="section-header">
          <h2>{t.newProducts}</h2>
        </div>
        {!loading && (
          <div className="product-grid">
            {newProducts.length === 0 && <p className="empty-text">{t.noProducts}</p>}
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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

  .shop-shell {
    min-height: 100vh;
    background: var(--bg-page);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--text-primary);
    transition: background 0.2s ease, color 0.2s ease;
  }

  .site-header {
    display: flex;
    align-items: center;
    gap: 18px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 17px;
    font-weight: 700;
    white-space: nowrap;
  }

  .brand-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .search-box {
    flex: 1;
    max-width: 380px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-page);
    border: 1px solid var(--border-color);
    border-radius: 999px;
    padding: 8px 16px;
    color: var(--text-muted);
  }

  .search-box input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    width: 100%;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .lang-select {
    border: 1px solid var(--border-color);
    background: var(--bg-page);
    color: var(--text-primary);
    border-radius: 8px;
    padding: 7px 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    outline: none;
  }

  .icon-btn, .avatar-btn {
    position: relative;
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
    transition: background 0.15s ease, color 0.15s ease;
  }

  .wish-header-btn {
    width: auto;
    height: 36px;
    border-radius: 999px;
    padding: 0 14px 0 12px;
    gap: 7px;
  }

  .wish-header-label {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .wish-header-label {
      display: none;
    }
    .wish-header-btn {
      width: 36px;
      padding: 0;
    }
  }

  .icon-btn:hover {
    background: var(--bg-soft);
    color: var(--violet-700);
  }

  .icon-btn.logout:hover {
    background: #fee2e2;
    color: #ef4444;
  }

  .avatar-btn {
    background: var(--bg-soft);
    color: var(--violet-700);
    font-weight: 800;
    font-size: 13px;
  }

  .admin-entry-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    color: #fff;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .admin-entry-btn:hover {
    box-shadow: 0 4px 12px rgba(76, 29, 149, 0.3);
  }

  .badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .page-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 26px 24px 56px;
  }

  .alert {
    background: #fee2e2;
    color: #b91c1c;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .hero-banner {
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    border-radius: 20px;
    padding: 30px 34px;
    color: #fff;
    margin-bottom: 30px;
  }

  .hero-eyebrow {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.75);
    margin-bottom: 8px;
  }

  .hero-title {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 6px;
  }

  .hero-subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }

  .section-eyebrow {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin: 0 0 14px;
  }

  .section-header {
    margin: 30px 0 14px;
  }

  .section-header h2 {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin: 0;
  }

  .loading-text, .empty-text {
    color: var(--text-muted);
    font-size: 14px;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 14px;
  }

  .category-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 14px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .category-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(76, 29, 149, 0.1);
  }

  .category-image {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 8px;
    background: var(--bg-page);
  }

  .category-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .category-placeholder, .product-placeholder {
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

  .category-title {
    font-size: 13px;
    font-weight: 700;
    margin: 0;
  }

  .product-grid, .discount-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 16px;
  }

  .product-card, .discount-card {
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    overflow: hidden;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .product-card:hover, .discount-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(76, 29, 149, 0.1);
  }

  .discount-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
    background: #ef4444;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 3px 9px;
    border-radius: 999px;
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
    transition: color 0.15s ease, background 0.15s ease;
  }

  .wish-btn.wish-active {
    color: #ef4444;
  }

  .wish-btn:hover {
    background: #fff;
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
    font-size: 12px;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .add-btn:hover:not(:disabled) {
    background: var(--violet-600);
    color: #fff;
  }

  .add-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ---------- Panellar (Profil / Wishlist) ---------- */
  .panel-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 50;
    display: flex;
    justify-content: flex-end;
  }

  .side-panel {
    width: 100%;
    max-width: 380px;
    height: 100%;
    background: var(--bg-card);
    padding: 22px;
    overflow-y: auto;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .panel-header h2 {
    font-size: 17px;
    font-weight: 800;
    margin: 0;
    color: var(--text-primary);
  }

  [data-theme="dark"] .panel-header h2 {
    color: #f4f4f5 !important;
  }

  .close-btn {
    border: none;
    background: var(--bg-soft);
    color: var(--text-secondary);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
  }

  .profile-avatar-big {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    color: #fff;
    font-size: 22px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
  }

  .profile-name {
    text-align: center;
    font-size: 16px;
    font-weight: 800;
    margin: 0 0 18px;
    color: var(--text-primary);
  }

  [data-theme="dark"] .profile-name {
    color: #f4f4f5 !important;
  }

  .profile-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color);
    font-size: 13px;
    color: var(--text-secondary);
  }

  .profile-row strong {
    color: var(--text-primary);
  }

  [data-theme="dark"] .profile-row strong {
    color: #f4f4f5 !important;
  }

  .profile-view .btn-primary {
    width: 100%;
    margin-top: 20px;
  }

  .profile-form .form-group {
    margin-bottom: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .profile-form label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .profile-form input {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-page);
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
  }

  .profile-form input:focus {
    border-color: var(--violet-600);
  }

  .panel-actions {
    display: flex;
    gap: 10px;
    margin-top: 6px;
  }

  .btn-primary {
    padding: 10px 16px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    flex: 1;
  }

  .btn-outline {
    padding: 10px 16px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    background: transparent;
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .wishlist-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .wishlist-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
  }

  .wishlist-thumb {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-page);
    flex-shrink: 0;
  }

  .wishlist-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .wishlist-info {
    flex: 1;
    min-width: 0;
  }

  .wishlist-title {
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 4px;
  }

  .wishlist-price {
    font-size: 12px;
    color: var(--violet-700);
    font-weight: 700;
  }
`;
