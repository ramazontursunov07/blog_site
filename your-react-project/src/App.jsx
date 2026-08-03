import { useState } from "react";
import AuthPage, { decodeToken } from "./components/AuthPage";
import HomePage from "./components/HomePage";
import CartPage from "./components/CartPage";
import CategoryProductsPage from "./components/CategoryProductsPage";
import ProductDetailPage from "./components/ProductDetailPage";
import OrdersPage from "./components/OrdersPage";
import FAQPage from "./components/FAQPage";
import AdminPage from "./components/AdminPage";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  // "home" | "cart" | "category" | "product" | "orders" | "faq" | "admin"
  const [page, setPage] = useState("home");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeProductId, setActiveProductId] = useState(null);

  // Tokendan is_staff/is_superuser ma'lumotini o'qiymiz (MyTokenObtainPairSerializer shu maydonlarni qo'shadi)
  const decoded = token ? decodeToken(token) : null;
  const isStaff = !!(decoded?.is_staff || decoded?.is_superuser);

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setPage("home");
  }

  function goHome() {
    setPage("home");
  }

  function openCart() {
    setPage("cart");
  }

  function openCategory(categoryId) {
    setActiveCategoryId(categoryId);
    setPage("category");
  }

  function openProduct(productId) {
    setActiveProductId(productId);
    setPage("product");
  }

  function openOrders() {
    setPage("orders");
  }

  function openFAQ() {
    setPage("faq");
  }

  function openAdmin() {
    if (isStaff) setPage("admin");
  }

  // Login qilinmagan bo'lsa — faqat AuthPage ko'rsatiladi
  if (!token) {
    return <AuthPage onAuthSuccess={(t) => setToken(t)} />;
  }

  // Xavfsizlik uchun: is_staff bo'lmasa admin sahifasi hech qachon ko'rsatilmaydi,
  // hatto "page" holati qandaydir yo'l bilan "admin" bo'lib qolsa ham
  if (page === "admin" && isStaff) {
    return <AdminPage token={token} onBack={goHome} onLogout={handleLogout} />;
  }

  if (page === "cart") {
    return <CartPage token={token} onBack={goHome} onLogout={handleLogout} />;
  }

  if (page === "category") {
    return (
      <CategoryProductsPage
        token={token}
        categoryId={activeCategoryId}
        onBack={goHome}
        onLogout={handleLogout}
        onOpenProduct={openProduct}
      />
    );
  }

  if (page === "product") {
    return (
      <ProductDetailPage
        token={token}
        productId={activeProductId}
        onBack={goHome}
        onOpenCategory={openCategory}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "orders") {
    return <OrdersPage token={token} onBack={goHome} onLogout={handleLogout} />;
  }

  if (page === "faq") {
    return <FAQPage token={token} onBack={goHome} onLogout={handleLogout} />;
  }

  // standart holat — bosh sahifa
  return (
    <HomePage
      token={token}
      isStaff={isStaff}
      onLogout={handleLogout}
      onOpenCart={openCart}
      onOpenCategory={openCategory}
      onOpenProduct={openProduct}
      onOpenOrders={openOrders}
      onOpenFAQ={openFAQ}
      onOpenAdmin={openAdmin}
    />
  );
}

export default App;
