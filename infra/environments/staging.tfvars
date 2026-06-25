project_id                    = "io-robopipe-dev"
region                        = "europe-west4"
ml_region                     = "us-central1"
environment                   = "staging"
cloud_sql_tier                = "db-f1-micro"
cloud_run_min_instances       = 1
cloud_run_max_instances       = 5
cloud_sql_deletion_protection = false
# DLVM boot image for Batch training VMs — skips the ~2-3 min COS GPU-driver
# download (driver + Docker + NVIDIA Container Toolkit pre-baked).
ml_batch_boot_disk_image      = "projects/ml-images/global/images/family/common-cu129-ubuntu-2204-nvidia-580"
domain                        = "dev.robopipe.io"
api_domain                    = "api.dev.robopipe.io"
sendgrid_from_email           = "info@dev.robopipe.io"
cloud_sql_authorized_networks = [
  { name = "office", value = "213.151.81.18/32" }
]
