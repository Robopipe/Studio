output "url" {
  value = google_cloud_run_v2_service.ml.uri
}

output "service_name" {
  value = google_cloud_run_v2_service.ml.name
}
