resource "google_project_iam_member" "sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${var.service_account}"
}

resource "google_project_iam_member" "api_sign_blob" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${var.service_account}"
}

resource "google_cloud_run_v2_service" "api" {
  project  = var.project_id
  name     = "${var.name_prefix}-api"
  location = var.region

  template {
    service_account = var.service_account

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [var.cloud_sql_connection]
      }
    }

    containers {
      image = var.image

      ports {
        container_port = 3000
      }

      env {
        name  = "APP_ENV"
        value = var.environment == "prod" ? "production" : "development"
      }

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "WEB_HOST"
        value = var.web_host
      }

      env {
        name  = "API_HOST"
        value = var.api_host
      }

      env {
        name  = "ML_JOB_NAME"
        value = var.ml_job_name
      }

      env {
        name  = "ML_REGION"
        value = var.ml_region
      }

      env {
        name  = "GCP_PROJECT"
        value = var.gcp_project
      }

      env {
        name  = "BUCKET_NAME"
        value = var.bucket_name
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids["databaseUrl"]
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids["jwtSecret"]
            version = "latest"
          }
        }
      }

      env {
        name = "COOKIE_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids["cookieSecret"]
            version = "latest"
          }
        }
      }

      env {
        name = "ML_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids["mlSecret"]
            version = "latest"
          }
        }
      }

      env {
        name = "SENDGRID_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids["sendgridApiKey"]
            version = "latest"
          }
        }
      }

      env {
        name  = "SENDGRID_FROM_EMAIL"
        value = var.sendgrid_from_email
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }

  depends_on = [google_project_iam_member.sql_client]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  name     = google_cloud_run_v2_service.api.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
