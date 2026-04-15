resource "google_compute_global_address" "web" {
  project = var.project_id
  name    = "${var.name_prefix}-web-ip"
}

resource "google_compute_backend_bucket" "web" {
  project     = var.project_id
  name        = "${var.name_prefix}-web-backend"
  bucket_name = var.bucket_name
  enable_cdn  = true
}

resource "google_compute_region_network_endpoint_group" "api" {
  project               = var.project_id
  name                  = "${var.name_prefix}-api-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = var.cloud_run_service_name
  }
}

resource "google_compute_backend_service" "api" {
  project               = var.project_id
  name                  = "${var.name_prefix}-api-backend"
  protocol              = "HTTPS"
  timeout_sec           = 30
  # Required for default_custom_error_response_policy on the url_map.
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.api.id
  }
}

resource "google_compute_url_map" "web" {
  project         = var.project_id
  name            = "${var.name_prefix}-web-url-map"
  default_service = google_compute_backend_bucket.web.id

  # SPA deep-link handling: GCS serves index.html as its 404 page (see the
  # web bucket's website config) but keeps the 404 status. This rewrites
  # that to 200 at the LB so /projects/5 etc. refresh cleanly.
  default_custom_error_response_policy {
    error_response_rule {
      match_response_codes   = ["404"]
      path                   = "/index.html"
      override_response_code = 200
    }
    error_service = google_compute_backend_bucket.web.id
  }

  host_rule {
    hosts        = [var.api_domain]
    path_matcher = "api"
  }

  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.api.id
  }
}

# HTTPS (only if domain is provided)
resource "google_compute_managed_ssl_certificate" "web" {
  count   = var.domain != "" ? 1 : 0
  project = var.project_id
  name    = "${var.name_prefix}-cert"

  managed {
    domains = compact([var.domain, var.api_domain])
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_target_https_proxy" "web" {
  count   = var.domain != "" ? 1 : 0
  project = var.project_id
  name    = "${var.name_prefix}-web-https-proxy"
  url_map = google_compute_url_map.web.id

  ssl_certificates = [google_compute_managed_ssl_certificate.web[0].id]
}

resource "google_compute_global_forwarding_rule" "https" {
  count                 = var.domain != "" ? 1 : 0
  project               = var.project_id
  name                  = "${var.name_prefix}-web-https"
  target                = google_compute_target_https_proxy.web[0].id
  ip_address            = google_compute_global_address.web.address
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# HTTP (always created — serves as redirect if HTTPS exists, or main if no domain)
resource "google_compute_target_http_proxy" "web" {
  project = var.project_id
  name    = "${var.name_prefix}-web-http-proxy"
  url_map = var.domain != "" ? google_compute_url_map.http_redirect[0].id : google_compute_url_map.web.id
}

resource "google_compute_url_map" "http_redirect" {
  count   = var.domain != "" ? 1 : 0
  project = var.project_id
  name    = "${var.name_prefix}-web-http-redirect"

  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_global_forwarding_rule" "http" {
  project               = var.project_id
  name                  = "${var.name_prefix}-web-http"
  target                = google_compute_target_http_proxy.web.id
  ip_address            = google_compute_global_address.web.address
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
