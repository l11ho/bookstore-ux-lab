import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authRequest,
  clearSessionCookies,
  getSession,
  getSupabaseConfig,
  isSameOriginRequest,
  publicUser,
  setSessionCookies,
  isBookstoreAdmin,
} from "../../lib/supabaseServer";


function reply(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  try {
    const session = await getSession();
    const isAdmin = session.user ? await isBookstoreAdmin(session.config, session.token) : false;
    return reply({ configured: session.configured, user: publicUser(session.user), isAdmin });
  } catch {
    return reply({ configured: !!getSupabaseConfig(), user: null, error: "Не удалось проверить сессию." }, 503);
  }
}

export async function POST(request) {
  if (!isSameOriginRequest(request)) return reply({ error: "Недопустимый источник запроса." }, 403);

  const config = getSupabaseConfig();
  if (!config) return reply({ error: "Авторизация пока не подключена. Настройте Supabase в Vercel." }, 503);

  const input = await request.json().catch(() => null);
  const action = input?.action;

  if (action === "signout") {
    try {
      const session = await getSession();
      if (session.token) await authRequest(config, "logout", { method: "POST", token: session.token });
    } catch {
      // Always clear local cookies even if remote token revocation fails.
    }
    clearSessionCookies(await cookies());
    return reply({ success: true, user: null });
  }

  if (action === "recover") {
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply({ error: "Введите корректный email." }, 400);
    }

    try {
      const redirectTo = new URL("/reset-password", request.url).toString();
      const result = await authRequest(config, `recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (!result.response.ok) {
        const message = result.data.msg || result.data.message || result.data.error_description ||
          "Не удалось отправить письмо. Попробуйте позже.";
        return reply({ error: String(message) }, result.response.status === 429 ? 429 : 400);
      }
      return reply({
        success: true,
        message: "Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.",
      });
    } catch {
      return reply({ error: "Сервис восстановления пароля временно недоступен." }, 503);
    }
  }

  if (action === "update_password") {
    const accessToken = typeof input.accessToken === "string" ? input.accessToken : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!accessToken || password.length < 8 || password.length > 128) {
      return reply({ error: "Пароль должен содержать не менее 8 символов." }, 400);
    }

    try {
      const result = await authRequest(config, "user", {
        method: "PUT",
        token: accessToken,
        body: JSON.stringify({ password }),
      });
      if (!result.response.ok) {
        const message = result.data.msg || result.data.message || result.data.error_description ||
          "Ссылка недействительна или срок её действия истёк. Запросите новую.";
        return reply({ error: String(message) }, result.response.status === 500 ? 503 : 400);
      }
      return reply({ success: true });
    } catch {
      return reply({ error: "Не удалось обновить пароль. Попробуйте ещё раз." }, 503);
    }
  }

  if (!["signin", "signup"].includes(action)) return reply({ error: "Неизвестное действие." }, 400);
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6 || password.length > 128) {
    return reply({ error: "Введите корректный email и пароль минимум из 6 символов." }, 400);
  }

  try {
    const endpoint = action === "signin" ? "token?grant_type=password" : "signup";
    const result = await authRequest(config, endpoint, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!result.response.ok) {
      const message = result.data.msg || result.data.message || result.data.error_description ||
        "Не удалось выполнить запрос. Попробуйте снова.";
      return reply({ error: String(message) }, result.response.status >= 500 ? 503 : 400);
    }

    if (result.data.access_token && result.data.refresh_token) {
      setSessionCookies(await cookies(), result.data);
      const isAdmin = await isBookstoreAdmin(config, result.data.access_token);
      return reply({ success: true, user: publicUser(result.data.user), isAdmin, needsConfirmation: false });
    }

    return reply({
      success: true,
      user: null,
      needsConfirmation: true,
      message: "Проверьте почту и подтвердите регистрацию, затем войдите.",
    });
  } catch {
    return reply({ error: "Сервис авторизации временно недоступен." }, 503);
  }
}
