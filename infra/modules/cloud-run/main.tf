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

# Vertex AI (Gemini) — AI hyperparameter suggestions in the API service.
resource "google_project_iam_member" "api_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
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
        name  = "ML_REGION"
        value = var.ml_region
      }

      env {
        name  = "ML_BATCH_IMAGE"
        value = var.ml_batch_image
      }

      env {
        name  = "ML_BATCH_IMAGE_YOLO"
        value = var.ml_batch_image_yolo
      }

      env {
        name  = "ML_BATCH_SERVICE_ACCOUNT"
        value = var.ml_batch_service_account
      }

      env {
        name  = "ML_BATCH_MACHINE_TYPE"
        value = var.ml_batch_machine_type
      }

      env {
        name  = "ML_BATCH_GPU_TYPE"
        value = var.ml_batch_gpu_type
      }

      env {
        name  = "ML_BATCH_GPU_COUNT"
        value = tostring(var.ml_batch_gpu_count)
      }

      env {
        name  = "ML_BATCH_BOOT_DISK_IMAGE"
        value = var.ml_batch_boot_disk_image
      }

      env {
        name  = "ML_BATCH_BOOT_DISK_GB"
        value = tostring(var.ml_batch_boot_disk_gb)
      }

      env {
        name  = "ML_BATCH_MAX_RUN_SECONDS"
        value = tostring(var.ml_batch_max_run_seconds)
      }

      env {
        name  = "ML_BATCH_TASK_CPU_MILLI"
        value = tostring(var.ml_batch_task_cpu_milli)
      }

      env {
        name  = "ML_BATCH_TASK_MEMORY_MIB"
        value = tostring(var.ml_batch_task_memory_mib)
      }

      env {
        name  = "ML_BATCH_SHM_SIZE"
        value = var.ml_batch_shm_size
      }

      env {
        name  = "ML_BATCH_API_KEY_SECRET"
        value = var.ml_batch_api_key_secret
      }

      env {
        name  = "ML_BATCH_HUBAI_API_KEY_SECRET"
        value = var.ml_batch_hubai_api_key_secret
      }

      env {
        name  = "GCP_PROJECT"
        value = var.gcp_project
      }

      # Empty values fall through to the code defaults (config-loader treats
      # "" as unset), so these only matter as overrides.
      env {
        name  = "GEMINI_MODEL"
        value = var.gemini_model
      }

      env {
        name  = "GEMINI_LOCATION"
        value = var.gemini_location
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

      env {
        name  = "ML_INFER_URL"
        value = var.ml_infer_url
      }

      env {
        name = "ML_INFER_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.ml_infer_api_key_secret
            version = "latest"
          }
        }
      }

      env {
        name  = "ML_INFER_JOB_NAME"
        value = var.ml_infer_job_name
      }

      resources {
        limits = {
          cpu    = var.api_cpu
          memory = var.api_memory
        }
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
