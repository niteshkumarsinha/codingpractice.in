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