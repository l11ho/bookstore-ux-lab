"use client";

import { useState } from "react";
import styles from "./CheckoutModal.module.css";

const COUNTRIES = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"],
  ["AU", "Australia"], ["NZ", "New Zealand"], ["DE", "Germany"],
  ["FR", "France"], ["ES", "Spain"], ["IT", "Italy"], ["NL", "Netherlands"],
  ["IE", "Ireland"], ["CH", "Switzerland"], ["SE", "Sweden"], ["NO", "Norway"],
  ["DK", "Denmark"], ["PL", "Poland"], ["SG", "Singapore"], ["JP", "Japan"],
  ["KR", "South Korea"], ["VN", "Vietnam"], ["AE", "United Arab Emirates"],
];

function formatUsd(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number(cents) || 0) / 100);
}

export default function CheckoutModal({ cartItems, accountEmail, onClose, onOrderPlaced, onViewOrders }) {
  const [form, setForm] = useState({
    fullName: "",
    email: accountEmail || "",
    phone: "",
    country: "US",
    address: "",
    city: "",
    region: "",
    postalCode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("demo_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const items = Array.isArray(cartItems) ? cartItems : [];
  const subtotalCents = items.reduce(
    (sum, item) => sum + Math.round(Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const shippingCents = subtotalCents >= 7500 ? 0 : 795;
  const totalCents = subtotalCents + shippingCents;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          shippingAddress: form,
          paymentMethod,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "We could not place your demo order. Please try again.");
      }
      const savedOrder = data.order || data;
      setOrder(savedOrder);
      if (typeof onOrderPlaced === "function") onOrderPlaced(savedOrder);
    } catch (submitError) {
      setError(submitError.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.backdrop} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>BOOKSTORE · SECURE CHECKOUT</p>
            <h2 id="checkout-title">{order ? "Order confirmed" : "Complete your order"}</h2>
            <p className={styles.intro}>
              {order
                ? "Your demo order has been saved to your BookStore account."
                : "International delivery · All prices are shown in US dollars."}
            </p>
          </div>
          <button className={styles.close} type="button" onClick={onClose} aria-label="Close checkout">×</button>
        </header>

        {order ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.eyebrow}>DEMO PAYMENT APPROVED</p>
            <h3>Thank you for your order.</h3>
            <p className={styles.successText}>No real payment was taken. This is a demonstration transaction.</p>
            <div className={styles.orderNumber}>
              <span>Order number</span>
              <strong>{order.order_number || "BOOKSTORE-DEMO"}</strong>
            </div>
            <div className={styles.successTotal}>
              <span>Order total</span>
              <strong>{formatUsd(order.total_cents ?? totalCents)}</strong>
            </div>
            <div className={styles.actions}>
              <button className={styles.secondary} type="button" onClick={onClose}>Continue shopping</button>
              <button className={styles.primary} type="button" onClick={onViewOrders}>View my orders</button>
            </div>
          </div>
        ) : (
          <form className={styles.body} onSubmit={submitOrder}>
            <div className={styles.formColumn}>
              <section className={styles.section}>
                <h3>Shipping information</h3>
                <div className={styles.fields}>
                  <label className={styles.field}>
                    <span>Full name</span>
                    <input name="fullName" value={form.fullName} onChange={updateField} autoComplete="name" required maxLength={120} placeholder="Jane Smith" />
                  </label>
                  <label className={styles.field}>
                    <span>Email address</span>
                    <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required maxLength={254} placeholder="jane@example.com" />
                  </label>
                  <label className={styles.field}>
                    <span>Phone number</span>
                    <input name="phone" type="tel" value={form.phone} onChange={updateField} autoComplete="tel" required maxLength={32} placeholder="+1 555 010 1234" />
                  </label>
                  <label className={styles.field}>
                    <span>Country / Region</span>
                    <select name="country" value={form.country} onChange={updateField} required>
                      {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </select>
                  </label>
                  <label className={styles.field + " " + styles.full}>
                    <span>Street address</span>
                    <input name="address" value={form.address} onChange={updateField} autoComplete="street-address" required maxLength={180} placeholder="Street, building, apartment" />
                  </label>
                  <label className={styles.field}>
                    <span>City</span>
                    <input name="city" value={form.city} onChange={updateField} autoComplete="address-level2" required maxLength={100} placeholder="New York" />
                  </label>
                  <label className={styles.field}>
                    <span>State / Province</span>
                    <input name="region" value={form.region} onChange={updateField} autoComplete="address-level1" maxLength={100} placeholder="State or province" />
                  </label>
                  <label className={styles.field}>
                    <span>ZIP / Postal code</span>
                    <input name="postalCode" value={form.postalCode} onChange={updateField} autoComplete="postal-code" required maxLength={20} placeholder="10001" />
                  </label>
                </div>
              </section>

              <section className={styles.section}>
                <h3>Payment method</h3>
                <div className={styles.methods}>
                  <label className={paymentMethod === "demo_card" ? styles.methodActive : styles.method}>
                    <input type="radio" name="paymentMethod" value="demo_card" checked={paymentMethod === "demo_card"} onChange={() => setPaymentMethod("demo_card")} />
                    <span className={styles.methodIcon}>▰</span>
                    <span><strong>Credit / Debit Card</strong><small>Demo card payment</small></span>
                  </label>
                  <label className={paymentMethod === "demo_paypal" ? styles.methodActive : styles.method}>
                    <input type="radio" name="paymentMethod" value="demo_paypal" checked={paymentMethod === "demo_paypal"} onChange={() => setPaymentMethod("demo_paypal")} />
                    <span className={styles.paypalIcon}>P</span>
                    <span><strong>PayPal</strong><small>Demo PayPal checkout</small></span>
                  </label>
                </div>
                <p className={styles.demoNotice}>Demo mode only: no card number, password or real payment details are requested. No money will be charged.</p>
              </section>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.actions}>
                <button className={styles.secondary} type="button" onClick={onClose}>Back to cart</button>
                <button className={styles.primary} type="submit" disabled={loading || !items.length}>
                  {loading ? "Processing demo order…" : "Place demo order"}
                </button>
              </div>
            </div>

            <aside className={styles.summary}>
              <p className={styles.eyebrow}>YOUR ORDER</p>
              <h3>Order summary</h3>
              <div className={styles.items}>
                {items.map((item) => (
                  <div className={styles.item} key={item.id}>
                    <div className={styles.itemCover}>{String(item.title || "B").slice(0, 1)}</div>
                    <div className={styles.itemInfo}>
                      <strong>{item.title}</strong>
                      <span>Qty {item.quantity}</span>
                    </div>
                    <b>{formatUsd((Number(item.price) || 0) * (Number(item.quantity) || 0))}</b>
                  </div>
                ))}
              </div>
              <div className={styles.totalLines}>
                <div><span>Subtotal</span><strong>{formatUsd(subtotalCents)}</strong></div>
                <div><span>International shipping</span><strong>{shippingCents ? formatUsd(shippingCents) : "Free"}</strong></div>
                <div className={styles.grandTotal}><span>Total · USD</span><strong>{formatUsd(totalCents)}</strong></div>
              </div>
              <p className={styles.shippingNote}>{shippingCents ? "Free international shipping on orders over $75." : "Your order qualifies for free international shipping."} Taxes are not calculated in this demo.</p>
            </aside>
          </form>
        )}
      </section>
    </div>
  );
}
