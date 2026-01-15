# Contributing to Vanisec

Contributions help make Vanisec better for everyone. This guide outlines how to participate in the project.

## Community Guidelines

All contributors are expected to foster a collaborative and respectful environment. Be constructive, patient, and considerate in all interactions.

## Contribution Process

### Bug Reports

Before reporting a bug:

1. Search existing [Issues](https://github.com/clouddrove/vanisec/issues) to see if it's already documented
2. If not found, create a new issue containing:
   - Descriptive title summarizing the issue
   - Detailed description of the problem
   - Step-by-step reproduction instructions
   - Expected behavior vs actual behavior
   - System information (operating system, Node.js version, browser, etc.)
   - Relevant logs or error messages

### Feature Proposals

When suggesting new features:

1. Review existing issues and discussions to avoid duplicates
2. Create an issue that includes:
   - Feature description and motivation
   - Specific use cases and benefits
   - Potential implementation approach (if you have ideas)
   - Any breaking changes or considerations

### Code Contributions

To contribute code:

1. Fork the repository to your GitHub account
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Implement your changes following the project's code style
4. Verify everything works: `npm run lint && npm run build`
5. Write clear, descriptive commit messages
6. Push your branch to your fork
7. Open a pull request with a comprehensive description of changes

### Local Development Environment

Set up your development environment:

```bash
# Clone your fork
git clone https://github.com/your-username/vanisec.git
cd vanisec

# Install project dependencies
npm install

# Launch the development server
npm run dev
```

### Coding Standards

- Adhere to TypeScript best practices and type safety
- Choose descriptive names for variables, functions, and components
- Document complex algorithms and business logic
- Execute `npm run lint` prior to committing changes
- Maintain consistent code formatting throughout

### Commit Message Format

Follow conventional commit message format:

- `feat: Add password protection feature`
- `fix: Resolve Redis connection timeout`
- `docs: Update README with deployment instructions`
- `refactor: Improve error handling`
- `chore: Update dependencies`

## Getting Help

If you have questions or need clarification, open an issue with the `question` label or contact the maintainers directly.

Your contributions make Vanisec possible. We appreciate your time and effort!
