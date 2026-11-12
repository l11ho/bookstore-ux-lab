"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./admin.module.css";

const STATUS_LABELS = {
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

function money(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

function date(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.error || "Не удалось открыть панель.";
        if (response.status === 401) {
          throw new Error("Сначала войдите в BookStore под аккаунтом администратора. Откройте главную страницу и войдите.");
        }
        if (response.status === 403) {
          throw new Error("Этот аккаунт не имеет прав Admin. Проверьте, что вы добавили его User ID в таблицу bookstore_admins в Supabase.");
        }
        throw new Error(message);
      }
      setData(result);
    } catch (loadError) {
      setError(loadError.message || "Ошибка загрузки панели.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(orderId, status) {
    setSaving(orderId);
    setNotice("");
    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Не удалось обновить заказ.");
      setNotice("Статус заказа обновлён.");
      await load();
    } catch (updateError) {
      setNotice(updateError.message || "Не удалось обновить заказ.");
    } finally {
      setSaving("");
    }
  }

  const orders = Array.isArray(data?.orders) ? data.orders : [];

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
          <p>Управляйте заказами и следите за работой демонстрационного магазина.</p>
        </div>
        <button className={styles.refresh} type="button" onClick={load} disabled={loading}>
          {loading ? "Загрузка…" : "Обновить данные"}
        </button>
      </section>

      {error ? (
        <section className={styles.message} role="alert">
          <p>{error}</p>
          <div className={styles.messageActions}>
            <a href="/">Открыть BookStore</a>
            <button type="button" onClick={load}>Повторить</button>
          </div>
        </section>
      ) : loading && !data ? (
        <section className={styles.message} role="status">Загружаем данные магазина…</section>
      ) : data ? (
        <>
          <section className={styles.metrics} aria-label="Показатели магазина">
            <article className={styles.metric}>
              <span>Всего заказов</span>
              <strong>{Number(data.totalOrders || 0).toLocaleString("ru-RU")}</strong>
              <small>Все оформленные заказы</small>
            </article>
            <article className={styles.metric}>
              <span>В обработке</span>
              <strong>{Number(data.processingOrders || 0).toLocaleString("ru-RU")}</strong>
              <small>Ожидают следующего этапа</small>
            </article>
            <article className={styles.metric}>
              <span>Покупатели</span>
              <strong>{Number(data.customerCount || 0).toLocaleString("ru-RU")}</strong>
              <small>Уникальные аккаунты с заказами</small>
            </article>
            <article className={styles.metric}>
              <span>Выручка · Demo</span>
              <strong>{money(data.demoRevenueCents)}</strong>
              <small>Сумма демонстрационных заказов</small>
            </article>
          </section>

          {notice && <p className={styles.notice} role="status">{notice}</p>}

          <section className={styles.ordersSection}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>ПОСЛЕДНИЕ ПОКУПКИ</p>
                <h2>Заказы</h2>
              </div>
              <span>{orders.length} последних</span>
            </div>

            {orders.length ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Заказ</th>
                      <th>Покупатель</th>
                      <th>Состав</th>
                      <th>Сумма</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const address = order.shipping_address && typeof order.shipping_address === "object"
                        ? order.shipping_address : {};
                      const items = Array.isArray(order.items) ? order.items : [];
                      return (
                        <tr key={order.id}>
                          <td>
                            <strong className={styles.orderNumber}>{order.order_number}</strong>
                            <span className={styles.subtle}>{date(order.created_at)}</span>
                          </td>
                          <td>
                            <strong>{address.full_name || "Покупатель"}</strong>
                            <span className={styles.subtle}>{address.email || order.user_id}</span>
                          </td>
                          <td>
                            <div className={styles.items}>
                              {items.map((item, index) => (
                                <span key={String(item.id || index) + "-" + index}>
                                  {item.title || "Книга"} × {item.quantity || 1}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <strong>{money(order.total_cents)}</strong>
                            <span className={styles.subtle}>Demo payment</span>
                          </td>
                          <td>
                            <select
                              className={styles.statusSelect}
                              value={STATUS_LABELS[order.order_status] ? order.order_status : "processing"}
                              disabled={saving === order.id}
                              onChange={(event) => updateStatus(order.id, event.target.value)}
                              aria-label={"Статус заказа " + order.order_number}
                            >
                              <option value="processing">В обработке</option>
                              <option value="shipped">Отправлен</option>
                              <option value="delivered">Доставлен</option>
                              <option value="cancelled">Отменён</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.empty}>Пока нет заказов. Когда покупатели оформят заказ, он появится здесь.</div>
            )}
          </section>
        </>
      ) : null}

      <footer className={styles.footer}>
        <span>BookStore UX Lab</span>
        <span>Административный доступ · Защищён Supabase</span>
      </footer>
    </main>
  );
}
