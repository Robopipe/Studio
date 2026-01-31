project_id              = "io-robopipe-dev"
region                  = "europe-west4"
environment             = "staging"
cloud_sql_tier          = "db-f1-micro"
cloud_run_min_instances = 0
cloud_run_max_instances = 5
secrets_prefix                = "staging_be_"
cloud_sql_deletion_protection = false
domain                        = "dev.robopipe.io"
api_domain                    = "api.dev.robopipe.io"
cloud_sql_authorized_networks = [
  { name = "office", value = "213.151.81.18/32" }
]
