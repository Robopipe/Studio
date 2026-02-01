variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "name_prefix" {
  type = string
}

variable "tier" {
  type = string
}

variable "database_name" {
  type = string
}

variable "deletion_protection" {
  type    = bool
  default = true
}

variable "authorized_networks" {
  description = "List of authorized networks that can access the Cloud SQL instance"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}
