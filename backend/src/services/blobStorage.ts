import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const CONTAINER_NAME = 'processed-files';

function getContainerClient(): ContainerClient {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  }
  const client = BlobServiceClient.fromConnectionString(connStr);
  return client.getContainerClient(CONTAINER_NAME);
}

export async function uploadBlob(
  content: Buffer,
  originalFileName: string,
  market: string,
  submissionId: string,
  submittedBy: string,
  submittedAt: string,
): Promise<string> {
  const container = getContainerClient();

  // Create container if it doesn't exist (idempotent, private by default)
  await container.createIfNotExists();

  // Path: processed-files/{yyyy}/{mm}/{dd}/{market}/{full_identifier}.csv
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const safeMarket = market || 'XX';
  const blobPath = `${year}/${month}/${day}/${safeMarket}/${submissionId}.csv`;
  const blockBlob = container.getBlockBlobClient(blobPath);

  await blockBlob.uploadData(content, {
    blobHTTPHeaders: {
      blobContentType: 'text/csv; charset=utf-8',
      blobCacheControl: 'no-cache',
    },
    metadata: {
      originalFileName,
      market: safeMarket,
      submissionId,
      submittedBy,
      submittedAt,
    },
  });

  return `${CONTAINER_NAME}/${blobPath}`;
}

/**
 * Generate a short-lived SAS URL so the frontend can download the processed file.
 * Expires in 15 minutes.
 */
export async function generateSasUrl(blobPath: string): Promise<string | null> {
  try {
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connStr) return null;

    const { generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } =
      await import('@azure/storage-blob');

    // Parse account name and key from connection string
    const match = connStr.match(/AccountName=([^;]+).*AccountKey=([^;]+)/);
    if (!match) return null;

    const [, accountName, accountKey] = match;
    const credential = new StorageSharedKeyCredential(accountName, accountKey);

    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER_NAME,
        blobName: blobPath.replace(`${CONTAINER_NAME}/`, ''),
        permissions: BlobSASPermissions.parse('r'),
        expiresOn,
      },
      credential,
    ).toString();

    return `https://${accountName}.blob.core.windows.net/${blobPath}?${sas}`;
  } catch {
    return null;
  }
}
