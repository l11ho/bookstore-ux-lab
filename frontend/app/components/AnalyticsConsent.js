
"use client";

import { useEffect, useState } from "react";

const GA_ID = "G-8GVG47MQ1E";
const CS_ID = "6ad4fa79a47b5";
const STORAGE_KEY = "bookstore_tracking_consent_v2";

export default function AnalyticsConsent() {
  const [consent, setConsent] = useState("loading");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === "accepted" || saved === "rejected") {
      setConsent(saved);
    } else {
      setConsent("unset");
    }
  }, []);

  useEffect(() => {
    if (consent !== "accepted") return;

    // Google Analytics 4
    if (!document.querySelector("script[data-bookstore-ga]")) {
      window.dataLayer = window.dataLayer || [];

      window.gtag = function () {
        window.dataLayer.push(arguments);
      };

      window.gtag("js", new Date());
      window.gtag("config", GA_ID);

      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src =
        `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      gaScript.dataset.bookstoreGa = "true";

      document.head.appendChild(gaScript);
    }

    // Contentsquare: Heatmaps + Session Replay
    if (!document.querySelector("script[data-bookstore-cs]")) {
      window._uxa = window._uxa || [];

      window._uxa.push([
        "setPath",
        window.location.pathname,
        { lifespan: "onNextPageviewOnly" },
      ]);

      const csScript = document.createElement("script");
      csScript.async = true;
      csScript.src =
        `https://t.contentsquare.net/uxa/${CS_ID}.js`;
      csScript.dataset.bookstoreCs = "true";

      document.head.appendChild(csScript);
    }
  }, [consent]);

  function saveChoice(value) {
    localStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  }

  function withdrawConsent() {
    if (window._uxa) {
      window._uxa.push(["optout"]);
    }

    localStorage.setItem(STORAGE_KEY, "rejected");
    window.location.reload();
  }

  return (
    <>
      {consent === "unset" && (
        <div className="consent-banner">
          <h3>Настройки аналитики</h3>

          <p>
            Мы используем Google Analytics 4 и
            Contentsquare для анализа посещений,
            тепловых карт и записей сессий.
            Вы можете принять или отклонить сбор данных.
          </p>

          <div className="consent-actions">
            <button onClick={() => saveChoice("accepted")}>
              Принять
            </button>

            <button onClick={() => saveChoice("rejected")}>
              Отклонить
            </button>
          </div>
        </div>
      )}

      {consent === "accepted" && (
        <button
          className="consent-settings"
          onClick={withdrawConsent}
        >
          Отозвать согласие
        </button>
      )}
    </>
  );
}
