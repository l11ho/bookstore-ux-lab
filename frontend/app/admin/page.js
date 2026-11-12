"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./admin.module.css";

const STATUS_LABELS = {
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};
const TABS = [
  ["overview", "Обзор"],
  ["books", "Книги"],
  ["orders", "Заказы"],
  ["customers", "Клиенты"],
  ["analytics", "Аналитика"],
];
const EMPTY_BOOK = {
  title: "", author: "", priceCents: 1990, category: "Художественная литература",
  description: "", coverNote: "", coverStyle: "default", coverUrl: "",
  sections: [], publisher: "BookStore Editions", year: 2026, pages: 320,
  shelf: "A-01", stock: 10, age: "16+", dimensions: "145×215×20 мм",
  weight: "420 г", binding: "Твёрдый переплёт",
  delivery: "Доставка по России — 2–5 дней", isPreorder: false,
  releaseDate: "", isActive: true, displayOrder: 1000,
};
const CATEGORIES = [
  "Художественная литература", "Бизнес и экономика", "Психология",
  "Саморазвитие", "История", "Наука и технологии", "Детские книги",
  "Искусство и дизайн", "Путешествия", "Образование",
  "Программирование", "Продуктивность", "Другое",
];
const SECTIONS = [
  ["new", "Новинки"], ["bestsellers", "Бестселлеры"], ["top10", "ТОП-10"],
  ["collectors", "Коллекционные издания"], ["comingSoon", "Скоро в продаже"],
];

