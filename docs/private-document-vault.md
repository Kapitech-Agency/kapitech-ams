# Private Document Vault Production Contract

PostgreSQL stores document metadata, ownership, access control, and integrity metadata. Private file objects are encrypted with AES-256-GCM before storage.

## Integrity controls

Every private upload records:

- SHA-256 of the plaintext content.
- SHA-256 of the encrypted storage object.
- Storage version.
- Storage provider identifier.
- Integrity verification timestamp.

Downloads verify the encrypted-object checksum before decryption and verify the plaintext checksum after decryption. A mismatch is treated as a security/integrity failure and the content is not delivered.

## Production storage

The current application filesystem remains a local encrypted storage implementation. It is **not** considered production-ready object storage for a serverless/container deployment.

Before PostgreSQL production cutover, configure a durable object-storage provider and bucket through:

- `KAPITECH_DOCUMENT_STORAGE_PROVIDER=s3-compatible`
- `KAPITECH_DOCUMENT_STORAGE_BUCKET`
- `KAPITECH_DOCUMENT_STORAGE_ENDPOINT`
- `KAPITECH_DOCUMENT_STORAGE_REGION`
- `KAPITECH_DOCUMENT_STORAGE_ACCESS_KEY_ID`
- `KAPITECH_DOCUMENT_STORAGE_SECRET_ACCESS_KEY`
- Optional `KAPITECH_DOCUMENT_STORAGE_SESSION_TOKEN`

The adapter uses S3 Signature Version 4 over HTTPS and supports AWS S3, Cloudflare R2, MinIO, and other compatible endpoints. The object payload is already AES-256-GCM encrypted by the AMS before it leaves the application.

The vault status endpoint will only report production-ready when provider configuration exists and all private documents have integrity metadata associated with the configured provider.

The next infrastructure implementation must provide durable object storage, versioning, replication/failure-domain separation, encrypted-at-rest controls, lifecycle retention, and restore verification. The application must never expose the underlying object URL directly; all downloads continue through the authenticated AMS endpoint.

## Recovery

Database backup and document-object recovery are separate DR concerns. A successful PostgreSQL restore is insufficient unless the corresponding document objects can also be restored and their checksums verified.
