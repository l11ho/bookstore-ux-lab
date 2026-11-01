
import "./globals.css";
import AnalyticsConsent from "./components/AnalyticsConsent";

export const metadata = {
  title: "BookStore UX Lab",
  description: "Исследование пользовательского поведения",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <AnalyticsConsent />
      </body>
    </html>
  );
}
