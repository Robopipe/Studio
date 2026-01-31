variable "project_id" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "domain" {
  description = "Custom domain for web frontend (optional)"
  type        = string
  default     = ""
}

variable "api_domain" {
  description = "Custom domain for API (optional, e.g. api.dev.robopipe.io)"
  type        = string
  default     = ""
}

variable "cloud_run_service_name" {
  description = "Cloud Run service name for API backend"
  type        = string
}

variable "region" {
  type = string
}
