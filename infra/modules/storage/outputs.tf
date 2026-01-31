output "bucket_name" {
  value = google_storage_bucket.web.name
}

output "bucket_url" {
  value = google_storage_bucket.web.url
}

output "assets_bucket_name" {
  value = google_storage_bucket.assets.name
}

output "assets_bucket_url" {
  value = google_storage_bucket.assets.url
}
