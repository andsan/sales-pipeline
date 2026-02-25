# Architecture Document
## SalesPipeline - CMP Data Submission Tool

## 1. Architecture Pattern

The solution follows a straightforward client-server pattern with clear responsibilities:

- `frontend/`: Vue single-page application for authentication, upload, progress, and results
- `backend/`: Express API for authentication, validation, processing, identifier generation, and storage
- Azure Blob Storage: persistent store for processed CSV output

This pattern was chosen intentionally over microservices/serverless for the prototype because it keeps the workflow explicit and easy to review end-to-end.

```text
Browser (Vue SPA)
  -> POST /api/auth/login
  -> POST /api/upload (multipart/form-data)

Express API
  -> JWT auth + role check
  -> multer file intake (memory)
  -> CSV validation + normalization
  -> identifier generation
  -> processed CSV build
  -> Azure Blob upload + metadata + optional SAS URL

Azure Blob Storage
  -> processed-files/{yyyy}/{mm}/{dd}/{market}/{identifier}.csv
```

## 2. Tech Stack and Reasoning

### Frontend

- Vue 3 + TypeScript + Vite
- Vue Router for routing and navigation
- Pinia for state

Reasoning:

- Fast UI iteration with strong typing for API contracts
- Small runtime and simple component model for this size of app
- Vite keeps local feedback loop quick
- Pinia gives you a centralised, devtools-inspectable store that scales

### Backend

- Node.js + Express + TypeScript
- Auth JWT (mock local user store)
- `multer` for multipart upload handling with in-memory buffers
- `csv-parse` for robust CSV file parsing
- `vitest` for unit tests

Reasoning:

- Express keeps route orchestration simple
- In-memory upload avoids temporary disk lifecycle complexity in this prototype
- Typed backend logic helps keep validation and error payloads consistent
- Azure AD might be configured for production but now a simple JWT mockup
- Unit tests to cover critical handling in validator.ts and upload.ts

### Storage

- `@azure/storage-blob` (official Azure SDK)

Reasoning:

- Native support for metadata, content headers, and SAS URL generation
- Clear path to production deployment on Azure

## 3. Validation Logic

Validation is server-authoritative. Frontend behavior is intentionally minimal and only displays server outcomes.

### File-level checks (`backend/src/routes/upload.ts`)

- Max size: 10 MB
- Accepted: CSV
- General rejection for other file types. Explicit rejection: `.xlsx`

### CSV and schema checks (`backend/src/services/validator.ts`)

Rules are driven by typed config in:

- `backend/src/config/uploadValidationConfig.ts`

Current config defines required columns and types:

- `product_id`: string (required)
- `product_name`: string (required)
- `market`: string (required)
- `category`: string (required)
- `purchases`: number (required)
- `conversions`: number (required)

Validation flow:

1. Parse/normalize header names (trim, lowercase, BOM-safe)
2. Compare found headers against required config headers
3. Validate each row dynamically from config:
   - required fields must be present and non-empty
   - numeric fields must parse as finite numbers
4. Return `422` with structured validation details when invalid:
   - `requiredColumns`
   - `foundColumns`
   - `missingColumns`

### Error handling model

Validation failures throw `UploadValidationError` and are returned as:

```json
{
  "error": "...",
  "validation": {
    "requiredColumns": [...],
    "foundColumns": [...],
    "missingColumns": [...]
  }
}
```

The frontend uses this payload to show a post-submit "Validation results" panel (missing vs. present required columns).

## 4. Identifier Logic

The submission id is the central identifier of the pipeline. It is designed to be **self-describing** — anyone reading it in a blob listing, a database table, or a log file should understand exactly what the file contains and where it came from without opening it.

Identifier generation is implemented in `backend/src/routes/upload.ts`.

Format:

```text
CMP-PRODUCTS-{MARKET}-{HASH6}-{UUID6}
```

Where:

- `MARKET`: first validated row's `market`, uppercased
- `HASH6`: first 6 chars of SHA-256 hash of raw uploaded bytes
- `UUID6`: first segment of `crypto.randomUUID()`

Example:

```text
CMP-PRODUCTS-DK-35e98e-b4ddd480
```

Reasoning:

- Market segment provides immediate business context
- Hash segment provides content fingerprint signal
- UUID segment guarantees uniqueness across submissions if same file is uploaded twice

## 5. Blob Storage Structure

Storage is implemented in `backend/src/services/blobStorage.ts`.

Container:

- `processed-files`

Blob path convention:

```text
processed-files/{yyyy}/{mm}/{dd}/{market}/{identifier}.csv
```

Example:

```text
processed-files/2026/02/26/DK/CMP-PRODUCTS-DK-35e98e-b4ddd480.csv
```

### Blob metadata

Metadata is set at upload time with:

- `originalFileName`
- `market`
- `submissionId`
- `submittedBy`
- `submittedAt`

Additionally, blob headers are set:

- `Content-Type: text/csv; charset=utf-8`
- `Cache-Control: no-cache`

SAS download URL generation is best-effort and read-only with ~15 minute expiry.

## 6. Working Prototype (End-to-End)

Implemented core workflow:

1. User authenticates via `/api/auth/login` (JWT returned)
2. User uploads a `.csv` file from the frontend
3. Server‑side file validation (type, structure, required columns) in backend
4. On validation failure:
   - upload flow stops
   - frontend shows server error
5. On success:
   - submission identifier generated
   - processed CSV created with appended submission metadata columns so every row is traceable
   - processed file uploads to Azure Blob Storage
   - frontend displays result details and optional SAS download URL

## 7. Scope Note

This repository serves as a functional prototype designed to validate the end-to-end submission workflow. To maintain focus on core logic and API stability, enterprise integrations—such as Azure AD authentication and automated CI/CD pipelines—are intentionally excluded from the current scope.

While core validation and routes are covered by the existing test suite, future iterations will expand test coverage and address infrastructure concerns like Blob Storage lifecycle management.
