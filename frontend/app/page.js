
"use client";

import { useEffect, useState } from "react";


const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";


function trackEvent(name, params = {}) {
  if (
    typeof window !== "undefined" &&
    typeof window.gtag === "function" &&
    localStorage.getItem("bookstore_tracking_consent_v2") === "accepted"
  ) {
    window.gtag("event", name, params);
  }
}

export default function Home() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/books`)
      .then((response) => {
        if (!response.ok) throw new Error("API error");
        return response.json();
      })
      .then((data) => setBooks(data))
      .catch(() => setError("Не удалось загрузить книги"));
  }, []);

  const filteredBooks = books.filter((book) =>
    `${book.title} ${book.author}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function handleSearch() {
    if (!search.trim()) return;

    trackEvent("search", {
      search_term: search.trim(),
    });
  }

  function handleBookClick(book) {
    setSelectedBook(book);

    trackEvent("select_item", {
      item_list_name: "book_catalog",
      currency: "USD",
      items: [
        {
          item_id: String(book.id),
          item_name: book.title,
          price: book.price,
        },
      ],
    });
  }

  return (
    <main className="container">
      <header className="header">
        <h1>BookStore</h1>
        <p>Ваш онлайн-магазин книг</p>
      </header>

      <section className="hero">
        <h2>Найдите свою следующую книгу</h2>
        <p>Лучшие книги для обучения и саморазвития</p>
      </section>

      <form
        className="search-section"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <input
          type="text"
          placeholder="Поиск по названию или автору..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Искать</button>
      </form>

      <h2>Каталог книг</h2>

      {error && <p role="alert">{error}</p>}

      <section className="book-grid">
        {filteredBooks.map((book) => (
          <article className="book-card" key={book.id}>
            <div className="book-icon">📚</div>
            <h3>{book.title}</h3>
            <p>Автор: {book.author}</p>
            <strong>${book.price}</strong>
            <button onClick={() => handleBookClick(book)}>
              Подробнее
            </button>
          </article>
        ))}
      </section>

      {selectedBook && (
        <section className="details">
          <h2>{selectedBook.title}</h2>
          <p>Автор: {selectedBook.author}</p>
          <p>Цена: ${selectedBook.price}</p>
          <button onClick={() => setSelectedBook(null)}>
            Закрыть
          </button>
        </section>
      )}
    </main>
  );
}
