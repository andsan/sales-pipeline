import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`Azure Storage: ${process.env.AZURE_STORAGE_CONNECTION_STRING ? 'configured' : 'NOT configured'}`);
});
