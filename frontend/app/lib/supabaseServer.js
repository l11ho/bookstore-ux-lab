import { cookies } from "next/headers";

const ACCESS_COOKIE = "bookstore_auth_access";
const REFRESH_COOKIE = "bookstore_auth_refresh";

export function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(url) || !key) return null;
  return { url, key };
}

export function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function authRequest(config, path, options = {}) {
  const { token, headers = {}, ...rest } = options;
  const response = await fetch(config.url + "/auth/v1/" + path, {
    ...rest,
    cache: "no-store",
    headers: {
      apikey: config.key,
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export function setSessionCookies(store, data) {
  if (!data.access_token || !data.refresh_token) return;
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  store.set(ACCESS_COOKIE, data.access_token, {
    ...options,
    maxAge: Math.max(60, Number(data.expires_in) || 3600),
  });
  store.set(REFRESH_COOKIE, data.refresh_token, {
    ...options,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookies(store) {
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getSession() {
  const config = getSupabaseConfig();
  if (!config) return { configured: false, user: null, token: null, config: null };

  const store = await cookies();
  let token = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (token) {
    const result = await authRequest(config, "user", { method: "GET", token });
    if (result.response.ok && result.data.id) {
      return { configured: true, user: result.data, token, config };
    }
  }

  if (refreshToken) {
    const refreshed = await authRequest(config, "token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (refreshed.response.ok && refreshed.data.access_token) {
      setSessionCookies(store, refreshed.data);
      token = refreshed.data.access_token;
      const checked = await authRequest(config, "user", { method: "GET", token });
      if (checked.response.ok && checked.data.id) {
        return { configured: true, user: checked.data, token, config };
      }
    }
  }

  if (token || refreshToken) clearSessionCookies(store);
  return { configured: true, user: null, token: null, config };
}

export function publicUser(user) {
  return user ? { id: user.id, email: user.email || "" } : null;
}
