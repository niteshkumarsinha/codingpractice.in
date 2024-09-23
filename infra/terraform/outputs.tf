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