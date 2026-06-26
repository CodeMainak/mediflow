# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name

  tags = {
    Name        = "${var.project_name}-hosted-zone"
    Environment = var.environment
  }
}

# A Record for Apex Domain (mediflow-mainak.com)
resource "aws_route53_record" "apex" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = ""
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# A Record for WWW Subdomain (www.mediflow-mainak.com)
resource "aws_route53_record" "www" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
