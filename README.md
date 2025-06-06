# TaskUpNow - Serverless Task Management Application

A modern, cloud-native task management application built with React, AWS Lambda, DynamoDB, and S3. Features AI-powered image analysis using Amazon Rekognition for task attachments.

![Architecture Overview](https://via.placeholder.com/800x400/1565c0/ffffff?text=TaskUpNow+Architecture)

## 🚀 Features

- **Modern React Frontend**: Built with Material-UI v7, TypeScript, and React Router
- **Serverless Backend**: AWS Lambda functions with API Gateway
- **AI Image Analysis**: Amazon Rekognition integration for automatic image labeling
- **Cloud Storage**: S3 for secure file storage with presigned URLs
- **Real-time Updates**: Optimistic UI updates for better user experience
- **Responsive Design**: Mobile-first design with modern UI/UX
- **Type Safety**: Full TypeScript implementation across frontend and infrastructure

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓
API Gateway
    ↓
Lambda Functions
    ↓
┌─────────────┬─────────────┬─────────────┐
│  DynamoDB   │     S3      │ Rekognition │
│  (Tasks)    │ (Images)    │ (AI Labels) │
└─────────────┴─────────────┴─────────────┘
```

### Tech Stack

**Frontend:**

- React 19 with TypeScript
- Material-UI v7 for components
- React Router for navigation
- Axios for API calls
- React Hooks for state management

**Backend:**

- AWS CDK for Infrastructure as Code
- AWS Lambda (Node.js runtime)
- Amazon API Gateway
- Amazon DynamoDB
- Amazon S3
- Amazon Rekognition

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** or **yarn**
- **AWS CLI** configured with appropriate permissions
- **AWS CDK** (`npm install -g aws-cdk`)
- **Git**

### AWS Permissions Required

Your AWS user/role needs the following permissions:

- CloudFormation (full access)
- Lambda (full access)
- API Gateway (full access)
- DynamoDB (full access)
- S3 (full access)
- Rekognition (read access)
- IAM (role creation and policy attachment)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/l3xcaliburr/task-up-now.git
cd task-up-now
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend/server-task-frontend
npm install
cd ../..
```

### 4. Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and preferred region
```

### 5. Bootstrap CDK (First-time setup)

```bash
npx cdk bootstrap
```

## 🚀 Deployment

### Backend Deployment

1. **Deploy the backend infrastructure:**

```bash
npx cdk deploy TaskUpNowStack
```

This will create:

- DynamoDB table for tasks
- S3 bucket for file storage
- Lambda function for API logic
- API Gateway for HTTP endpoints
- IAM roles and policies

2. **Note the API Gateway URL** from the output - you'll need this for frontend configuration.

### Frontend Deployment

#### Option 1: Deploy to AWS (Recommended)

1. **Deploy the frontend stack:**

```bash
npx cdk deploy TaskUpNowFrontendStack
```

This creates:

- S3 bucket for static website hosting
- CloudFront distribution for global CDN
- Automatic deployment of React build

2. **Access your application** using the CloudFront URL from the output.

#### Option 2: Local Development

1. **Configure the API endpoint:**

```bash
cd frontend/server-task-frontend
cp .env.example .env
```

2. **Edit `.env` file:**

```env
REACT_APP_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
```

3. **Start the development server:**

```bash
npm start
```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Environment Variables

**Frontend (.env):**

```env
# Required: Your API Gateway URL
REACT_APP_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod

# Optional: App configuration
REACT_APP_NAME="TaskUpNow"
REACT_APP_VERSION="1.0.0"
```

### CDK Configuration

The CDK configuration is in `cdk.json`. Key settings:

- **App**: `"npx ts-node --prefer-ts-exts bin/server-task.ts"`
- **Context**: Various AWS CDK feature flags
- **Watch**: File patterns for hot reloading during development

## 📱 Usage

### Creating Tasks

1. Click the **"New Task"** button
2. Fill in task details (title, description, due date)
3. Optionally attach an image for AI analysis
4. Click **"Create Task"**

### Managing Tasks

- **Toggle Status**: Use the checkbox to mark tasks complete/incomplete
- **Edit Task**: Click the edit icon to modify task details
- **Delete Task**: Click the delete icon and confirm
- **View Details**: Click on a task card to see full details

### AI Image Analysis

When you upload an image:

1. The image is stored securely in S3
2. Amazon Rekognition analyzes the image
3. AI-generated labels are automatically added to the task
4. Labels help with task categorization and searchability

## 🧪 Development

### Project Structure

```
task-up-now/
├── bin/                    # CDK app entry point
├── lib/                    # CDK stack definitions
│   ├── server-task-stack.ts    # Backend infrastructure
│   └── frontend-stack.ts       # Frontend infrastructure
├── lambda/                 # Lambda function code
│   └── index.js               # Main API handler
├── frontend/              # React application
│   └── server-task-frontend/
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── services/      # API service layer
│       │   ├── types/         # TypeScript definitions
│       │   └── utils/         # Utility functions
│       └── public/           # Static assets
├── test/                  # CDK tests
└── package.json          # Backend dependencies
```

### Local Development Commands

```bash
# Install dependencies
npm install

# Run CDK synth (compile TypeScript)
npx cdk synth

# Run tests
npm test

# Deploy with watch mode (auto-redeploy on changes)
npx cdk deploy --hotswap

# Start frontend development server
cd frontend/task-up-now-frontend && npm start
```

### Adding New Features

1. **Backend**: Modify `lambda/index.js` for new API endpoints
2. **Infrastructure**: Update CDK stacks in `lib/` directory
3. **Frontend**: Add components in `src/components/`
4. **Types**: Update TypeScript definitions in `src/types/`

## 🔒 Security Considerations

### Current Security Features

- **CORS**: Properly configured for cross-origin requests
- **Presigned URLs**: Secure, time-limited access to S3 objects
- **IAM Roles**: Least-privilege access for Lambda functions
- **Input Validation**: Basic validation on frontend and backend

### Production Security Checklist

- [ ] Implement proper authentication (JWT, OAuth, etc.)
- [ ] Add input validation and sanitization
- [ ] Enable AWS CloudTrail for audit logging
- [ ] Configure AWS WAF for API protection
- [ ] Implement rate limiting
- [ ] Enable HTTPS only
- [ ] Regular security updates for dependencies

## 🚨 Troubleshooting

### Common Issues

**"Stack does not exist" error:**

```bash
# Ensure you're in the correct AWS region
aws configure get region

# Bootstrap CDK in your region
npx cdk bootstrap
```

**"Access Denied" errors:**

- Verify AWS credentials: `aws sts get-caller-identity`
- Check IAM permissions for required services

**Frontend can't connect to API:**

- Verify `REACT_APP_API_URL` in `.env` file
- Check API Gateway CORS configuration
- Ensure API Gateway is deployed and accessible

**Image upload fails:**

- Check S3 bucket permissions
- Verify presigned URL generation
- Ensure file size is under 5MB limit

### Debug Mode

Enable debug logging by setting environment variables:

```bash
# Backend debugging
export DEBUG=true

# Frontend debugging (in .env file)
REACT_APP_DEBUG=true
```

## 📊 Performance & Scaling

### Current Limits

- **File Size**: 5MB per image upload
- **DynamoDB**: On-demand billing, auto-scaling
- **Lambda**: 15-minute timeout, 10GB memory
- **API Gateway**: 10,000 requests per second

### Optimization Recommendations

1. **Implement CloudFront caching** for static assets
2. **Use DynamoDB streams** for real-time updates
3. **Add ElastiCache** for frequent queries
4. **Implement pagination** for large task lists
5. **Use Lambda provisioned concurrency** for consistent performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Use provided configuration
- **Prettier**: Code formatting
- **Testing**: Write tests for new features
- **Documentation**: Update README for significant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AWS CDK team for excellent Infrastructure as Code tools
- Material-UI team for beautiful React components
- React team for the amazing framework
- AWS for providing robust cloud services

## 📞 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/l3xcaliburr/taskup-now/issues)
- **Discussions**: [GitHub Discussions](https://github.com/l3xcaliburr/taskup-now/discussions)
- **Email**: your.email@domain.com

---

**Made with ❤️ and ☁️ for the serverless community**
