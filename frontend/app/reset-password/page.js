"use client";

import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const token = hash.get("access_token") || query.get("access_token");
    const linkError = hash.get("error_description") || query.get("error_description");
    const tokenType = hash.get("type") || query.get("type");

    if (linkError) {
      setError(linkError);
    } else if (token && (!tokenType || tokenType === "recovery")) {
      setAccessToken(token);
    } else {
      setError("Ссылка для сброса пароля недействительна или срок её действия истёк. Запросите новую ссылку.");
    }

    // The access token is kept only in component state, not in browser history.
    window.history.replaceState({}, document.title, window.location.pathname);
    setCheckingLink(false);
  }, []);

  async function submitNewPassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Новый пароль должен содержать не менее 8 символов.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_password", accessToken, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Не удалось обновить пароль.");

      setAccessToken("");
      setPassword("");
      setConfirmPassword("");
      setMessage("Пароль успешно изменён. Теперь войдите в аккаунт с новым паролем.");
    } catch (submitError) {
      setError(submitError.message || "Не удалось обновить пароль. Запросите новую ссылку.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="store-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <section className="account-modal" aria-labelledby="reset-password-title">
        <p className="eyebrow">BOOKSTORE · ЛИЧНЫЙ КАБИНЕТ</p>
        <h2 id="reset-password-title">Новый пароль</h2>
        <p className="account-intro">Придумайте новый пароль для своего аккаунта BookStore.</p>

        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}

        {checkingLink ? (
          <p className="account-intro">Проверяем ссылку...</p>
        ) : accessToken ? (
          <form className="auth-form" onSubmit={submitNewPassword}>
            <label>
              Новый пароль
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Не менее 8 символов"
              />
            </label>
            <label>
              Повторите новый пароль
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Введите пароль ещё раз"
              />
            </label>
            <button className="button-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Сохраняем..." : "Сохранить новый пароль"}
            </button>
          </form>
        ) : null}

        <p className="auth-switch"><a href="/">Вернуться в магазин</a></p>
      </section>
    </main>
  );
}
