# Contributing to Vanisec

Thank you for your interest in contributing to Vanisec! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/clouddrove/vanisec/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing issues and discussions
2. Open a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Proposed implementation (if applicable)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Ensure all tests pass: `npm run lint && npm run build`
5. Commit with clear messages
6. Push to your fork
7. Open a pull request with a clear description

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/vanisec.git
cd vanisec

# Install dependencies
npm install

# Start development server
npm run dev
```

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Run `npm run lint` before committing
- Ensure code is properly formatted

### Commit Messages

Use clear, descriptive commit messages:
- `feat: Add password protection feature`
- `fix: Resolve Redis connection timeout`
- `docs: Update README with deployment instructions`
- `refactor: Improve error handling`

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing to Vanisec!

