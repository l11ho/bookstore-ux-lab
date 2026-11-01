
# BookStore UX Lab

Курсовой проект №9:
Анализ пользовательского поведения с помощью
Google Analytics 4 и Contentsquare (Hotjar).

## Технологии

- Next.js / React
- Python / FastAPI
- Google Analytics 4
- Contentsquare

## Структура

- frontend/ — веб-интерфейс
- backend/ — REST API каталога книг

## Локальный запуск

Backend:
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload

Frontend:
cd frontend
npm install
npm run dev

## UX-исследование

Анализ поисковых запросов, взаимодействий
с каталогом, тепловых карт и записей сессий.

Сбор аналитики выполняется после согласия
пользователя.
