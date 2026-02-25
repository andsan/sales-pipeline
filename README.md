# SalesPipeline Demo

Internal tool for authenticated CSV submission, server-side validation, processing, and storage in Azure Blob Storage.

## Repository Structure

```text
/
|-- frontend/            Vue SPA
|-- backend/             Express API
|-- sample-data/         Example input files
|-- ARCHITECTURE.md      Brief architecture document
```

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001` by default.

Required environment variables (backend `.env`):

- `JWT_SECRET`
- `AZURE_STORAGE_CONNECTION_STRING`
- `FRONTEND_URL` (optional, defaults to `http://localhost:5173`)

To run the tests:
```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Auth (Dev)

Current mock credentials:

| Username | Password | Role |
|---|---|---|
| `admin` | `password123` | `admin` |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.
