"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FALLBACK_BOOKS = [
  { id: 1, title: "Чистый код", author: "Robert C. Martin", price: 1890 },
  { id: 2, title: "Атомные привычки", author: "James Clear", price: 1490 },
  { id: 3, title: "Глубокая работа", author: "Cal Newport", price: 1590 },
  { id: 4, title: "Прагматичный программист", author: "Andrew Hunt", price: 2290 },
  { id: 5, title: "Думай медленно… решай быстро", author: "Daniel Kahneman", price: 1990 },
  { id: 6, title: "Психология влияния", author: "Robert B. Cialdini", price: 1690 },
  { id: 7, title: "Sapiens. Краткая история человечества", author: "Yuval Noah Harari", price: 2190 },
  { id: 8, title: "Краткая история времени", author: "Stephen Hawking", price: 1390 },
  { id: 9, title: "Дизайн привычных вещей", author: "Don Norman", price: 1790 },
  { id: 10, title: "Маленький принц", author: "Antoine de Saint-Exupéry", price: 990 },
  { id: 11, title: "Искусство цвета", author: "Johannes Itten", price: 2490 },
  { id: 12, title: "Начни с почему", author: "Simon Sinek", price: 1390 },
  { id: 13, title: "Эссенциализм", author: "Greg McKeown", price: 1290 },
  { id: 14, title: "Гарри Поттер и философский камень", author: "J. K. Rowling", price: 1990 },
  { id: 15, title: "Маленькие женщины", author: "Louisa May Alcott", price: 1190 },
  { id: 16, title: "Большая книга природы", author: "DK", price: 1890 },
  { id: 17, title: "Атлас путешествий", author: "Lonely Planet", price: 2590 },
  { id: 18, title: "1984. Коллекционное издание", author: "George Orwell", price: 2990 },
  { id: 19, title: "AI Superpowers", author: "Kai-Fu Lee", price: 2190 },
  { id: 20, title: "Иллюстрированный атлас космоса", author: "DK", price: 2790 },
  { id: 21, title: "Python для начинающих", author: "Eric Matthes", price: 1490 },
  { id: 22, title: "Города и архитектура", author: "Phaidon Editors", price: 2390 },
];

