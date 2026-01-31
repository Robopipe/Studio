output "database_url_secret_id" {
  value = google_secret_manager_secret.secrets["databaseUrl"].secret_id
}
