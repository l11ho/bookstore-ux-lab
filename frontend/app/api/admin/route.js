import { NextResponse } from "next/server";
import { getSession, isBookstoreAdmin, isSameOriginRequest } from "../../lib/supabaseServer";

function reply(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function getAuthorizedAdmin() {
  const session = await getSession();
  if (!session.configured || !session.config) {
    return { response: reply({ error: "Supabase is not configured." }, 503) };
  }
  if (!session.user || !session.token) {
    return { response: reply({ error: "Войдите в аккаунт администратора." }, 401) };
  }
  const isAdmin = await isBookstoreAdmin(session.config, session.token);
  if (!isAdmin) {
    return { response: reply({ error: "У этого аккаунта нет прав администратора." }, 403) };
  }
  return { session };
}

async function callAdminRpc(session, functionName, body = {}) {
  return fetch(session.config.url + "/rest/v1/rpc/" + functionName, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: session.config.key,
      Authorization: "Bearer " + session.token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function GET() {
  try {
    const authorization = await getAuthorizedAdmin();
    if (authorization.response) return authorization.response;

    const response = await callAdminRpc(authorization.session, "admin_get_overview");
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || typeof data !== "object") {
      return reply({ error: "Не удалось загрузить панель. Проверьте SQL-миграцию Admin в Supabase." }, 503);
    }
    return reply(data);
  } catch {
    return reply({ error: "Панель администратора временно недоступна." }, 503);
  }
}

export async function PATCH(request) {
  if (!isSameOriginRequest(request)) {
    return reply({ error: "Недопустимый источник запроса." }, 403);
  }

  const input = await request.json().catch(() => null);
  const orderId = typeof input?.orderId === "string" ? input.orderId : "";
  const status = typeof input?.status === "string" ? input.status : "";
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
  if (!validId || !["processing", "shipped", "delivered", "cancelled"].includes(status)) {
    return reply({ error: "Некорректный заказ или статус." }, 400);
  }

  try {
    const authorization = await getAuthorizedAdmin();
    if (authorization.response) return authorization.response;

    const response = await callAdminRpc(authorization.session, "admin_update_order_status", {
      p_order_id: orderId,
      p_order_status: status,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return reply({ error: "Не удалось обновить статус заказа. Проверьте права администратора." }, 503);
    }
    return reply({ success: true, order: data });
  } catch {
    return reply({ error: "Не удалось обновить заказ." }, 503);
  }
}
