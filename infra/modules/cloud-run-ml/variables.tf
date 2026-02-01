variable "project_id" {
  type = string
}

variable "region" {
  description = "Region for ML service (must support GPUs: us-central1, europe-west4, asia-southeast1)"
  type        = string
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

variable "environment" {
  type = string
}

variable "min_instances" {
  type    = number
  default = 0
}

variable "max_instances" {
  type    = number
  default = 3
}

variable "secret_ids" {
  description = "Map of secret key to Secret Manager secret ID"
  type        = map(string)
}

variable "api_host" {
  description = "API URL for webhook callbacks"
  type        = string
}

variable "gpu_type" {
  description = "GPU type (nvidia-l4)"
  type        = string
  default     = "nvidia-l4"
}

variable "gpu_count" {
  description = "Number of GPUs per instance"
  type        = number
  default     = 1
}

variable "memory" {
  description = "Memory allocation (e.g., 16Gi, 32Gi)"
  type        = string
  default     = "16Gi"
}

variable "cpu" {
  description = "CPU allocation"
  type        = string
  default     = "4"
}

variable "timeout" {
  description = "Request timeout in seconds (max 3600 for Cloud Run)"
  type        = number
  default     = 3600
}
