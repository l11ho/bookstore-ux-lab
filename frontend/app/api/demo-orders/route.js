import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession, isSameOriginRequest } from "../../lib/supabaseServer";

const ALLOWED_COUNTRIES = new Set([
  "US", "CA", "GB", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "IE",
  "CH", "SE", "NO", "DK", "PL", "SG", "JP", "KR", "VN", "AE",
]);

function reply(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) {
    return reply({ error: "Invalid request origin." }, 403);
  }

  const input = await request.json().catch(() => null);
  if (!input || !Array.isArray(input.items) || input.items.length < 1 || input.items.length > 20) {
    return reply({ error: "Your cart is empty or contains too many items." }, 400);
  }

  const items = input.items.map((item) => ({
    id: Number(item?.id),
    quantity: Number(item?.quantity),
  }));
  if (items.some((item) =>
    !Number.isInteger(item.id) || item.id < 1 || item.id > 2147483647 ||
    !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10
  )) {
    return reply({ error: "One or more cart items are invalid." }, 400);
  }

  const source = input.shippingAddress || {};
  const shippingAddress = {
    full_name: clean(source.fullName, 120),
    email: clean(source.email, 254).toLowerCase(),
    phone: clean(source.phone, 32),
    country: clean(source.country, 2).toUpperCase(),
    address_line1: clean(source.address, 180),
    city: clean(source.city, 100),
    region: clean(source.region, 100),
    postal_code: clean(source.postalCode, 20),
  };
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email);
  if (
    shippingAddress.full_name.length < 2 ||
    !validEmail ||
    shippingAddress.phone.length < 5 ||
    !ALLOWED_COUNTRIES.has(shippingAddress.country) ||
    shippingAddress.address_line1.length < 5 ||
    shippingAddress.city.length < 2 ||
    shippingAddress.postal_code.length < 2
  ) {
    return reply({ error: "Please complete all required shipping fields with valid details." }, 400);
  }

  if (!["demo_card", "demo_paypal"].includes(input.paymentMethod)) {
    return reply({ error: "Choose a supported demo payment method." }, 400);
  }

  try {
    const session = await getSession();
    if (!session.configured || !session.config) {
      return reply({ error: "Supabase is not configured. Check the Vercel environment variables." }, 503);
    }
    if (!session.user || !session.token) {
      return reply({ error: "Please sign in before placing an order so it can be saved to your account." }, 401);
    }

    const orderNumber = "BS-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") +
      "-" + randomUUID().slice(0, 6).toUpperCase();

    const response = await fetch(session.config.url + "/rest/v1/rpc/create_bookstore_demo_order", {
      method: "POST",
      cache: "no-store",
      headers: {
        apikey: session.config.key,
        Authorization: "Bearer " + session.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_order_number: orderNumber,
        p_payment_method: input.paymentMethod,
        p_shipping_address: shippingAddress,
        p_items: items,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      return reply({
        error: "The order table is not ready yet. Run the SQL migration in supabase/migrations, then try again.",
      }, 503);
    }

    return reply({ success: true, order: data });
  } catch {
    return reply({ error: "The demo checkout service is temporarily unavailable. Please try again." }, 503);
  }
}


// Account order history: only the authenticated user's orders are returned.
// RLS in Supabase is an additional independent ownership check.
export async function GET() {
  try {
    const session = await getSession();
    if (!session.configured || !session.config) {
      return reply({ error: "Supabase is not configured." }, 503);
    }
    if (!session.user || !session.token) {
      return reply({ error: "Войдите, чтобы увидеть ваши заказы." }, 401);
    }

    const query = new URLSearchParams({
      select: "id,order_number,created_at,currency,subtotal_cents,shipping_cents,total_cents,payment_method,payment_status,order_status,shipping_address,items",
      user_id: "eq." + session.user.id,
      order: "created_at.desc",
      limit: "50",
    });
    const upstream = await fetch(session.config.url + "/rest/v1/bookstore_orders?" + query.toString(), {
      cache: "no-store",
      method: "GET",
      headers: {
        apikey: session.config.key,
        Authorization: "Bearer " + session.token,
        Accept: "application/json",
      },
    });
    if (!upstream.ok) {
      return reply({ error: "Не удалось получить историю заказов. Проверьте таблицу bookstore_orders и RLS." }, 503);
    }
    const data = await upstream.json().catch(() => null);
    if (!Array.isArray(data)) {
      return reply({ error: "Получен неправильный формат истории заказов." }, 503);
    }

    return reply({ orders: data });
  } catch {
    return reply({ error: "Сервис заказов временно недоступен." }, 503);
  }
}
