# Contributing to TaskUpNow

Thank you for your interest in contributing to TaskUpNow! We welcome contributions from the community and are excited to see what you'll bring to the project.

## 🤝 How to Contribute

### Reporting Issues

- **Search existing issues** before creating a new one
- **Use the issue template** when reporting bugs
- **Provide clear reproduction steps** and environment details
- **Include screenshots** for UI-related issues

### Suggesting Features

- **Check the roadmap** to see if the feature is already planned
- **Open a discussion** before implementing large features
- **Provide clear use cases** and benefits
- **Consider backward compatibility**

### Pull Requests

1. **Fork the repository** and create a new branch
2. **Follow the coding standards** outlined below
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Ensure all tests pass** before submitting
6. **Write clear commit messages**

## 🏗️ Development Setup

### Prerequisites

- Node.js v18+
- AWS CLI configured
- AWS CDK v2
- Git

### Local Development

```bash
# Clone your fork
git clone https://github.com/l3xcaliburr/taskup-now.git
cd task-up-now

# Install dependencies
npm install
cd frontend/task-up-now-frontend && npm install && cd ../..

# Deploy backend (for API development)
npx cdk deploy TaskUpNowStack

# Start frontend development server
cd frontend/task-up-now-frontend
npm start
```

### Development Workflow

1. **Create a branch** from `main`: `git checkout -b feature/your-feature`
2. **Make your changes** with clear, focused commits
3. **Test thoroughly** on your local environment
4. **Deploy to a test AWS account** if making infrastructure changes
5. **Create a pull request** with a clear description

## 📝 Coding Standards

### TypeScript

- **Use strict TypeScript** with all type checking enabled
- **Define interfaces** for all data structures
- **Avoid `any` types** - use proper typing or `unknown`
- **Use meaningful variable names** and function names
- **Document complex logic** with comments

### React Components

- **Use functional components** with hooks
- **Extract custom hooks** for reusable logic
- **Keep components focused** on a single responsibility
- **Use TypeScript props interfaces**
- **Follow Material-UI best practices**

Example component structure:

```typescript
interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete }) => {
  // Component logic here
  return (
    // JSX here
  );
};

export default TaskCard;
```

### Backend Code

- **Use clear function names** that describe their purpose
- **Handle errors gracefully** with proper HTTP status codes
- **Validate input parameters** before processing
- **Use consistent response formats**
- **Add appropriate logging** for debugging

### CDK Infrastructure

- **Use descriptive resource names** with project prefix
- **Follow AWS best practices** for security and cost
- **Add proper IAM permissions** with least privilege
- **Use CDK constructs** where appropriate
- **Document infrastructure decisions**

## 🧪 Testing

### Running Tests

```bash
# Backend tests
npm test

# Frontend tests
cd frontend/task-up-now-frontend
npm test
```

### Writing Tests

- **Write unit tests** for all new functions
- **Test error conditions** and edge cases
- **Use descriptive test names** that explain the scenario
- **Mock external dependencies** appropriately

### Test Structure

```typescript
describe("TaskService", () => {
  describe("createTask", () => {
    it("should create a task with valid data", async () => {
      // Test implementation
    });

    it("should throw error with invalid data", async () => {
      // Test implementation
    });
  });
});
```

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] **Code follows** the project's style guidelines
- [ ] **Self-review** of the code has been performed
- [ ] **Comments added** to hard-to-understand areas
- [ ] **Tests written** for new functionality
- [ ] **Documentation updated** as needed
- [ ] **No merge conflicts** with the target branch

### PR Description Template

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

Add screenshots here

## Additional Notes

Any additional information about the changes
```

## 🚀 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] Update version numbers in package.json files
- [ ] Update CHANGELOG.md
- [ ] Create release notes
- [ ] Tag the release
- [ ] Deploy to production environment

## 🎯 Areas for Contribution

### High Priority

- **Authentication system** (JWT, OAuth integration)
- **Real-time updates** (WebSocket or Server-Sent Events)
- **Task categories** and filtering
- **Mobile app** (React Native)
- **Performance optimizations**

### Good First Issues

- **UI improvements** and animations
- **Additional task fields** (priority, tags)
- **Export functionality** (PDF, CSV)
- **Dark mode** implementation
- **Accessibility improvements**

### Documentation

- **API documentation** improvements
- **Deployment guides** for different platforms
- **Architecture decision records**
- **Performance benchmarks**
- **Security best practices**

## 🔒 Security

### Reporting Security Issues

**Do NOT open public issues for security vulnerabilities.**

Instead, email us at: security@taskupnow.dev

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Guidelines

- **Never commit secrets** or credentials
- **Use environment variables** for configuration
- **Follow OWASP guidelines** for web security
- **Validate all inputs** on both client and server
- **Use HTTPS everywhere**

## 💬 Community

### Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Discord** (coming soon): For real-time chat

### Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## 📜 License

By contributing to TaskUpNow, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to TaskUpNow! 🚀