const BOOK_META = {
  1: { category: "Программирование", description: "Практическое руководство по написанию понятного, аккуратного и поддерживаемого кода.", coverNote: "A handbook of agile software craftsmanship", coverStyle: "clean", sections: ["bestsellers", "top10"], rank: 1, publisher: "БХВ-Петербург", year: 2024, pages: 464, shelf: "A-01", stock: 12 },
  2: { category: "Саморазвитие", description: "Показывает, как небольшие ежедневные действия складываются в большие и устойчивые перемены.", coverNote: "Tiny changes, remarkable results", coverStyle: "habits", sections: ["new", "bestsellers", "top10"], rank: 2, publisher: "Питер", year: 2025, pages: 320, shelf: "B-04", stock: 18 },
  3: { category: "Продуктивность", description: "Практики глубокой концентрации для работы, учебы и творческих задач без постоянных отвлечений.", coverNote: "Rules for focused success", coverStyle: "deep", sections: ["bestsellers", "top10"], rank: 3, publisher: "Альпина Паблишер", year: 2024, pages: 304, shelf: "B-07", stock: 9 },
  4: { category: "Программирование", description: "Проверенные приемы, инструменты и идеи, которые помогают расти от разработчика к мастеру своего дела.", coverNote: "Your journey to mastery", coverStyle: "pragmatic", sections: ["bestsellers", "top10"], rank: 4, publisher: "Питер", year: 2023, pages: 352, shelf: "A-03", stock: 7 },
  5: { category: "Психология", description: "Исследование двух систем мышления и того, как они влияют на решения, оценки и повседневный выбор.", coverNote: "Thinking, fast and slow", coverStyle: "psychology", sections: ["new", "top10"], rank: 5, publisher: "АСТ", year: 2025, pages: 720, shelf: "C-02", stock: 11 },
  6: { category: "Психология", description: "Классические принципы убеждения и способы распознавать влияние в общении и повседневной жизни.", coverNote: "The psychology of persuasion", coverStyle: "influence", sections: ["bestsellers", "top10"], rank: 6, publisher: "Эксмо", year: 2024, pages:  agnostic, shelf: "C-05", stock: 14 },
  7: { category: "История", description: "Большой рассказ об истории человечества: от первых людей до мира, в котором мы живем сегодня.", coverNote: "A brief history of humankind", coverStyle: "history", sections: ["new", "top10"], rank: 7, publisher: "Синдбад", year: 2025, pages: 512, shelf: "D-01", stock: 6 },
  8: { category: "Наука и технологии", description: "Доступное путешествие по вопросам пространства, времени, черных дыр и устройства Вселенной.", coverNote: "From the big bang to black holes", coverStyle: "space", sections: ["top10"], rank: 8, publisher: "Амфора", year: 2023, pages: 256, shelf: "D-04", stock: 8 },
  9: { category: "Искусство и дизайн", description: "Как устроены привычные предметы и почему хороший дизайн делает повседневную жизнь проще.", coverNote: "The psychology of everyday things", coverStyle: "design", sections: ["new", "top10"], rank: 9, publisher: "Манн, Иванов и Фербер", year: 2025, pages: 368, shelf: "E-02", stock: 10 },
  10: { category: "Художественная литература", description: "Любимая история о дружбе, воображении и вещах, которые по-настоящему важны.", coverNote: "A timeless story", coverStyle: "prince", sections: ["collectors", "top10"], rank: 10, publisher: "Рипол Классик", year: 2024, pages: 128, shelf: "F-01", stock: 5 },
  11: { category: "Искусство и дизайн", description: "Классическое введение в цвет, его контрасты, гармонии и выразительные возможности.", coverNote: "The art of color", coverStyle: "color", sections: ["new", "collectors"], publisher: "Арт-Родник", year: 2026, pages: 176, shelf: "E-05", stock: 4 },
  12: { category: "Бизнес и экономика", description: "Книга о том, как ясная цель помогает лидерам и командам вдохновлять людей и действовать осмысленно.", coverNote: "How great leaders inspire action", coverStyle: "business", sections: ["bestsellers"], publisher: "Альпина Паблишер", year: 2024, pages: 256, shelf: "G-01", stock: 13 },
  13: { category: "Саморазвитие", description: "Подход к выбору главного: меньше лишнего, больше внимания тому, что действительно имеет значение.", coverNote: "The disciplined pursuit of less", coverStyle: "essential", sections: ["bestsellers"], publisher: "Манн, Иванов и Фербер", year: 2025, pages: 288, shelf: "B-02", stock: 9 },
  14: { category: "Детские книги", description: "Начало волшебной истории о дружбе, смелости и школе, где возможно почти всё.", coverNote: "The beginning of a magical journey", coverStyle: "magic", sections: ["bestsellers", "collectors"], publisher: "Росмэн", year: 2026, age: "8+", pages: 432, shelf: "H-01", stock: 6 },
  15: { category: "Художественная литература", description: "Роман о четырех сестрах, взрослении, семейных связях и поиске собственного пути.", coverNote: "A beloved classic", coverStyle: "classic", sections: ["new"], publisher: "Азбука", year: 2026, pages: 448, shelf: "F-04", stock: 8 },
  16: { category: "Детские книги", description: "Иллюстрированное знакомство с животными, растениями и удивительным миром природы.", coverNote: "Discover the natural world", coverStyle: "nature", sections: ["new"], publisher: "Махаон", year: 2026, age: "6+", pages: 224, shelf: "H-03", stock: 10 },
  17: { category: "Путешествия", description: "Вдохновляющий атлас маршрутов, городов и мест, которые стоит однажды увидеть своими глазами.", coverNote: "The world is waiting", coverStyle: "travel", sections: ["comingSoon"], comingSoon: true, releaseDate: "20 декабря 2026", publisher: "Lonely Planet", year: 2026, pages: 320, shelf: "—", stock: 0 },
  18: { category: "Художественная литература", description: "Коллекционное оформление антиутопии о свободе, языке и власти с дополнительными материалами.", coverNote: "A collector's edition", coverStyle: "collector", sections: ["collectors", "bestsellers"], publisher: "Азбука", year: 2026, pages: 352, shelf: "V-01", stock: 3 },
  19: { category: "Наука и технологии", description: "Обзор развития искусственного интеллекта и технологической конкуренции на мировом рынке.", coverNote: "China, Silicon Valley and the new world order", coverStyle: "technology", sections: ["comingSoon"], comingSoon: true, releaseDate: "15 декабря 2026", publisher: "Манн, Иванов и Фербер", year: 2026, pages: 288, shelf: "—", stock: 0 },
  20: { category: "Образование", description: "Иллюстрированный путеводитель по планетам, звездам, галактикам и современным открытиям астрономии.", coverNote: "Explore the universe", coverStyle: "cosmos", sections: ["comingSoon", "collectors"], comingSoon: true, releaseDate: "10 января 2027", publisher: "Дорлинг Киндерсли", year: 2026, age: "10+", pages: 192, shelf: "—", stock: 0 },
  21: { category: "Образование", description: "Пошаговое введение в Python с практическими примерами, упражнениями и небольшими проектами.", coverNote: "Practical programming for beginners", coverStyle: "python", sections: ["bestsellers"], publisher: "Питер", year: 2025, pages: 544, shelf: "A-06", stock: 15 },
  22: { category: "Искусство и дизайн", description: "Визуальное исследование архитектуры и городского пространства через знаковые здания и идеи.", coverNote: "A visual journey through architecture", coverStyle: "architecture", sections: ["new", "collectors"], publisher: "Phaidon", year: 2026, pages: 256, shelf: "E-08", stock: 2 },
};

