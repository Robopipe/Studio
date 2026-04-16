# Environment Migration Guide

Migrate database and object storage from one environment to another (e.g. staging → production).

## 1. GCS Object Storage

Copy all assets (images, models, thumbnails) between buckets:

```bash
gsutil -m rsync -r gs://robopipe-staging-assets gs://robopipe-prod-assets
```

## 2. Database

Pipe the database directly from source to destination:

```bash
pg_dump "SOURCE_CONNECTION_STRING" --no-owner --no-acl --clean --if-exists | psql "DEST_CONNECTION_STRING"
```

Drop `--clean --if-exists` if the destination database is empty.

## 3. Update Asset URLs

If the bucket names differ, update stored file paths in the database:

```sql
UPDATE task SET
  file_path = REPLACE(file_path, 'robopipe-staging-assets', 'robopipe-prod-assets'),
  thumbnail_url = REPLACE(thumbnail_url, 'robopipe-staging-assets', 'robopipe-prod-assets');

UPDATE model_output SET
  file_path = REPLACE(file_path, 'robopipe-staging-assets', 'robopipe-prod-assets');
```

## Order

1. GCS rsync (so files exist before DB references them)
2. Database dump/restore
3. URL replacement (if bucket names differ)
