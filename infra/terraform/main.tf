# Terraform provider configuration
provider "aws" {
  region = var.aws_region
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_execution_role" {
  name = "lambda_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM policy for Lambda to access other AWS resources
resource "aws_iam_policy" "lambda_policy" {
  name        = "lambda_policy"
  description = "Lambda policy to allow necessary resource access"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = [
        "dynamodb:*",
        "s3:*",
        "logs:*",
        "lambda:*",
        "ecs:*"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# Attach the policy to the IAM role
resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# S3 bucket for frontend hosting
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.s3_bucket_name
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "error.html"
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "coding_api" {
  name        = "coding-platform-api"
  description = "API for coding platform"
}

resource "aws_api_gateway_resource" "api_resource" {
  rest_api_id = aws_api_gateway_rest_api.coding_api.id
  parent_id   = aws_api_gateway_rest_api.coding_api.root_resource_id
  path_part   = "execute"
}

# Lambda function for code submission and execution
resource "aws_lambda_function" "code_execution_lambda" {
  function_name = "code_execution"
  role          = aws_iam_role.lambda_execution_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  
  # Lambda source code can be stored in S3 or as a zip file
  filename      = "lambda_code.zip"

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.coding_platform.id
      S3_BUCKET      = aws_s3_bucket.frontend_bucket.bucket
    }
  }

  # Attach the Lambda function to API Gateway
  resource "aws_api_gateway_integration" "lambda_integration" {
    rest_api_id             = aws_api_gateway_rest_api.coding_api.id
    resource_id             = aws_api_gateway_resource.api_resource.id
    http_method             = aws_api_gateway_method.method.http_method
    integration_http_method = "POST"
    type                    = "AWS_PROXY"
    uri                     = aws_lambda_function.code_execution_lambda.invoke_arn
  }
}

# API Method - POST for code submission
resource "aws_api_gateway_method" "method" {
  rest_api_id   = aws_api_gateway_rest_api.coding_api.id
  resource_id   = aws_api_gateway_resource.api_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# Deploy the API Gateway
resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.coding_api.id
  depends_on  = [aws_api_gateway_integration.lambda_integration]
  stage_name  = "prod"
}

# DynamoDB Table for storing user submissions
resource "aws_dynamodb_table" "coding_platform" {
  name           = "coding-platform-submissions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "submission_id"

  attribute {
    name = "submission_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = {
    Name        = "coding-platform-dynamodb"
    Environment = "Production"
  }
}

# ECS Cluster for running code execution tasks
resource "aws_ecs_cluster" "coding_execution_cluster" {
  name = "coding_execution_cluster"
}

# ECS Task Definition for running isolated code execution
resource "aws_ecs_task_definition" "code_execution_task" {
  family                   = "code_execution"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512

  container_definitions = jsonencode([{
    name  = "code_executor"
    image = "your-container-repo-url"
    cpu   = 256
    memory = 512
    essential = true
  }])
}

# ECS Service to manage code execution tasks
resource "aws_ecs_service" "code_execution_service" {
  name            = "code_execution_service"
  cluster         = aws_ecs_cluster.coding_execution_cluster.id
  task_definition = aws_ecs_task_definition.code_execution_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = ["your-subnet-id"]
    assign_public_ip = true
  }
}

# CloudWatch log group for Lambda logging
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/code_execution"
  retention_in_days = 14
}


# Create a Cognito User Pool
resource "aws_cognito_user_pool" "user_pool" {
  name = "coding-platform-user-pool"

  password_policy {
    minimum_length    = 8
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
    require_lowercase = true
  }

  auto_verified_attributes = ["email"]
}

# Create a Cognito User Pool Client
resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "coding-platform-client"
  user_pool_id = aws_cognito_user_pool.user_pool.id
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

# Create a Cognito Identity Pool
resource "aws_cognito_identity_pool" "identity_pool" {
  identity_pool_name               = "coding-platform-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id   = aws_cognito_user_pool_client.user_pool_client.id
    provider_name = aws_cognito_user_pool.user_pool.endpoint
  }
}

# IAM roles for authenticated users
resource "aws_iam_role" "authenticated_role" {
  name = "authenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud": aws_cognito_identity_pool.identity_pool.id
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "authenticated_role_policy" {
  role = aws_iam_role.authenticated_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*"
        ],
        Resource = "*"
      }
    ]
  })
}

# Create S3 bucket for storing video content
resource "aws_s3_bucket" "video_bucket" {
  bucket = "coding-platform-videos"
  acl    = "private"
}

# Create CloudFront Distribution for the S3 bucket
resource "aws_cloudfront_distribution" "cdn_distribution" {
  origin {
    domain_name = aws_s3_bucket.video_bucket.bucket_regional_domain_name
    origin_id   = "S3-video-origin"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-video-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Create IAM policy to allow access to S3 from the CloudFront
resource "aws_iam_policy" "s3_access_policy" {
  name        = "s3-video-access-policy"
  description = "Allow CloudFront to access S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:GetObject"],
        Resource = "${aws_s3_bucket.video_bucket.arn}/*"
      }
    ]
  })
}

# IAM policy for accessing API Gateway
resource "aws_iam_role_policy" "api_gateway_access_policy" {
  role = aws_iam_role.authenticated_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "execute-api:Invoke"
        ],
        Resource = "*"
      }
    ]
  })
}