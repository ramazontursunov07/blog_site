import { useState } from "react";
import AdminCategories from "./AdminCategories";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminProfiles from "./AdminProfiles";
import AdminFlashSales from "./AdminFlashSales";

// Backend manzili — HomePage/AuthPage bilan bir xil bo'lishi kerak
export const API_BASE = "http://127.0.0.1:8000/api/v1";
export const MEDIA_BASE = "http://127.0.0.1:8000";

const NAV_ITEMS = [
  { key: "categories", label: "Bo'limlar", icon: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" },
  { key: "products", label: "Mahsulotlar", icon: "M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Zm3 0V6a3 3 0 0 1 6 0v2" },
  { key: "orders", label: "Buyurtmalar", icon: "M4 4h16v16H4z M8 9h8 M8 13h5" },
  { key: "profiles", label: "Foydalanuvchilar", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" },
  { key: "flashsales", label: "Flash-seyllar", icon: "M13 2 3 14h7l-1 8 11-14h-7l1-6Z" },
];

export default function AdminPage({ token, onBack, onLogout }) {
  const [tab, setTab] = useState("categories");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <div className="admin-shell">
      <style>{styles}</style>

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          Admin panel
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? "admin-nav-item admin-nav-active" : "admin-nav-item"}
              onClick={() => setTab(item.key)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d={item.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-ghost-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Do'konga qaytish
          </button>
          <button className="admin-ghost-btn admin-logout" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 8l-4 4 4 4M3 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Chiqish
          </button>
        </div>
      </aside>

      <main className="admin-content">
        {tab === "categories" && <AdminCategories token={token} authHeaders={authHeaders} />}
        {tab === "products" && <AdminProducts token={token} authHeaders={authHeaders} />}
        {tab === "orders" && <AdminOrders token={token} authHeaders={authHeaders} />}
        {tab === "profiles" && <AdminProfiles token={token} authHeaders={authHeaders} />}
        {tab === "flashsales" && <AdminFlashSales token={token} authHeaders={authHeaders} />}
      </main>
    </div>
  );
}

export const styles = `
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

  .admin-shell {
    min-height: 100vh;
    display: flex;
    background: var(--bg-page);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--text-primary);
  }

  /* ---------- Sidebar ---------- */
  .admin-sidebar {
    width: 232px;
    flex-shrink: 0;
    background: #1b1230;
    color: #e4e0f5;
    display: flex;
    flex-direction: column;
    padding: 22px 16px;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .admin-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    padding: 0 8px 22px;
  }

  .admin-brand-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .admin-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .admin-nav-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #b8adda;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .admin-nav-item:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  .admin-nav-active {
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    color: #fff;
  }

  .admin-sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .admin-ghost-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #b8adda;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .admin-ghost-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  .admin-logout:hover {
    color: #fca5a5;
  }

  /* ---------- Content ---------- */
  .admin-content {
    flex: 1;
    padding: 28px 32px 60px;
    max-width: 1180px;
  }

  .admin-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .admin-title {
    font-size: 20px;
    font-weight: 800;
    margin: 0;
  }

  .admin-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 4px 0 0;
  }

  .admin-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-600));
    color: #fff;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
  }

  .admin-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .admin-btn-outline {
    padding: 9px 16px;
    border: 1px solid var(--border-color);
    border-radius: 999px;
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .admin-btn-danger {
    padding: 7px 13px;
    border: 1px solid #fecaca;
    border-radius: 999px;
    background: #fff;
    color: #ef4444;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
  }

  .admin-btn-danger:hover {
    background: #fee2e2;
  }

  .admin-icon-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .admin-icon-btn:hover {
    color: var(--violet-700);
    background: var(--bg-soft);
  }

  .admin-alert {
    background: #fee2e2;
    color: #b91c1c;
    padding: 11px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .admin-loading, .admin-empty {
    color: var(--text-muted);
    font-size: 14px;
    padding: 30px 0;
    text-align: center;
  }

  /* ---------- Jadval ---------- */
  .admin-table-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    overflow: hidden;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }

  .admin-table th {
    text-align: left;
    padding: 12px 16px;
    background: var(--bg-page);
    color: var(--text-secondary);
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid var(--border-color);
  }

  .admin-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
  }

  .admin-table tr:last-child td {
    border-bottom: none;
  }

  .admin-row-thumb {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-page);
    flex-shrink: 0;
  }

  .admin-row-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .admin-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
  }

  .admin-row-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .admin-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
  }

  .admin-badge-green { background: #dcfce7; color: #15803d; }
  .admin-badge-gray { background: #f1f5f9; color: #64748b; }
  .admin-badge-yellow { background: #fef3c7; color: #b45309; }
  .admin-badge-blue { background: #dbeafe; color: #1d4ed8; }
  .admin-badge-red { background: #fee2e2; color: #b91c1c; }

  /* ---------- Modal / forma paneli ---------- */
  .admin-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 10, 30, 0.45);
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .admin-modal {
    width: 100%;
    max-width: 480px;
    max-height: 88vh;
    overflow-y: auto;
    background: var(--bg-card);
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  }

  .admin-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .admin-modal-header h2 {
    font-size: 17px;
    font-weight: 800;
    margin: 0;
  }

  .admin-close-btn {
    border: none;
    background: var(--bg-soft);
    color: var(--text-secondary);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 13px;
  }

  .admin-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
  }

  .admin-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .admin-form-group label {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .admin-form-group input,
  .admin-form-group select,
  .admin-form-group textarea {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-page);
    color: var(--text-primary);
    font-size: 13.5px;
    outline: none;
    font-family: inherit;
  }

  .admin-form-group input:focus,
  .admin-form-group select:focus,
  .admin-form-group textarea:focus {
    border-color: var(--violet-600);
  }

  .admin-checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .admin-checkbox-row input {
    width: 16px;
    height: 16px;
  }

  .admin-modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 6px;
  }

  .admin-modal-actions .admin-btn-primary,
  .admin-modal-actions .admin-btn-outline {
    flex: 1;
    justify-content: center;
  }

  .admin-image-preview {
    width: 100%;
    height: 130px;
    border-radius: 10px;
    background: var(--bg-page);
    border: 1px dashed var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 8px;
    color: var(--text-muted);
    font-size: 12px;
  }

  .admin-image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
