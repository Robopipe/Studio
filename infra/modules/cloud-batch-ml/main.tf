# Cloud Batch ML training.
#
# Batch jobs are created ad-hoc by the API when a training run starts, so this
# module does not declare a job resource. It only reserves the permissions the
# API service account needs to submit jobs and the ML service account needs to
# run them (pull the image, read secrets, write logs, report agent status).

# API SA can create/read/cancel Batch jobs in this project.
resource "google_project_iam_member" "api_batch_editor" {
  project = var.project_id
  role    = "roles/batch.jobsEditor"
  member  = "serviceAccount:${var.api_service_account}"
}

# API SA can submit jobs that run *as* the ML SA.
resource "google_service_account_iam_member" "api_acts_as_ml" {
  service_account_id = var.ml_service_account_id
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.api_service_account}"
}

# ML SA permissions required by Cloud Batch agents running on the VM.
resource "google_project_iam_member" "ml_batch_agent" {
  project = var.project_id
  role    = "roles/batch.agentReporter"
  member  = "serviceAccount:${var.ml_service_account}"
}

resource "google_project_iam_member" "ml_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${var.ml_service_account}"
}

resource "google_project_iam_member" "ml_artifact_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${var.ml_service_account}"
}
