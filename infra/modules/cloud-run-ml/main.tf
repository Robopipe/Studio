resource "google_cloud_run_v2_service" "ml" {
  project  = var.project_id
  name     = "${var.name_prefix}-ml"
  location = var.region

  template {
    service_account = var.service_account

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    timeout = "${var.timeout}s"

    containers {
      image = var.image

      ports {
        container_port = 8000
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
          "nvidia.com/gpu" = var.gpu_count
        }
        cpu_idle = true
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
        name  = "PORT"
        value = "8000"
      }

      env {
        name  = "WEBHOOK_URL"
        value = "${var.api_host}/v1/models/"
      }

      env {
        name = "API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids["mlSecret"]
            version = "latest"
          }
        }
      }

      env {
        name = "HUBAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = var.secret_ids["hubaiApiKey"]
            version = "latest"
          }
        }
      }
    }

    # GPU requires specific node selector
    # node_selector {
    #   accelerator = var.gpu_type
    # }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }
}

resource "google_cloud_run_v2_service_iam_member" "ml_invoker" {
  project  = var.project_id
  name     = google_cloud_run_v2_service.ml.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
