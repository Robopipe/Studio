locals {
  # Secret names matching the app's expected format: {prefix}{camelCaseName}
  secrets = {
    databaseUrl  = var.database_url
    jwtSecret    = null # manually set after creation
    cookieSecret = null # manually set after creation
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  project   = var.project_id
  secret_id = "${var.secrets_prefix}${each.key}"

  replication {
    auto {}
  }
}

# Auto-populate databaseUrl secret version from Cloud SQL
resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.secrets["databaseUrl"].id
  secret_data = var.database_url
}

# IAM: allow Cloud Run SA to access all secrets
resource "google_secret_manager_secret_iam_member" "access" {
  for_each  = local.secrets
  project   = var.project_id
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.cloud_run_sa}"
}
