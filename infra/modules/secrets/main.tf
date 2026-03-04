locals {
  secrets = {
    databaseUrl  = var.database_url
    jwtSecret    = null # manually set after creation
    cookieSecret = null # manually set after creation
    mlSecret     = null # manually set after creation
    hubaiApiKey     = null # manually set after creation (for ML service)
    sendgridApiKey  = null # manually set after creation
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  project   = var.project_id
  secret_id = each.key

  replication {
    auto {}
  }
}

# Auto-populate databaseUrl secret version from Cloud SQL
resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.secrets["databaseUrl"].id
  secret_data = var.database_url
}

# IAM: allow Cloud Run API SA to access all secrets
resource "google_secret_manager_secret_iam_member" "access" {
  for_each  = local.secrets
  project   = var.project_id
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.cloud_run_sa}"
}

# IAM: allow Cloud Run ML SA to access ML-related secrets
resource "google_secret_manager_secret_iam_member" "ml_access" {
  for_each  = var.cloud_run_ml_sa != "" ? toset(["mlSecret", "hubaiApiKey"]) : toset([])
  project   = var.project_id
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.cloud_run_ml_sa}"
}
