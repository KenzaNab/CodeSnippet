# CodeSnippet — Developer Snippet Manager

Save, search and share your code snippets. GitHub-dark theme with syntax highlighting.

> React · Node.js · Express · JWT · SQLite

## Features
- JWT authentication
- Save snippets with language, tags, description
- Syntax-colored code blocks (13 languages)
- One-click copy to clipboard
- Search by title or filter by language
- Mark snippets as public or private
- Edit and delete snippets

## Quick start

```bash
cd backend && copy .env.example .env && npm install && npm run dev
cd frontend && npm install && npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/snippets | My snippets (auth) |
| POST | /api/snippets | Create snippet |
| PUT | /api/snippets/:id | Update snippet |
| DELETE | /api/snippets/:id | Delete snippet |
| GET | /api/snippets/public | Public snippets |

## License
MIT — Kenza Nabaghi
