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

variable "secrets_prefix" {
  type = string
}

variable "min_instances" {
  type = number
}

variable "max_instances" {
  type = number
}

variable "database_url_secret" {
  description = "Secret Manager secret ID for DATABASE_URL"
  type        = string
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
