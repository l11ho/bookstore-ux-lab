"use client";

import { useEffect, useState } from "react";
import styles from "./OrdersModal.module.css";

function usd(cents) {
  const amount = Number(cents);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const ORDER_STATUS = {
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export default function OrdersModal({ onClose, onBrowse }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/demo-orders", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Не удалось загрузить заказы.");
        }
        if (!controller.signal.aborted) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError.message || "Не удалось загрузить историю заказов.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadOrders();
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-title"
      >
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>BOOKSTORE · ЛИЧНЫЙ КАБИНЕТ</p>
            <h2 id="orders-title">Мои заказы</h2>
            <p className={styles.intro}>
              История покупок в демонстрационном магазине. Реальные платежи не проводятся.
            </p>
          </div>
          <button className={styles.close} onClick={onClose} type="button" aria-label="Закрыть историю заказов">×</button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.state} role="status">Загружаем ваши заказы…</div>
          ) : error ? (
            <div className={styles.state} role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Повторить</button>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.state}>
              <span className={styles.emptyIcon}>▤</span>
              <h3>У вас пока нет заказов</h3>
              <p>Выберите книгу и оформите первый демонстрационный заказ.</p>
              <button type="button" onClick={onBrowse}>Перейти к книгам</button>
            </div>
          ) : (
            <>
              <div className={styles.count}>
                <span>Последние заказы</span>
                <strong>{orders.length}</strong>
              </div>

              <div className={styles.list}>
                {orders.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const address = order.shipping_address && typeof order.shipping_address === "object"
                    ? order.shipping_address
                    : {};
                  const addressText = [
                    address.address_line1, address.city, address.region,
                    address.postal_code, address.country,
                  ].filter(Boolean).join(", ");

                  return (
                    <article className={styles.order} key={order.id}>
                      <div className={styles.orderTop}>
                        <div>
                          <p className={styles.orderNumber}>{order.order_number}</p>
                          <p className={styles.date}>{formatDate(order.created_at)}</p>
                        </div>
                        <span className={styles.status}>
                          {ORDER_STATUS[order.order_status] || "В обработке"}
                        </span>
                      </div>

                      <div className={styles.bookList}>
                        {items.map((item, index) => (
                          <div className={styles.book} key={String(item.id || index) + "-" + index}>
                            <span className={styles.bookIcon}>b.</span>
                            <div className={styles.bookInfo}>
                              <strong>{item.title || "Книга"}</strong>
                              <span>{item.author || ""} · {item.quantity || 1} шт.</span>
                            </div>
                            <strong className={styles.itemTotal}>
                              {usd(item.line_total_cents)}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div className={styles.orderBottom}>
                        <div>
                          <span className={styles.paid}>✓ Оплачено (демо)</span>
                          <span className={styles.method}>
                            {order.payment_method === "demo_paypal" ? "PayPal Demo" : "Card Demo"}
                          </span>
                        </div>
                        <strong className={styles.total}>{usd(order.total_cents)}</strong>
                      </div>

                      <details className={styles.details}>
                        <summary>Детали заказа</summary>
                        <dl>
                          <div><dt>Стоимость книг</dt><dd>{usd(order.subtotal_cents)}</dd></div>
                          <div><dt>Доставка</dt><dd>{Number(order.shipping_cents) === 0 ? "Бесплатно" : usd(order.shipping_cents)}</dd></div>
                          <div><dt>Получатель</dt><dd>{address.full_name || "—"}</dd></div>
                          <div><dt>Адрес доставки</dt><dd>{addressText || "—"}</dd></div>
                          <div><dt>Итого</dt><dd>{usd(order.total_cents)}</dd></div>
                        </dl>
                        <p className={styles.demoNote}>Демонстрационный заказ: деньги не списывались и доставка не осуществляется.</p>
                      </details>
                    </article>
                  );
                })}
              </div>

              {orders.length >= 50 && (
                <p className={styles.limitNote}>Отображаются последние 50 заказов.</p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
