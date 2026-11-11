"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const FALLBACK_BOOKS = [
  { id: 1, title: "Clean Code", author: "Robert C. Martin", price: 25 },
  { id: 2, title: "Atomic Habits", author: "James Clear", price: 20 },
  { id: 3, title: "Deep Work", author: "Cal Newport", price: 18 },
  { id: 4, title: "The Pragmatic Programmer", author: "Andrew Hunt", price: 30 },
];

const BOOK_META = {
  1: {
    category: "Программирование",
    description: "Практический взгляд на то, как писать понятный, аккуратный и поддерживаемый код.",
    coverNote: "A handbook of agile software craftsmanship",
    coverStyle: "clean",
  },
  2: {
    category: "Саморазвитие",
    description: "Небольшие ежедневные привычки, которые помогают постепенно менять жизнь к лучшему.",
    coverNote: "Tiny changes, remarkable results",
    coverStyle: "habits",
  },
  3: {
    category: "Продуктивность",
    description: "Как сосредоточиться на важной работе и вернуть себе способность глубоко мыслить.",
    coverNote: "Rules for focused success",
    coverStyle: "deep",
  },
  4: {
    category: "Программирование",
    description: "Проверенные подходы, инструменты и идеи для профессиональной разработки программ.",
    coverNote: "Your journey to mastery",
    coverStyle: "pragmatic",
  },
};

const CATEGORIES = ["Все книги", "Программирование", "Саморазвитие", "Продуктивность"];

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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
          setBooks(data);
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
      books.map((book) => ({
        ...book,
        ...(BOOK_META[book.id] || {
          category: "Другое",
          description: "Откройте для себя новую книгу и найдите следующую идею для вдохновения.",
          coverNote: "A book to keep close",
          coverStyle: "default",
        }),
      })),
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
    trackEvent("select_item", {
      item_list_name: "book_catalog",
      currency: "USD",
      items: [
        {
          item_id: String(book.id),
          item_name: book.title,
          price: Number(book.price),
        },
      ],
    });
  }

  function addToCart(book) {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === book.id);
      if (existing) {
        return current.map((item) =>
          item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...book, quantity: 1 }];
    });

    trackEvent("add_to_cart", {
      currency: "USD",
      value: Number(book.price),
      items: [
        {
          item_id: String(book.id),
          item_name: book.title,
          price: Number(book.price),
          quantity: 1,
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
            <div className="modal-cover-wrap"><BookCover book={selectedBook} /></div>
            <div className="modal-book-info">
              <p className="eyebrow">{selectedBook.category}</p>
              <h2 id="book-modal-title">{selectedBook.title}</h2>
              <p className="modal-author">{selectedBook.author}</p>
              <p className="modal-description">{selectedBook.description}</p>
              <div className="modal-price">{formatPrice(selectedBook.price)}</div>
              <button
                className="button-primary modal-add"
                type="button"
                onClick={() => {
                  addToCart(selectedBook);
                  setSelectedBook(null);
                  setCartOpen(true);
                }}
              >
                Добавить в корзину <span>＋</span>
              </button>
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
