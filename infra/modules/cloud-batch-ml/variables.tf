variable "project_id" {
  type = string
}

variable "api_service_account" {
  description = "Email of the API service account that submits Batch jobs"
  type        = string
}

variable "ml_service_account" {
  description = "Email of the ML service account that Batch jobs run as"
  type        = string
}

variable "ml_service_account_id" {
  description = "Fully-qualified resource ID of the ML service account (projects/.../serviceAccounts/...)"
  type        = string
}
