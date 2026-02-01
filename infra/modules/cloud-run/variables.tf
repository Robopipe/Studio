variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "service_account" {
  type = string
}

variable "image" {
  type = string
}

variable "cloud_sql_connection" {
  type = string
}

variable "environment" {
  type = string
}

variable "min_instances" {
  type = number
}

variable "max_instances" {
  type = number
}

variable "secret_ids" {
  description = "Map of secret key to Secret Manager secret ID"
  type        = map(string)
}

variable "web_host" {
  description = "Web frontend URL for CORS"
  type        = string
  default     = ""
}

variable "api_host" {
  description = "API URL for CORS"
  type        = string
  default     = ""
}

variable "ml_host" {
  description = "ML service URL"
  type        = string
  default     = ""
}

variable "bucket_name" {
  description = "GCS assets bucket name"
  type        = string
}
