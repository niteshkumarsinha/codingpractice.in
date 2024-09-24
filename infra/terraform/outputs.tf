# Output the S3 website URL
output "s3_website_url" {
  value = aws_s3_bucket.frontend_bucket.website_endpoint
}

# Output the API Gateway invoke URL
output "api_invoke_url" {
  value = aws_api_gateway_deployment.deployment.invoke_url
}

# Output the DynamoDB table name
output "dynamodb_table_name" {
  value = aws_dynamodb_table.coding_platform.name
}

output "user_pool_id" {
  value = aws_cognito_user_pool.user_pool.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.user_pool_client.id
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.identity_pool.id
}

output "video_bucket_name" {
  value = aws_s3_bucket.video_bucket.id
}

output "cloudfront_distribution_domain" {
  value = aws_cloudfront_distribution.cdn_distribution.domain_name
}