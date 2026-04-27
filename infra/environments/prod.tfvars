project_id                    = "io-robopipe"
region                        = "europe-west4"
ml_region                     = "us-central1"
environment                   = "prod"
cloud_sql_tier                = "db-custom-2-4096"
cloud_run_min_instances       = 1
cloud_run_max_instances       = 10
cloud_sql_deletion_protection = true
domain                        = "app.robopipe.io"
api_domain                    = "api.robopipe.io"
sendgrid_from_email           = "info@app.robopipe.io"
cloud_sql_authorized_networks = [
  { name = "office", value = "213.151.81.18/32" }
]
