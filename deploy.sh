#!/bin/bash

# TaskUpNow Deployment Script
# This script automates the deployment of both backend and frontend stacks

set -e

echo "🚀 TaskUpNow Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18 or later."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install and configure AWS CLI."
        exit 1
    fi
    
    if ! command -v cdk &> /dev/null; then
        print_warning "CDK is not installed globally. Installing..."
        npm install -g aws-cdk
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure'."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Install dependencies
install_dependencies() {
    print_status "Installing backend dependencies..."
    npm install
    
    print_status "Installing frontend dependencies..."
    cd frontend/server-task-frontend
    npm install
    cd ../..
    
    print_success "Dependencies installed!"
}

# Deploy backend
deploy_backend() {
    print_status "Deploying backend infrastructure..."
    
    # Bootstrap CDK if needed
    print_status "Checking CDK bootstrap..."
    npx cdk bootstrap
    
    # Deploy backend stack
    print_status "Deploying TaskUpNowStack..."
    npx cdk deploy TaskUpNowStack --require-approval never
    
    # Get API Gateway URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name TaskUpNowStack \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$API_URL" ]; then
        print_success "Backend deployed successfully!"
        print_status "API Gateway URL: $API_URL"
        echo "$API_URL" > .api-url
    else
        print_error "Failed to get API Gateway URL"
        exit 1
    fi
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend/server-task-frontend
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f ../../.api-url ]; then
            API_URL=$(cat ../../.api-url)
            echo "REACT_APP_API_URL=$API_URL" > .env
            print_status "Created .env file with API URL: $API_URL"
        else
            print_warning "No API URL found. Creating .env from template..."
            cp .env.example .env
        fi
    fi
    
    # Build the React app
    npm run build
    
    cd ../..
    print_success "Frontend built successfully!"
}

# Deploy frontend
deploy_frontend() {
    print_status "Deploying frontend to AWS..."
    
    npx cdk deploy TaskUpNowFrontendStack --require-approval never
    
    # Get CloudFront URL
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name TaskUpNowFrontendStack \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$CLOUDFRONT_URL" ]; then
        print_success "Frontend deployed successfully!"
        print_success "Application URL: $CLOUDFRONT_URL"
    else
        print_error "Failed to get CloudFront URL"
        exit 1
    fi
}

# Main deployment function
deploy_all() {
    check_prerequisites
    install_dependencies
    deploy_backend
    build_frontend
    deploy_frontend
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "========================"
    
    if [ -f .api-url ]; then
        API_URL=$(cat .api-url)
        echo "Backend API: $API_URL"
    fi
    
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name TaskUpNowFrontendStack \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$CLOUDFRONT_URL" ]; then
        echo "Frontend URL: $CLOUDFRONT_URL"
    fi
    
    echo ""
    echo "Your TaskUpNow application is now live! 🚀"
}

# Parse command line arguments
case "${1:-all}" in
    "backend")
        check_prerequisites
        install_dependencies
        deploy_backend
        ;;
    "frontend")
        check_prerequisites
        build_frontend
        deploy_frontend
        ;;
    "build")
        check_prerequisites
        install_dependencies
        build_frontend
        ;;
    "all"|"")
        deploy_all
        ;;
    *)
        echo "Usage: $0 [backend|frontend|build|all]"
        echo ""
        echo "Commands:"
        echo "  backend   - Deploy only the backend infrastructure"
        echo "  frontend  - Deploy only the frontend"
        echo "  build     - Build frontend without deploying"
        echo "  all       - Deploy both backend and frontend (default)"
        exit 1
        ;;
esac 