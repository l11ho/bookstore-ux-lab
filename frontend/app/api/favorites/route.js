import { NextResponse } from "next/server";
import { getSession, isSameOriginRequest } from "../../lib/supabaseServer";


function reply(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function callFavorites(session, options = {}) {
  return fetch(session.config.url + "/rest/v1/book_favorites" + (options.query || ""), {
    method: options.method || "GET",
    cache: "no-store",
    headers: {
      apikey: session.config.key,
      Authorization: "Bearer " + session.token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

async function authorizedSession() {
  const session = await getSession();
  if (!session.configured) return { error: reply({ error: "Сервис аккаунтов не настроен." }, 503) };
  if (!session.user || !session.token) return { error: reply({ error: "Войдите в аккаунт." }, 401) };
  return { session };
}

export async function GET() {
  try {
    const { session, error } = await authorizedSession();
    if (error) return error;
    const result = await callFavorites(session, { query: "?select=book_id&order=created_at.desc" });
    if (!result.ok) return reply({ error: "Не удалось загрузить избранное. Проверьте таблицу book_favorites и RLS." }, 503);
    const rows = await result.json();
    return reply({
      favoriteIds: Array.isArray(rows) ? rows.map((row) => Number(row.book_id)).filter(Number.isInteger) : [],
    });
  } catch {
    return reply({ error: "Сервис избранного временно недоступен." }, 503);
  }
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) return reply({ error: "Недопустимый источник запроса." }, 403);
  const input = await request.json().catch(() => null);
  const bookId = Number(input?.bookId);
  const saved = input?.saved;
  if (!Number.isInteger(bookId) || bookId <= 0 || typeof saved !== "boolean") {
    return reply({ error: "Неверные данные книги." }, 400);
  }

  try {
    const { session, error } = await authorizedSession();
    if (error) return error;

    const result = saved
      ? await callFavorites(session, {
          method: "POST",
          query: "?on_conflict=user_id,book_id",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: { user_id: session.user.id, book_id: bookId },
        })
      : await callFavorites(session, {
          method: "DELETE",
          query: "?user_id=eq." + encodeURIComponent(session.user.id) + "&book_id=eq." + bookId,
        });

    if (!result.ok) return reply({ error: "Не удалось сохранить избранное. Проверьте настройки базы." }, 503);
    return reply({ success: true, bookId, saved });
  } catch {
    return reply({ error: "Сервис избранного временно недоступен." }, 503);
  }
}
