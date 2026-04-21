terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "gcs" {}
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "current" {
  project_id = var.project_id
}

locals {
  name_prefix = "robopipe-${var.environment}"

  # Default the ML training image to the :latest tag in Artifact Registry.
  # Cloud Build's ml trigger always pushes both :${SHORT_SHA} and :latest, so
  # each Cloud Batch job submission pulls whatever was last built — no Cloud
  # Run API redeploy needed when the ML image changes. Override by setting
  # var.ml_image to pin a specific SHA.
  ml_default_image = "${var.ml_region}-docker.pkg.dev/${var.project_id}/${module.artifact_registry.repository_id}/ml:latest"
  ml_image_effective = var.ml_image != "" ? var.ml_image : local.ml_default_image
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "batch.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "compute.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudkms.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

module "artifact_registry" {
  source = "./modules/artifact-registry"

  project_id  = var.project_id
  region      = var.region
  name_prefix = local.name_prefix

  depends_on = [google_project_service.apis]
}

module "cloud_sql" {
  source = "./modules/cloud-sql"

  project_id    = var.project_id
  region        = var.region
  name_prefix   = local.name_prefix
  tier                = var.cloud_sql_tier
  database_name       = var.cloud_sql_database_name
  deletion_protection = var.cloud_sql_deletion_protection
  authorized_networks = var.cloud_sql_authorized_networks

  depends_on = [google_project_service.apis]
}

# Service account for Cloud Run API (created here to avoid circular dependency)
resource "google_service_account" "api" {
  project      = var.project_id
  account_id   = "${local.name_prefix}-api"
  display_name = "Cloud Run API service account"

  depends_on = [google_project_service.apis]
}

# Service account for Cloud Run ML
resource "google_service_account" "ml" {
  project      = var.project_id
  account_id   = "${local.name_prefix}-ml"
  display_name = "Cloud Run ML service account"

  depends_on = [google_project_service.apis]
}

module "secrets" {
  source = "./modules/secrets"

  project_id         = var.project_id
  database_url       = module.cloud_sql.connection_string
  cloud_run_sa       = google_service_account.api.email
  ml_service_account = google_service_account.ml.email
  cloud_build_sa     = "${data.google_project.current.number}-compute@developer.gserviceaccount.com"

  depends_on = [google_project_service.apis]
}

module "cloud_run" {
  source = "./modules/cloud-run"

  project_id           = var.project_id
  region               = var.region
  name_prefix          = local.name_prefix
  service_account      = google_service_account.api.email
  image                = var.cloud_run_image != "" ? var.cloud_run_image : "us-docker.pkg.dev/cloudrun/container/hello:latest"
  cloud_sql_connection = module.cloud_sql.connection_name
  environment          = var.environment
  min_instances        = var.cloud_run_min_instances
  max_instances        = var.cloud_run_max_instances
  secret_ids           = module.secrets.secret_ids
  bucket_name          = module.storage.assets_bucket_name
  web_host             = var.domain != "" ? "https://${var.domain}" : ""
  api_host             = var.api_domain != "" ? "https://${var.api_domain}" : ""
  ml_region            = var.ml_region
  gcp_project          = var.project_id
  sendgrid_from_email  = var.sendgrid_from_email

  ml_batch_image              = local.ml_image_effective
  ml_batch_service_account    = google_service_account.ml.email
  ml_batch_machine_type       = var.ml_batch_machine_type
  ml_batch_gpu_type           = var.ml_gpu_type
  ml_batch_gpu_count          = var.ml_gpu_count
  ml_batch_boot_disk_gb       = var.ml_batch_boot_disk_gb
  ml_batch_max_run_seconds    = var.ml_batch_max_run_seconds
  ml_batch_api_key_secret     = module.secrets.secret_ids["mlSecret"]
  ml_batch_hubai_api_key_secret = module.secrets.secret_ids["hubaiApiKey"]

  depends_on = [google_project_service.apis, module.secrets]
}

module "cloud_batch_ml" {
  source = "./modules/cloud-batch-ml"

  project_id            = var.project_id
  api_service_account   = google_service_account.api.email
  ml_service_account    = google_service_account.ml.email
  ml_service_account_id = google_service_account.ml.id

  depends_on = [google_project_service.apis]
}

module "storage" {
  source = "./modules/storage"

  project_id  = var.project_id
  region      = var.region
  name_prefix = local.name_prefix

  depends_on = [google_project_service.apis]
}

module "load_balancer" {
  source = "./modules/load-balancer"

  project_id             = var.project_id
  region                 = var.region
  name_prefix            = local.name_prefix
  bucket_name            = module.storage.bucket_name
  domain                 = var.domain
  api_domain             = var.api_domain
  cloud_run_service_name = module.cloud_run.service_name

  depends_on = [google_project_service.apis]
}

# Cloud Build triggers
resource "google_cloudbuild_trigger" "api" {
  project  = var.project_id
  name     = "${local.name_prefix}-api-build"
  location = "global"

  service_account = "projects/${var.project_id}/serviceAccounts/${data.google_project.current.number}-compute@developer.gserviceaccount.com"

  github {
    owner = "Robopipe"
    name  = "Studio"

    push {
      branch = var.environment == "prod" ? "^release$" : "^dev$"
    }
  }

  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"

  included_files = [
    "apps/api/**",
    "packages/**",
    "Dockerfile.api",
  ]

  filename = "cloudbuild-api.yaml"

  substitutions = {
    _REGION              = var.region
    _PROJECT_ID          = var.project_id
    _REPO_NAME           = module.artifact_registry.repository_id
    _SERVICE_NAME        = module.cloud_run.service_name
  }
}

resource "google_cloudbuild_trigger" "web" {
  project  = var.project_id
  name     = "${local.name_prefix}-web-build"
  location = "global"

  service_account = "projects/${var.project_id}/serviceAccounts/${data.google_project.current.number}-compute@developer.gserviceaccount.com"

  github {
    owner = "Robopipe"
    name  = "Studio"

    push {
      branch = var.environment == "prod" ? "^release$" : "^dev$"
    }
  }

  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"

  included_files = [
    "apps/web/**",
    "packages/**",
    "Dockerfile.web",
  ]

  filename = "cloudbuild-web.yaml"

  substitutions = {
    _BUCKET_NAME              = module.storage.bucket_name
    _URL_MAP_NAME             = module.load_balancer.url_map_name
    _VITE_CAMERA_API_BASE_URL = "https://robopipe-1.local"
    _VITE_STUDIO_API_BASE_URL = var.api_domain != "" ? "https://${var.api_domain}/v1" : "${module.cloud_run.url}/v1"
    _VITE_WEB_BASE_URL        = var.domain != "" ? "https://${var.domain}" : "http://${module.load_balancer.ip_address}"
  }
}

resource "google_cloudbuild_trigger" "ml" {
  project  = var.project_id
  name     = "${local.name_prefix}-ml-build"
  location = "global"

  service_account = "projects/${var.project_id}/serviceAccounts/${data.google_project.current.number}-compute@developer.gserviceaccount.com"

  github {
    owner = "Robopipe"
    name  = "Studio"

    push {
      branch = var.environment == "prod" ? "^release$" : "^dev$"
    }
  }

  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"

  included_files = [
    "apps/ml/**",
  ]

  filename = "cloudbuild-ml.yaml"

  substitutions = {
    _REGION     = var.ml_region
    _PROJECT_ID = var.project_id
    _REPO_NAME  = module.artifact_registry.repository_id
  }
}
