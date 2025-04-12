# Ai-Test

A project that integrates with various cloud platforms using Model Context Protocol (MCP).

## Project Overview

This project provides integration with the following platforms:
- Supabase
- Vercel
- GitHub

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/Ai-Test.git
cd Ai-Test
```

2. Install dependencies:
```bash
npm install
```

3. Configure MCP servers in VS Code:
   - Supabase: Requires a Supabase personal access token
   - Vercel: Requires a Vercel bearer token
   - GitHub: Requires a GitHub personal access token

## Version Control

This project is version controlled using Git. Here's the workflow for making changes:

1. Create a branch for your feature or fix:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:
```bash
git add .
git commit -m "Description of the changes"
```

3. Push changes to the remote repository:
```bash
git push origin feature/your-feature-name
```

4. Create a pull request on GitHub to merge your changes into the main branch.

## Project Structure

- `.vscode/mcp.json`: Configuration file for Model Context Protocol servers
- `package.json`: Node.js project configuration and dependencies