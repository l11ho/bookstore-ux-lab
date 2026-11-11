
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="BookStore UX Lab API")

allowed_origins = ["http://localhost:3000"]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


books = [
    {"id": 1, "title": "Clean Code", "author": "Robert C. Martin", "price": 1890},
    {"id": 2, "title": "Atomic Habits", "author": "James Clear", "price": 1490},
    {"id": 3, "title": "Deep Work", "author": "Cal Newport", "price": 1590},
    {"id": 4, "title": "The Pragmatic Programmer", "author": "Andrew Hunt", "price": 2290},
]

@app.get("/api/books")
def get_books(q: str = ""):
    return [
        book for book in books
        if q.casefold() in book["title"].casefold()
        or q.casefold() in book["author"].casefold()
    ]
