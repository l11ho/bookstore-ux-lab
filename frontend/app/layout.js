import "./globals.css";
import AnalyticsConsent from "./components/AnalyticsConsent";

export const metadata = {
  title: "BookStore — The Reading Room",
  description: "Откройте книги для новых идей, знаний и вдохновения. BookStore UX Lab.",
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