function money(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
}
function date(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(parsed);
}
function toBook(book) {
  return {
    ...EMPTY_BOOK,
    id: book.id,
    title: book.title || "",
    author: book.author || "",
    priceCents: Number(book.price_cents ?? book.priceCents ?? 0),
    category: book.category || "Другое",
    description: book.description || "",
    coverNote: book.cover_note ?? book.coverNote ?? "",
    coverStyle: book.cover_style ?? book.coverStyle ?? "default",
    coverUrl: book.cover_url ?? book.coverUrl ?? "",
    sections: book.sections || [],
    publisher: book.publisher || "BookStore Editions",
    year: Number(book.publication_year ?? book.year ?? 2026),
    pages: Number(book.pages || 320),
    shelf: book.shelf || "A-01",
    stock: Number(book.stock || 0),
    age: book.age || "16+",
    dimensions: book.dimensions || "145×215×20 мм",
    weight: book.weight || "420 г",
    binding: book.binding || "Твёрдый переплёт",
    delivery: book.delivery || "Доставка по России — 2–5 дней",
    isPreorder: Boolean(book.is_preorder ?? book.isPreorder ?? book.comingSoon),
    releaseDate: book.release_date ?? book.releaseDate ?? "",
    isActive: Boolean(book.is_active ?? book.isActive ?? true),
    displayOrder: Number(book.display_order ?? book.displayOrder ?? 1000),
  };
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("overview");
  const [bookSearch, setBookSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState(EMPTY_BOOK);
  const [expandedOrder, setExpandedOrder] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) throw new Error("Сначала войдите в BookStore под аккаунтом администратора.");
        if (response.status === 403) throw new Error("У этого аккаунта нет прав Admin. Проверьте bookstore_admins в Supabase.");
        throw new Error(result.error || "Не удалось загрузить панель.");
      }
      setData(result);
    } catch (e) {
      setError(e.message || "Ошибка загрузки панели.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const books = useMemo(() => (Array.isArray(data?.books) ? data.books : []).map(toBook), [data]);
  const customers = Array.isArray(data?.customers) ? data.customers : [];

  async function updateStatus(orderId, status) {
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/admin", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Не удалось обновить заказ.");
      setNotice("Статус заказа обновлён."); await load();
    } catch (e) { setNotice(e.message || "Не удалось обновить заказ."); }
    finally { setSaving(false); }
  }

  function startNewBook() {
    setEditingBook(null);
    setBookForm({ ...EMPTY_BOOK, sections: [] });
    setNotice("");
  }
  function startEditBook(book) {
    setEditingBook(book.id);
    setBookForm({ ...book, sections: [...(book.sections || [])] });
    setNotice("");
  }
  function changeBookField(field, value) {
    setBookForm((current) => ({ ...current, [field]: value }));
  }
  function toggleSection(key) {
    setBookForm((current) => ({
      ...current,
      sections: current.sections.includes(key)
        ? current.sections.filter((item) => item !== key)
        : [...current.sections, key],
    }));
  }
  async function saveBook(event) {
    event.preventDefault(); setSaving(true); setNotice("");
    const payload = {
      ...bookForm,
      priceCents: Math.round(Number(bookForm.priceCents)),
      stock: Math.round(Number(bookForm.stock)),
      year: Math.round(Number(bookForm.year)),
      pages: Math.round(Number(bookForm.pages)),
      displayOrder: Math.round(Number(bookForm.displayOrder)),
    };
    if (editingBook) payload.id = editingBook;
    try {
      const response = await fetch("/api/admin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book: payload }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить книгу.");
      setEditingBook(null); setBookForm(EMPTY_BOOK);
      setNotice(editingBook ? "Изменения книги сохранены." : "Книга добавлена в каталог.");
      await load();
    } catch (e) { setNotice(e.message || "Не удалось сохранить книгу."); }
    finally { setSaving(false); }
  }
  async function archiveBook(book) {
    if (!window.confirm("Скрыть книгу «" + book.title + "» из каталога? История заказов сохранится.")) return;
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/admin", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Не удалось скрыть книгу.");
      setNotice("Книга скрыта из каталога."); await load();
    } catch (e) { setNotice(e.message || "Не удалось скрыть книгу."); }
    finally { setSaving(false); }
  }

  const visibleBooks = books.filter((book) =>
    (book.title + " " + book.author + " " + book.category).toLowerCase().includes(bookSearch.trim().toLowerCase())
  );
  const visibleOrders = orders.filter((order) => {
    const address = order.shipping_address || {};
    return (order.order_number + " " + (address.full_name || "") + " " + (address.email || ""))
      .toLowerCase().includes(orderSearch.trim().toLowerCase());
  });
  const visibleCustomers = customers.filter((customer) =>
    (customer.name + " " + customer.email + " " + customer.phone)
      .toLowerCase().includes(customerSearch.trim().toLowerCase())
  );
  const monthly = Array.isArray(data?.monthlyRevenue) ? data.monthlyRevenue : [];
  const maxRevenue = Math.max(1, ...monthly.map((item) => Number(item.revenueCents || 0)));
  const topBooks = Array.isArray(data?.topBooks) ? data.topBooks : [];
  const statusCounts = data?.statusCounts || {};

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href="/">
          <span className={styles.brandMark}>b.</span>
          <span>BookStore <small>ADMINISTRATION</small></span>
        </a>
        <a className={styles.storeLink} href="/">Вернуться в магазин ↗</a>
      </header>

      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>BOOKSTORE · CONTROL ROOM</p>
          <h1>Панель управления</h1>
          <p>Управление каталогом, заказами, клиентами и показателями магазина.</p>
        </div>
        <button className={styles.refresh} type="button" onClick={load} disabled={loading}>
          {loading ? "Загрузка…" : "Обновить данные"}
        </button>
      </section>

      <nav className={styles.tabs} aria-label="Разделы администрирования">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? styles.activeTab : ""}
            onClick={() => { setTab(key); setNotice(""); }}>
            {label}
            {key === "books" ? <span>{books.length}</span> : key === "orders" ? <span>{orders.length}</span> : key === "customers" ? <span>{customers.length}</span> : null}
          </button>
        ))}
      </nav>

      {error ? (
        <section className={styles.message} role="alert">
          <p>{error}</p><div className={styles.messageActions}><a href="/">Открыть BookStore</a><button type="button" onClick={load}>Повторить</button></div>
        </section>
      ) : loading && !data ? (
        <section className={styles.message} role="status">Загружаем данные магазина…</section>
      ) : data ? (
        <>
          {notice && <p className={styles.notice} role="status">{notice}</p>}

          {tab === "overview" && (
            <>
              <section className={styles.metrics} aria-label="Показатели магазина">
                <article className={styles.metric}><span>Всего заказов</span><strong>{Number(data.totalOrders || 0).toLocaleString("ru-RU")}</strong><small>Все оформленные заказы</small></article>
                <article className={styles.metric}><span>В обработке</span><strong>{Number(data.processingOrders || 0).toLocaleString("ru-RU")}</strong><small>Ожидают следующего этапа</small></article>
                <article className={styles.metric}><span>Покупатели</span><strong>{Number(data.customerCount || 0).toLocaleString("ru-RU")}</strong><small>Уникальные аккаунты с заказами</small></article>
                <article className={styles.metric}><span>Выручка · Demo</span><strong>{money(data.demoRevenueCents)}</strong><small>Оплаченные демонстрационные заказы</small></article>
                <article className={styles.metric}><span>Книги в каталоге</span><strong>{Number(data.totalBooks ?? books.filter((b) => b.isActive).length)}</strong><small>Активные позиции</small></article>
                <article className={styles.metric}><span>Мало на складе</span><strong>{Number(data.lowStockCount || 0)}</strong><small>Остаток 3 экземпляра или меньше</small></article>
              </section>
              <div className={styles.dashboardGrid}>
                <section className={styles.panel}>
                  <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ПОСЛЕДНИЕ ПОКУПКИ</p><h2>Новые заказы</h2></div><button className={styles.textButton} onClick={() => setTab("orders")}>Все заказы →</button></div>
                  {orders.slice(0, 5).map((order) => <div className={styles.compactRow} key={order.id}><div><strong>{order.order_number}</strong><small>{date(order.created_at)}</small></div><b>{money(order.total_cents)}</b><span className={styles.statusPill}>{STATUS_LABELS[order.order_status] || order.order_status}</span></div>)}
                  {!orders.length && <p className={styles.empty}>Заказов пока нет.</p>}
                </section>
                <section className={styles.panel}>
                  <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>СКЛАД</p><h2>Низкие остатки</h2></div><button className={styles.textButton} onClick={() => setTab("books")}>Каталог →</button></div>
                  {books.filter((book) => book.isActive && book.stock <= 3).slice(0, 6).map((book) => <div className={styles.compactRow} key={book.id}><div><strong>{book.title}</strong><small>{book.category}</small></div><b>{book.stock} шт.</b><span className={styles.lowStock}>Мало</span></div>)}
                  {!books.some((book) => book.isActive && book.stock <= 3) && <p className={styles.empty}>Нет книг с критически низким остатком.</p>}
                </section>
              </div>
            </>
          )}

          {tab === "books" && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>КАТАЛОГ МАГАЗИНА</p><h2>Управление книгами</h2></div><button className={styles.refresh} type="button" onClick={startNewBook}>＋ Добавить книгу</button></div>
              <div className={styles.toolbar}><input value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Поиск по названию, автору или категории…" /><span>{visibleBooks.length} книг</span></div>
              {editingBook !== null || bookForm !== EMPTY_BOOK ? (
                <form className={styles.bookForm} onSubmit={saveBook}>
                  <div className={styles.formHeading}><h3>{editingBook ? "Редактировать книгу" : "Новая книга"}</h3><button type="button" className={styles.textButton} onClick={() => { setEditingBook(null); setBookForm(EMPTY_BOOK); }}>Закрыть ✕</button></div>
                  <div className={styles.formGrid}>
                    <label>Название<input required minLength={2} value={bookForm.title} onChange={(e) => changeBookField("title", e.target.value)} /></label>
                    <label>Автор<input required minLength={2} value={bookForm.author} onChange={(e) => changeBookField("author", e.target.value)} /></label>
                    <label>Цена (USD)<input required type="number" min="0.01" step="0.01" value={(Number(bookForm.priceCents) / 100).toFixed(2)} onChange={(e) => changeBookField("priceCents", Math.round(Number(e.target.value) * 100))} /></label>
                    <label>Категория<select value={bookForm.category} onChange={(e) => changeBookField("category", e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label>Издательство<input value={bookForm.publisher} onChange={(e) => changeBookField("publisher", e.target.value)} /></label>
                    <label>Год издания<input type="number" min="1000" max="2100" value={bookForm.year} onChange={(e) => changeBookField("year", e.target.value)} /></label>
                    <label>Количество страниц<input type="number" min="1" value={bookForm.pages} onChange={(e) => changeBookField("pages", e.target.value)} /></label>
                    <label>Остаток на складе<input type="number" min="0" value={bookForm.stock} onChange={(e) => changeBookField("stock", e.target.value)} /></label>
                    <label>Полка / стеллаж<input value={bookForm.shelf} onChange={(e) => changeBookField("shelf", e.target.value)} /></label>
                    <label>Возраст<input value={bookForm.age} onChange={(e) => changeBookField("age", e.target.value)} /></label>
                    <label>Вес<input value={bookForm.weight} onChange={(e) => changeBookField("weight", e.target.value)} /></label>
                    <label>Размеры<input value={bookForm.dimensions} onChange={(e) => changeBookField("dimensions", e.target.value)} /></label>
                    <label>Переплёт<input value={bookForm.binding} onChange={(e) => changeBookField("binding", e.target.value)} /></label>
                    <label>Стиль обложки<input value={bookForm.coverStyle} onChange={(e) => changeBookField("coverStyle", e.target.value)} /></label>
                    <label className={styles.wide}>URL обложки (необязательно)<input type="url" value={bookForm.coverUrl} onChange={(e) => changeBookField("coverUrl", e.target.value)} placeholder="https://…" /></label>
                    <label className={styles.wide}>Краткая подпись на обложке<input value={bookForm.coverNote} onChange={(e) => changeBookField("coverNote", e.target.value)} /></label>
                    <label className={styles.wide}>Аннотация<textarea rows="3" value={bookForm.description} onChange={(e) => changeBookField("description", e.target.value)} /></label>
                    <label className={styles.wide}>Разделы главной страницы</label>
                    <div className={styles.checkGrid}>{SECTIONS.map(([key, label]) => <label key={key}><input type="checkbox" checked={bookForm.sections.includes(key)} onChange={() => toggleSection(key)} />{label}</label>)}</div>
                    <label className={styles.inlineCheck}><input type="checkbox" checked={bookForm.isPreorder} onChange={(e) => changeBookField("isPreorder", e.target.checked)} /> Предзаказ / скоро в продаже</label>
                    {bookForm.isPreorder && <label>Дата релиза<input value={bookForm.releaseDate} onChange={(e) => changeBookField("releaseDate", e.target.value)} placeholder="20 декабря 2026" /></label>}
                    <label className={styles.inlineCheck}><input type="checkbox" checked={bookForm.isActive} onChange={(e) => changeBookField("isActive", e.target.checked)} /> Показывать в каталоге</label>
                  </div>
                  <div className={styles.formActions}><button className={styles.refresh} type="submit" disabled={saving}>{saving ? "Сохранение…" : "Сохранить книгу"}</button><button type="button" className={styles.secondaryButton} onClick={() => { setEditingBook(null); setBookForm(EMPTY_BOOK); }}>Отмена</button></div>
                </form>
              ) : null}
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Книга</th><th>Категория</th><th>Цена</th><th>Остаток</th><th>Статус</th><th>Действия</th></tr></thead><tbody>
                {visibleBooks.map((book) => <tr key={book.id}><td><strong>{book.title}</strong><span className={styles.subtle}>{book.author}</span></td><td>{book.category}</td><td><strong>{money(book.priceCents)}</strong></td><td><span className={book.stock <= 3 && !book.isPreorder ? styles.lowStock : ""}>{book.isPreorder ? "Предзаказ" : book.stock + " шт."}</span></td><td>{book.isActive ? <span className={styles.goodPill}>Активна</span> : <span className={styles.statusPill}>Скрыта</span>}</td><td><div className={styles.actions}><button onClick={() => startEditBook(book)}>Изменить</button><button className={styles.dangerButton} disabled={saving || !book.isActive} onClick={() => archiveBook(book)}>Скрыть</button></div></td></tr>)}
              </tbody></table></div>
              {!visibleBooks.length && <p className={styles.empty}>Книги не найдены.</p>}
            </section>
          )}

          {tab === "orders" && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ПОКУПКИ</p><h2>Все заказы</h2></div><span>{visibleOrders.length} заказов</span></div>
              <div className={styles.toolbar}><input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Номер заказа, покупатель или email…" /></div>
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Заказ</th><th>Покупатель</th><th>Состав</th><th>Сумма</th><th>Оплата</th><th>Статус</th><th>Детали</th></tr></thead><tbody>
                {visibleOrders.map((order) => {
                  const address = order.shipping_address && typeof order.shipping_address === "object" ? order.shipping_address : {};
                  const items = Array.isArray(order.items) ? order.items : [];
                  return <tr key={order.id}><td><strong>{order.order_number}</strong><span className={styles.subtle}>{date(order.created_at)}</span></td><td><strong>{address.full_name || "Покупатель"}</strong><span className={styles.subtle}>{address.email || "—"}</span></td><td><div className={styles.items}>{items.map((item, i) => <span key={i}>{item.title} × {item.quantity || 1}</span>)}</div></td><td><strong>{money(order.total_cents)}</strong></td><td><span className={styles.goodPill}>{order.payment_status === "succeeded_demo" ? "Оплачено · Demo" : order.payment_status}</span><small className={styles.subtle}>{order.payment_method === "demo_card" ? "Demo Card" : "Demo PayPal"}</small></td><td><select className={styles.statusSelect} value={STATUS_LABELS[order.order_status] ? order.order_status : "processing"} disabled={saving} onChange={(e) => updateStatus(order.id, e.target.value)}><option value="processing">В обработке</option><option value="shipped">Отправлен</option><option value="delivered">Доставлен</option><option value="cancelled">Отменён</option></select></td><td><button className={styles.textButton} onClick={() => setExpandedOrder(expandedOrder === order.id ? "" : order.id)}>{expandedOrder === order.id ? "Скрыть" : "Подробнее"}</button>{expandedOrder === order.id && <div className={styles.detailBox}><strong>Доставка</strong><p>{address.full_name}<br />{address.address_line1}<br />{address.city}, {address.region} {address.postal_code}<br />{address.country}<br />{address.phone}<br />{address.email}</p><p>Товары: {items.map((item) => item.title + " × " + item.quantity).join(", ")}</p><p>Товары: {money(order.subtotal_cents)} · Доставка: {money(order.shipping_cents)} · Итого: {money(order.total_cents)}</p></div>}</td></tr>;
                })}
              </tbody></table></div>
              {!visibleOrders.length && <p className={styles.empty}>Заказы не найдены.</p>}
            </section>
          )}

          {tab === "customers" && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>СООБЩЕСТВО ЧИТАТЕЛЕЙ</p><h2>Клиенты</h2></div><span>{visibleCustomers.length} клиентов</span></div>
              <div className={styles.toolbar}><input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Поиск по имени, email или телефону…" /></div>
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Покупатель</th><th>Email / телефон</th><th>Заказов</th><th>Потрачено · Demo</th><th>Последний заказ</th><th>История</th></tr></thead><tbody>
                {visibleCustomers.map((customer) => <tr key={customer.userId}><td><strong>{customer.name || "Покупатель"}</strong><span className={styles.subtle}>{String(customer.userId).slice(0, 8)}…</span></td><td>{customer.email || "—"}<span className={styles.subtle}>{customer.phone || "—"}</span></td><td>{customer.ordersCount}</td><td><strong>{money(customer.totalSpentCents)}</strong></td><td>{date(customer.lastOrderAt)}</td><td><button className={styles.textButton} onClick={() => setExpandedCustomer(expandedCustomer === customer.userId ? "" : customer.userId)}>{expandedCustomer === customer.userId ? "Скрыть" : "Посмотреть"}</button>{expandedCustomer === customer.userId && <div className={styles.detailBox}>{(customer.orders || []).map((order) => <p key={order.id}><strong>{order.orderNumber}</strong><br />{date(order.createdAt)} · {money(order.totalCents)} · {STATUS_LABELS[order.status] || order.status}</p>)}</div>}</td></tr>)}
              </tbody></table></div>
              {!visibleCustomers.length && <p className={styles.empty}>Клиенты появятся после оформления заказов.</p>}
            </section>
          )}

          {tab === "analytics" && (
            <section className={styles.section}>
              <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ПОКАЗАТЕЛИ МАГАЗИНА</p><h2>Аналитика</h2></div><span>Все суммы — демонстрационные</span></div>
              <div className={styles.dashboardGrid}>
                <section className={styles.panel}><h3>Выручка за последние 6 месяцев</h3><div className={styles.chart}>{monthly.map((item) => <div className={styles.chartColumn} key={item.month}><strong>{money(item.revenueCents)}</strong><div className={styles.barTrack}><span style={{ height: Math.max(3, Number(item.revenueCents || 0) / maxRevenue * 100) + "%" }} /></div><small>{item.label || item.month}</small></div>)}</div><p className={styles.chartCaption}>Показаны успешные demo-заказы без отменённых покупок.</p></section>
                <section className={styles.panel}><h3>Статусы заказов</h3>{Object.entries({ processing: "В обработке", shipped: "Отправлен", delivered: "Доставлен", cancelled: "Отменён" }).map(([key, label]) => { const count = Number(statusCounts[key] || 0); const total = Math.max(1, Number(data.totalOrders || 0)); return <div className={styles.statusMetric} key={key}><span>{label}</span><div><i style={{ width: (count / total * 100) + "%" }} /></div><strong>{count}</strong></div>; })}</section>
              </div>
              <section className={styles.panel}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ПОПУЛЯРНОСТЬ</p><h2>Самые продаваемые книги</h2></div></div>
                {topBooks.length ? topBooks.map((book, index) => <div className={styles.rankRow} key={book.title}><b>{String(index + 1).padStart(2, "0")}</b><strong>{book.title}</strong><span>{book.quantity} шт.</span><em>{money(book.revenueCents)}</em></div>) : <p className={styles.empty}>Пока недостаточно продаж для рейтинга.</p>}
              </section>
            </section>
          )}
        </>
      ) : null}

      <footer className={styles.footer}><span>BookStore UX Lab</span><span>Административный доступ · Защищён Supabase · Demo checkout</span></footer>
    </main>
  );
}