const CATEGORIES = [
  "Все книги",
  "Художественная литература",
  "Бизнес и экономика",
  "Психология",
  "Саморазвитие",
  "История",
  "Наука и технологии",
  "Детские книги",
  "Искусство и дизайн",
  "Путешествия",
  "Образование",
  "Программирование",
  "Продуктивность",
];

const HOME_SECTIONS = [
  { key: "new", id: "new-books", title: "Новинки", subtitle: "Свежие поступления и новые книжные открытия.", limit: 4 },
  { key: "bestsellers", id: "bestsellers", title: "Бестселлеры", subtitle: "Книги, которые чаще всего выбирают наши читатели.", limit: 4 },
  { key: "top10", id: "top-10", title: "ТОП-10", subtitle: "Десять книг, которые стоит добавить на свою полку.", limit: 10 },
  { key: "collectors", id: "collectible-editions", title: "Коллекционные издания", subtitle: "Особенные обложки, иллюстрации и издания для коллекции.", limit: 4 },
  { key: "comingSoon", id: "coming-soon", title: "Скоро в продаже", subtitle: "Предстоящие релизы — добавьте интересные новинки в список ожидания.", limit: 4 },
];
function trackEvent(name, params = {}) {
  if (
    typeof window !== "undefined" &&
    typeof window.gtag === "function" &&
    localStorage.getItem("bookstore_tracking_consent_v2") === "accepted"
  ) {
    window.gtag("event", name, params);
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function BookCover({ book, compact = false }) {
  const meta = BOOK_META[book.id] || {};
  return (
    <div className={"book-cover cover-" + (meta.coverStyle || "default") + (compact ? " book-cover-compact" : "")}>
      <span className="cover-brand">BOOKSTORE EDITIONS</span>
      <span className="cover-title">{book.title}</span>
      <span className="cover-note">{meta.coverNote || "A book to keep close"}</span>
      <span className="cover-author">{book.author}</span>
    </div>
  );
}

export default function Home() {
  const [books, setBooks] = useState(FALLBACK_BOOKS);
  const [loading, setLoading] = useState(true);
  const [apiNotice, setApiNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все книги");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedBook, setSelectedBook] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [detailQuantity, setDetailQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;

    fetch(API_BASE + "/api/books")
      .then((response) => {
        if (!response.ok) throw new Error("API request failed");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Invalid catalog response");
        if (!cancelled) {
          const mergedBooks = new Map(FALLBACK_BOOKS.map((book) => [book.id, book]));
          data.forEach((book) => mergedBooks.set(book.id, { ...mergedBooks.get(book.id), ...book }));
          setBooks(Array.from(mergedBooks.values()));
          setApiNotice("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBooks(FALLBACK_BOOKS);
          setApiNotice("Показан демонстрационный каталог: сервер с данными временно недоступен.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enrichedBooks = useMemo(
    () =>
      books.map((book) => {
        const meta = BOOK_META[book.id] || {
          category: "Другое",
          description: "Откройте для себя новую книгу и найдите следующую идею для вдохновения.",
          coverNote: "A book to keep close",
          coverStyle: "default",
          sections: [],
        };

        return {
          ...book,
          ...meta,
          storePrice: meta.storePrice || Number(book.price) + 150,
          publisher: meta.publisher || "BookStore Editions",
          year: meta.year || 2025,
          age: meta.age || "16+",
          dimensions: meta.dimensions || "145×215×20 мм",
          weight: meta.weight || "420 г",
          pages: meta.pages || 320,
          binding: meta.binding || "Твёрдый переплёт",
          shelf: meta.shelf || "A-01",
          stock: meta.stock ?? 8,
          delivery: meta.delivery || "Доставка по России — 2–5 дней",
          releaseDate: meta.releaseDate || "",
          sections: meta.sections || [],
        };
      }),
    [books]
  );

  const filteredBooks = useMemo(() => {
    let result = enrichedBooks.filter((book) => {
      const matchesSearch = (book.title + " " + book.author)
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesCategory =
        activeCategory === "Все книги" || book.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "title") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [enrichedBooks, search, activeCategory, sortBy]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  function chooseCategory(category) {
    setActiveCategory(category);
    trackEvent("select_content", {
      content_type: "book_category",
      item_id: category,
    });
  }

  function handleSearch(event) {
    event.preventDefault();
    if (!search.trim()) return;
    trackEvent("search", { search_term: search.trim() });
  }

  function openBook(book) {
    setSelectedBook(book);
    setDetailQuantity(1);
    trackEvent("select_item", {
      item_list_name: "book_catalog",
      currency: "RUB",
      items: [
        {
          item_id: String(book.id),
          item_name: book.title,
          price: Number(book.price),
        },
      ],
    });
  }

  function addToCart(book, quantity = 1) {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    setCartItems((current) => {
      const existing = current.find((item) => item.id === book.id);
      if (existing) {
        return current.map((item) =>
          item.id === book.id ? { ...item, quantity: item.quantity + safeQuantity } : item
        );
      }
      return [...current, { ...book, quantity: safeQuantity }];
    });

    trackEvent("add_to_cart", {
      currency: "RUB",
      value: Number(book.price) * safeQuantity,
      items: [
        {
          item_id: String(book.id),
          item_name: book.title,
          price: Number(book.price),
          quantity: safeQuantity,
        },
      ],
    });
  }

  function changeQuantity(bookId, amount) {
    setCartItems((current) =>
      current
        .map((item) =>
          item.id === bookId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function toggleFavorite(book) {
    const isSaved = favorites.includes(book.id);
    setFavorites((current) =>
      isSaved ? current.filter((id) => id !== book.id) : [...current, book.id]
    );
    trackEvent(isSaved ? "remove_from_wishlist" : "add_to_wishlist", {
      item_id: String(book.id),
      item_name: book.title,
    });
  }

  return (
    <div className="store-shell" id="top">
      <div className="announcement-bar">
        <span className="announcement-mark">✳</span>
        Книги для больших идей и маленьких ежедневных открытий
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="BookStore — на главную">
          <span className="brand-symbol">b.</span>
          <span className="brand-wordmark">
            BookStore
            <small>THE READING ROOM</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Основная навигация">
          <a className="nav-active" href="#top">Главная</a>
          <a href="#categories">Категории</a>
          <a href="#catalog">Каталог</a>
          <a href="#about">О магазине</a>
        </nav>

        <div className="header-actions">
          <button
            className="header-search-button"
            type="button"
            aria-label="Перейти к поиску"
            onClick={() => document.getElementById("book-search")?.focus()}
          >
            <span>⌕</span>
          </button>
          <button
            className="cart-button"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={"Открыть корзину, товаров: " + cartCount}
          >
            <span className="cart-icon">▱</span>
            <span className="cart-label">Корзина</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span></span> МЕСТО, ГДЕ НАЧИНАЮТСЯ ИДЕИ</p>
            <h1>Хорошая книга — <em>начало</em> больших перемен.</h1>
            <p className="hero-description">
              Собрали книги, которые помогают думать шире, работать лучше и
              каждый день узнавать что-то новое.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#catalog">
                Выбрать книгу <span>↗</span>
              </a>
              <a className="button-text" href="#categories">
                Изучить коллекцию <span>→</span>
              </a>
            </div>
            <div className="hero-caption">
              <span className="caption-line"></span>
              <span>Хорошие истории. Полезные знания. Ваш следующий шаг.</span>
            </div>
          </div>

          <div className="hero-art" aria-label="Иллюстрация книг">
            <div className="hero-orbit orbit-one"></div>
            <div className="hero-orbit orbit-two"></div>
            <div className="hero-spark spark-one">✳</div>
            <div className="hero-spark spark-two">✦</div>
            <div className="hero-book hero-book-back">
              <span>THE ART OF</span>
              <strong>FOCUS</strong>
              <small>MAKE ROOM FOR WHAT MATTERS</small>
            </div>
            <div className="hero-book hero-book-front">
              <span>THE DAILY</span>
              <strong>IDEAS</strong>
              <small>A JOURNEY OF GROWTH</small>
            </div>
            <div className="hero-stamp">
              <span>READ</span>
              <strong>MORE</strong>
              <span>WONDER</span>
            </div>
          </div>
        </section>

        <div className="benefit-strip">
          <div><span className="benefit-icon">✳</span><span>Подборка полезных книг</span></div>
          <div><span className="benefit-icon">⌕</span><span>Удобный поиск по каталогу</span></div>
          <div><span className="benefit-icon">♡</span><span>Сохраняйте понравившееся</span></div>
        </div>

        <section className="category-section" id="categories">
          <div className="section-heading">
            <div>
              <p className="eyebrow">НАЙДИТЕ СВОЁ</p>
              <h2>Что вам интересно?</h2>
            </div>
            <p className="section-side-note">
              Выберите направление — мы покажем книги из этой коллекции.
            </p>
          </div>

          <div className="category-list">
            {CATEGORIES.map((category, index) => (
              <button
                className={"category-chip" + (activeCategory === category ? " category-chip-active" : "")}
                key={category}
                type="button"
                onClick={() => chooseCategory(category)}
              >
                <span className="category-number">0{index + 1}</span>
                {category}
                <span className="category-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="featured-collections" id="collections" aria-label="Книжные подборки">
          {HOME_SECTIONS.map((section) => {
            const sectionBooks = enrichedBooks
              .filter((book) => book.sections.includes(section.key))
              .sort((a, b) => (a.rank || 99) - (b.rank || 99))
              .slice(0, section.limit);

            return (
              <section
                className={"collection-section collection-section-" + section.key}
                id={section.id}
                key={section.key}
              >
                <div className="section-heading collection-heading">
                  <div>
                    <p className="eyebrow">КОЛЛЕКЦИЯ BOOKSTORE</p>
                    <h2>{section.title}</h2>
                    <p className="catalog-subtitle">{section.subtitle}</p>
                  </div>
                  <a className="collection-view-all" href="#catalog">
                    Весь каталог <span>↗</span>
                  </a>
                </div>

                {sectionBooks.length ? (
                  <div className="collection-grid">
                    {sectionBooks.map((book, index) => (
                      <article className="collection-card" key={book.id}>
                        <div className="collection-cover">
                          {section.key === "top10" && (
                            <span className="collection-rank">{String(book.rank || index + 1).padStart(2, "0")}</span>
                          )}
                          {book.comingSoon && <span className="collection-status">Скоро</span>}
                          <button
                            className="cover-button"
                            type="button"
                            onClick={() => openBook(book)}
                            aria-label={"Подробнее о книге " + book.title}
                          >
                            <BookCover book={book} />
                          </button>
                        </div>
                        <div className="collection-card-content">
                          <p className="book-category">{book.category}</p>
                          <button className="collection-title" type="button" onClick={() => openBook(book)}>
                            {book.title}
                          </button>
                          <p className="collection-author">{book.author}</p>
                          <div className="collection-card-bottom">
                            <strong>{formatPrice(book.price)}</strong>
                            <button
                              className="collection-add"
                              type="button"
                              onClick={() => (book.comingSoon ? openBook(book) : addToCart(book))}
                              aria-label={(book.comingSoon ? "Подробнее о предстоящем издании " : "Добавить в корзину ") + book.title}
                            >
                              {book.comingSoon ? "↗" : "+"}
                            </button>
                          </div>
                          {book.comingSoon && <p className="collection-release">С {book.releaseDate}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="collection-empty">Подборка скоро появится.</p>
                )}
              </section>
            );
          })}
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-heading catalog-heading">
            <div>
              <p className="eyebrow">ВАША СЛЕДУЮЩАЯ ЛЮБИМАЯ КНИГА</p>
              <h2>Книжная полка</h2>
              <p className="catalog-subtitle">Выбирайте то, что вдохновляет именно вас.</p>
            </div>
            <span className="catalog-count">{filteredBooks.length} КНИГИ В КАТАЛОГЕ</span>
          </div>

          <div className="catalog-toolbar">
            <form className="catalog-search" onSubmit={handleSearch}>
              <span className="search-icon">⌕</span>
              <input
                id="book-search"
                type="search"
                placeholder="Название книги или имя автора..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Поиск по названию книги или автору"
              />
              {search && (
                <button
                  className="clear-search"
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Очистить поиск"
                >
                  ×
                </button>
              )}
              <button className="search-submit" type="submit">Найти</button>
            </form>

            <label className="sort-control">
              <span>Сортировка</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="featured">По подборке</option>
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
                <option value="title">По названию</option>
              </select>
            </label>
          </div>

          {apiNotice && <p className="catalog-notice" role="status">{apiNotice}</p>}

          {loading ? (
            <div className="loading-state">Загружаем книжную полку...</div>
          ) : filteredBooks.length > 0 ? (
            <div className="book-grid">
              {filteredBooks.map((book, index) => (
                <article className="book-card" key={book.id}>
                  <div className="book-card-visual">
                    <span className="book-index">BOOK 0{index + 1}</span>
                    <button
                      className={"favorite-button" + (favorites.includes(book.id) ? " favorite-active" : "")}
                      type="button"
                      onClick={() => toggleFavorite(book)}
                      aria-label={(favorites.includes(book.id) ? "Убрать из избранного " : "Добавить в избранное ") + book.title}
                    >
                      {favorites.includes(book.id) ? "♥" : "♡"}
                    </button>
                    <button
                      className="cover-button"
                      type="button"
                      onClick={() => openBook(book)}
                      aria-label={"Подробнее о книге " + book.title}
                    >
                      <BookCover book={book} />
                    </button>
                  </div>

                  <div className="book-card-content">
                    <p className="book-category">{book.category}</p>
                    <h3>{book.title}</h3>
                    <p className="book-author">{book.author}</p>
                    <p className="book-description">{book.description}</p>
                    <div className="book-card-bottom">
                      <strong>{formatPrice(book.price)}</strong>
                      <button
                        className="add-button"
                        type="button"
                        onClick={() => addToCart(book)}
                      >
                        <span>+</span> В корзину
                      </button>
                    </div>
                    <button className="details-link" type="button" onClick={() => openBook(book)}>
                      Подробнее о книге <span>→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>⌕</span>
              <h3>Книги не найдены</h3>
              <p>Попробуйте изменить запрос или выбрать другую категорию.</p>
              <button
                className="button-primary"
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("Все книги");
                }}
              >
                Показать все книги
              </button>
            </div>
          )}
        </section>

        <section className="about-section" id="about">
          <div className="about-mark">b.</div>
          <div className="about-copy">
            <p className="eyebrow">НЕ ПРОСТО КНИЖНЫЙ МАГАЗИН</p>
            <h2>Место для новых мыслей и <em>больших открытий.</em></h2>
            <p>
              Мы верим, что правильная книга может стать отправной точкой:
              для новой привычки, профессионального роста или неожиданной идеи.
              Выбирайте вдумчиво и читайте с удовольствием.
            </p>
            <a href="#catalog" className="about-link">Найти свою книгу <span>↗</span></a>
          </div>
          <div className="about-decoration" aria-hidden="true">
            <span>TURN</span>
            <strong>THE</strong>
            <span>PAGE</span>
            <i>✳</i>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-symbol">b.</span>
          <span className="brand-wordmark">BookStore<small>THE READING ROOM</small></span>
        </a>
        <p>Читайте больше. Открывайте новое.</p>
        <div className="footer-links">
          <a href="#top">Главная</a>
          <a href="#categories">Категории</a>
          <a href="#catalog">Каталог</a>
          <a href="#about">О магазине</a>
        </div>
        <span className="copyright">© 2026 BookStore UX Lab</span>
      </footer>

      {selectedBook && (
        <div className="modal-backdrop" onClick={() => setSelectedBook(null)}>
          <section
            className="book-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setSelectedBook(null)} aria-label="Закрыть">
              ×
            </button>
            <div className="modal-cover-wrap">
              <BookCover book={selectedBook} />
              <div className={"product-stock" + (selectedBook.comingSoon ? " product-stock-soon" : "")}>
                <span>●</span>
                {selectedBook.comingSoon
                  ? "Скоро в продаже · " + selectedBook.releaseDate
                  : "В наличии · " + selectedBook.stock + " шт."}
              </div>
              <p className="product-location">В магазине · Центральный зал · Стеллаж {selectedBook.shelf}</p>
            </div>
            <div className="modal-book-info">
              <p className="eyebrow">{selectedBook.category}</p>
              <h2 id="book-modal-title">{selectedBook.title}</h2>
              <p className="modal-author">{selectedBook.author}</p>
              <div className="product-price-panel">
                <div>
                  <span>Цена в магазине</span>
                  <strong>{formatPrice(selectedBook.storePrice)}</strong>
                </div>
                <div>
                  <span>Цена в интернет-магазине</span>
                  <strong>{formatPrice(selectedBook.price)}</strong>
                </div>
              </div>

              <div className="product-details-grid">
                <div><span>Издательство</span><strong>{selectedBook.publisher}</strong></div>
                <div><span>Год издания</span><strong>{selectedBook.year}</strong></div>
                <div><span>Возраст</span><strong>{selectedBook.age}</strong></div>
                <div><span>Страниц</span><strong>{selectedBook.pages}</strong></div>
                <div><span>Размеры (Д×Ш×В)</span><strong>{selectedBook.dimensions}</strong></div>
                <div><span>Вес</span><strong>{selectedBook.weight}</strong></div>
                <div><span>Переплёт</span><strong>{selectedBook.binding}</strong></div>
                <div><span>Доставка</span><strong>{selectedBook.delivery}</strong></div>
              </div>

              <div className="product-annotation">
                <strong>Аннотация к книге:</strong>
                <p>{selectedBook.description}</p>
              </div>
              <p className="product-category-line"><strong>Жанр/Категория:</strong> {selectedBook.category}</p>

              <div className="detail-purchase">
                <div className="quantity-control" aria-label="Количество экземпляров">
                  <button
                    type="button"
                    onClick={() => setDetailQuantity((quantity) => Math.max(1, quantity - 1))}
                    aria-label="Уменьшить количество"
                  >
                    −
                  </button>
                  <span>{detailQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setDetailQuantity((quantity) => quantity + 1)}
                    aria-label="Увеличить количество"
                  >
                    +
                  </button>
                </div>
                <button
                  className="button-primary modal-add"
                  type="button"
                  onClick={() => {
                    addToCart(selectedBook, detailQuantity);
                    setSelectedBook(null);
                    setCartOpen(true);
                  }}
                >
                  {selectedBook.comingSoon ? "Оформить предзаказ" : "Оформить"} <span>↗</span>
                </button>
              </div>
              <p className="product-demo-note">Демонстрационные данные о наличии, ценах и характеристиках для UX-проекта.</p>
            </div>
          </section>
        </div>
      )}

      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">ВАШ ВЫБОР</p>
                <h2 id="cart-title">Корзина <span>({cartCount})</span></h2>
              </div>
              <button className="modal-close" type="button" onClick={() => setCartOpen(false)} aria-label="Закрыть корзину">×</button>
            </div>

            {cartItems.length ? (
              <>
                <div className="cart-items">
                  {cartItems.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <BookCover book={item} compact />
                      <div className="cart-item-info">
                        <strong>{item.title}</strong>
                        <span>{formatPrice(item.price)}</span>
                        <div className="quantity-control">
                          <button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label="Уменьшить количество">−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label="Увеличить количество">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Итого</span><strong>{formatPrice(cartTotal)}</strong></div>
                  <p>Демонстрационная корзина для UX-исследования.</p>
                  <button className="button-primary drawer-continue" type="button" onClick={() => setCartOpen(false)}>
                    Продолжить покупки <span>→</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="cart-empty">
                <span>▱</span>
                <h3>Корзина пока пуста</h3>
                <p>Добавьте книгу, которая вам понравилась.</p>
                <button className="button-primary" type="button" onClick={() => setCartOpen(false)}>
                  Перейти к каталогу
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
