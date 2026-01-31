output "connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "connection_string" {
  value     = "postgres://${google_sql_user.main.name}:${random_password.db_password.result}@/${var.database_name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
  sensitive = true
}
