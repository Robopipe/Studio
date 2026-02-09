resource "google_cloud_run_v2_job" "ml" {
  project  = var.project_id
  name     = "${var.name_prefix}-ml"
  location = var.region

  template {
    task_count = 1

    template {
      max_retries     = 0
      service_account = var.service_account
      timeout         = "${var.timeout}s"

      containers {
        image = var.image

        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }

        env {
          name  = "APP_ENV"
          value = var.environment == "prod" ? "production" : "development"
        }

        env {
          name  = "WEBHOOK_URL"
          value = "${var.api_host}/v1/models"
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
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].template[0].containers[0].image,
      template[0].template[0].containers[0].resources,
      template[0].annotations,
    ]
  }
}
