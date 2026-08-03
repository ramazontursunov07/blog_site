import { useState, useEffect } from "react";

const translations = {
  uz: {
    home: "Bosh sahifa",
    title: "Savol-javoblar",
    subtitle: "Ko'p beriladigan savollarga javoblar",
    faqs: [
      {
        q: "Buyurtmani qanday berish mumkin?",
        a: "Mahsulotni tanlab, \"Savatchaga qo'shish\" tugmasini bosing. Keyin savatcha sahifasiga o'tib, \"Buyurtma berish\" tugmasini bosing — buyurtmangiz darhol qabul qilinadi.",
      },
      {
        q: "Yetkazib berish qancha vaqt oladi?",
        a: "Odatda buyurtma 1-3 ish kuni ichida yetkazib beriladi. Aniq muddat mintaqangizga qarab farq qilishi mumkin.",
      },
      {
        q: "To'lov qanday amalga oshiriladi?",
        a: "Hozircha naqd pul yoki plastik karta orqali, mahsulot yetkazib berilganda to'lov qabul qilinadi.",
      },
      {
        q: "Buyurtmani bekor qilish mumkinmi?",
        a: "Ha, agar buyurtmangiz hali \"Kutilmoqda\" holatida bo'lsa, \"Buyurtmalarim\" bo'limidan uni bekor qilishingiz mumkin. Jarayonga kirgan buyurtmalarni bekor qilib bo'lmaydi.",
      },
      {
        q: "Mahsulotni qaytarish mumkinmi?",
        a: "Nuqsonli yoki noto'g'ri yetkazilgan mahsulotlarni 7 kun ichida qaytarishingiz mumkin. Buning uchun qo'llab-quvvatlash xizmati bilan bog'laning.",
      },
      {
        q: "\"Saralangan mahsulotlar\" nima uchun kerak?",
        a: "Yurakcha belgisini bosib, yoqtirgan mahsulotlaringizni alohida ro'yxatga saqlab qo'yishingiz mumkin — keyinroq ularga qaytib, xarid qilishingiz oson bo'ladi.",
      },
      {
        q: "Hisobimni qanday tahrirlayman?",
        a: "Profil belgisini bosib, ochilgan panelda \"Profilni tahrirlash\" tugmasi orqali ism, familiya, email, telefon va manzilingizni yangilashingiz mumkin.",
      },
      {
        q: "Parolimni unutsam nima qilaman?",
        a: "Hozircha parolni tiklash funksiyasi ishlab chiqilmoqda. Muammo yuzaga kelsa, qo'llab-quvvatlash xizmatiga murojaat qiling.",
      },
    ],
  },
  ru: {
    home: "Главная",
    title: "Вопросы и ответы",
    subtitle: "Ответы на часто задаваемые вопросы",
    faqs: [
      {
        q: "Как сделать заказ?",
        a: "Выберите товар и нажмите «Добавить в корзину». Затем перейдите в корзину и нажмите «Оформить заказ» — заказ будет принят сразу.",
      },
      {
        q: "Сколько занимает доставка?",
        a: "Обычно заказ доставляется в течение 1–3 рабочих дней. Точный срок может зависеть от вашего региона.",
      },
      {
        q: "Как происходит оплата?",
        a: "На данный момент оплата принимается наличными или картой при получении товара.",
      },
      {
        q: "Можно ли отменить заказ?",
        a: "Да, если заказ ещё в статусе «В ожидании», вы можете отменить его в разделе «Мои заказы». Заказы в обработке отменить нельзя.",
      },
      {
        q: "Можно ли вернуть товар?",
        a: "Бракованные или неправильно доставленные товары можно вернуть в течение 7 дней. Для этого свяжитесь со службой поддержки.",
      },
      {
        q: "Зачем нужен раздел «Избранное»?",
        a: "Нажимая на сердечко, вы сохраняете понравившиеся товары в отдельный список — так удобнее вернуться к ним позже.",
      },
      {
        q: "Как отредактировать свой профиль?",
        a: "Нажмите на значок профиля, и в открывшейся панели используйте кнопку «Редактировать профиль», чтобы обновить имя, email, телефон и адрес.",
      },
      {
        q: "Что делать, если забыл пароль?",
        a: "Функция восстановления пароля сейчас в разработке. При проблемах обратитесь в службу поддержки.",
      },
    ],
  },
  en: {
    home: "Home",
    title: "FAQ",
    subtitle: "Answers to frequently asked questions",
    faqs: [
      {
        q: "How do I place an order?",
        a: "Choose a product and click \"Add to cart\". Then go to your cart and click \"Place order\" — your order is accepted instantly.",
      },
      {
        q: "How long does delivery take?",
        a: "Orders are usually delivered within 1–3 business days. The exact time may vary depending on your region.",
      },
      {
        q: "How can I pay?",
        a: "Currently, payment is accepted in cash or by card upon delivery.",
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, if your order is still \"Pending\", you can cancel it from the \"My orders\" section. Orders already in processing can't be cancelled.",
      },
      {
        q: "Can I return a product?",
        a: "Defective or incorrectly delivered products can be returned within 7 days. Please contact support for this.",
      },
      {
        q: "What is the wishlist for?",
        a: "Tapping the heart icon saves products you like to a separate list, making it easy to come back to them later.",
      },
      {
        q: "How do I edit my profile?",
        a: "Click the profile icon, then use the \"Edit profile\" button in the panel to update your name, email, phone, and address.",
      },
      {
        q: "What if I forget my password?",
        a: "Password recovery is currently being developed. If you run into trouble, please contact support.",
      },
    ],
  },
};

export default function FAQPage({ onBack, onLogout, token }) {
  const [language] = useState(() => localStorage.getItem("language") || "uz");
  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const [openIndex, setOpenIndex] = useState(null);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggle(index) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="faq-shell">
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
        <h1 className="page-title">{t.title}</h1>
        <p className="page-subtitle">{t.subtitle}</p>

        <div className="faq-list">
          {t.faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className={isOpen ? "faq-item faq-open" : "faq-item"}>
                <button className="faq-question" onClick={() => toggle(index)}>
                  <span>{item.q}</span>
                  <svg
                    className="faq-chevron"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && <p className="faq-answer">{item.a}</p>}
              </div>
            );
          })}
        </div>
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

  .faq-shell {
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
    max-width: 760px;
    margin: 0 auto;
    padding: 30px 24px 56px;
  }

  .page-title {
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 6px;
  }

  .page-subtitle {
    font-size: 14px;
    color: var(--text-muted);
    margin: 0 0 26px;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .faq-item {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.15s ease;
  }

  .faq-item.faq-open {
    border-color: var(--violet-600);
  }

  .faq-question {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 14.5px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }

  .faq-chevron {
    flex-shrink: 0;
    color: var(--text-muted);
    transition: transform 0.2s ease, color 0.2s ease;
  }

  .faq-open .faq-chevron {
    transform: rotate(180deg);
    color: var(--violet-600);
  }

  .faq-answer {
    padding: 0 18px 18px;
    margin: 0;
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--text-secondary);
  }
`;
