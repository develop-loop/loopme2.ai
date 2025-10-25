# LoopMe

A powerful markdown-based workspace and knowledge management system with Git integration.

## ✨ Features

- 📝 **Markdown-First**: Organize your documents using markdown files with frontmatter metadata
- 🗂️ **Smart Workspaces**: Automatically organize files into workspaces based on frontmatter
- 🔄 **Git Integration**: Full version control support with commit history and diff viewing
- 🎨 **Rich Editor**: Built-in Milkdown editor with live preview
- 🚀 **Fast Search**: Powerful file search using ripgrep
- 🔧 **RESTful API**: Comprehensive V1 API for all operations
- 💾 **Local Storage**: Settings stored locally for better performance

## 📦 Installation

```bash
npm install -g loopme
```

## 🚀 Quick Start

### Start the server

```bash
loopme start
# or simply
loopme
```

The server will start on port 7788 by default. Open your browser and navigate to:
- Frontend: http://localhost:7788
- API Documentation: http://localhost:7788/api-docs

### Command Line Options

```bash
loopme --help        # Show help
loopme --version     # Show version
loopme start         # Start the server (default)
```

### Environment Variables

```bash
PORT=8080 loopme     # Use custom port (default: 7788)
STORAGE_DIR=/path/to/files loopme  # Set storage directory
```

## 📚 Usage

### Creating Files

1. Navigate to the Explore page
2. Click "New Item" in any workspace
3. Files are automatically created with timestamps as filenames

### Managing Workspaces

Workspaces are automatically created based on the `workspace` field in markdown frontmatter:

```markdown
---
workspace: my-project
title: My Document
---

# Content here
```

### Transferring Files

Files can be transferred between workspaces using the transfer button:
1. Click the transfer icon next to any file
2. Select target workspace or create a new one
3. File's frontmatter is automatically updated

### Archiving Files

Archive files by removing them from workspaces:
1. Click the archive button on any file
2. The file's workspace frontmatter is removed
3. File remains in the filesystem but not shown in workspaces

## 🛠️ API

LoopMe provides a comprehensive RESTful API:

### V1 Endpoints

- `GET /api/v1/workspaces` - List all workspaces
- `GET /api/v1/files/markdown` - Get markdown files
- `PUT /api/v1/files/markdown` - Save markdown files
- `PUT /api/v1/files/markdown/frontmatter` - Update frontmatter
- `DELETE /api/v1/files/markdown/frontmatter` - Delete frontmatter fields

### Example

```javascript
// Get all workspaces
fetch('http://localhost:7788/api/v1/workspaces')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🏗️ Development

### Prerequisites

- Node.js >= 18
- npm >= 9

### Local Development

```bash
# Clone the repository
git clone https://github.com/develop-loop/loopme2.ai.git
cd loopme2.ai

# Install dependencies
npm install

# Start development servers
npm run dev
```

This starts:
- Frontend dev server on http://localhost:3000
- Backend dev server on http://localhost:7788

### Building

```bash
npm run build:dist
```

### Testing

```bash
npm test
```

## 🏗️ Architecture

### Frontend (client/)
- **Framework:** Next.js 15 with TypeScript
- **Styling:** Tailwind CSS 4
- **Features:** App Router, Turbopack, ESLint

### Backend (server/)
- **Framework:** NestJS with TypeScript
- **Features:** REST API, CORS enabled, modular architecture
- **Port:** 3001

### Shared (shared/)
- **Types:** Common interfaces and types
- **DTOs:** Data Transfer Objects with validation
- **Constants:** API endpoints, HTTP status codes, etc.

## Key Features

- 🎯 **Type Safety:** End-to-end TypeScript with shared types
- 🚀 **Fast Development:** Hot reloading for both frontend and backend
- 📦 **Monorepo:** Efficient dependency management with npm workspaces
- 🔄 **Code Sharing:** Common types and utilities across applications
- 🎨 **Modern Stack:** Latest versions of Next.js and NestJS
- 🌐 **No CORS Issues:** Frontend proxies API requests to backend

## API Endpoints

Backend serves all endpoints under `/api` prefix:

### General
- `GET /api` - Welcome message  
- `GET /api/health` - Health check

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Files
- `GET /api/files?file_paths=["file.txt"]` - Get files content (always returns list format)
- `GET /api/files?file_paths=["a.txt","b.txt"]` - Get multiple files content 
- `GET /api/files?file_paths=["file.txt"]&metadata_only=true` - Get file metadata only
- `PUT /api/files?file_path=path` - Create or update file
- `DELETE /api/files?file_path=path` - Delete file

**File paths examples:**
- Single file: `?file_paths=["test.txt"]` → Returns `{ files: [...], total_count: 1, success_count: 1, error_count: 0 }`
- Multiple files: `?file_paths=["file1.txt","folder/file2.txt"]` → Returns list format with all files
- With encoding: `?file_paths=["file.txt"]&encoding=base64`
- Metadata only: `?file_paths=["file.txt"]&metadata_only=true`

**Response format:**
```json
{
  "success": true,
  "data": {
    "files": [{ "file_name": "test.txt", "content": "...", ... }],
    "total_count": 1,
    "success_count": 1, 
    "error_count": 0,
    "errors": []
  }
}
```

**Note:** 
- Backend serves at: `http://localhost:3001/api/*`
- Frontend proxies `/api/*` to `http://localhost:3001/api/*`

## API Documentation

Interactive Swagger documentation is available when running the server:

### Development Environment
```
http://localhost:3001/api/docs
```

### Production/CLI Environment
```
http://localhost:7788/api/docs
```

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Interactive testing interface
- Authentication support (if configured)

## 📝 Configuration

Settings are stored in browser localStorage:

- **Draft Path**: Default location for new files (default: `./drafts`)

Access settings at: http://localhost:7788/settings/explore

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Issues

Found a bug or have a suggestion? Please open an issue at [GitHub Issues](https://github.com/develop-loop/loopme2.ai/issues).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Backend powered by [NestJS](https://nestjs.com/)
- Editor powered by [Milkdown](https://milkdown.dev/)
- Search powered by [ripgrep](https://github.com/BurntSushi/ripgrep)

---

Made with ❤️ by LoopMe Contributors

## Development vs Production

### Development Mode
- Frontend: Next.js dev server on port 3000
- Backend: NestJS dev server on port 3001  
- Frontend proxies `/api/*` to backend

```bash
npm run dev
```

### Production Mode  
- Single NestJS server serves everything on port 7788
- Static frontend files are served by NestJS
- API endpoints available at `/api/*`

```bash
npm run build:dist
./cli/index.js
```

## Publishing to NPM

1. **Build the package:**
   ```bash
   npm run build:dist
   ```

2. **Check the build:**
   ```bash
   ./scripts/publish.sh
   ```

3. **Publish to npm:**
   ```bash
   npm publish
   ```

## Environment Variables

### Development
Create `.env.local` files as needed:

#### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Server (.env)
```env
PORT=3001
CLIENT_URL=http://localhost:3000
```

### Production (CLI)
```env
PORT=7788          # Server port (default: 7788)
NODE_ENV=production # Automatically set by CLI
```

## Shared Types & API Client

The project includes shared TypeScript types and a ready-to-use API client for type-safe frontend-backend communication.

### Usage in Frontend

```typescript
import { FilesApiClient, GetFilesResponse } from '@shared/index';

// Create API client
const filesApi = new FilesApiClient('/api');

// Type-safe API calls
const response: GetFilesResponse = await filesApi.getFile('test.txt');
const multipleFiles = await filesApi.getFiles({
  file_paths: ['file1.txt', 'file2.txt'],
  encoding: 'text'
});

// Save file with full type safety
await filesApi.saveFile({
  file_path: 'new-file.txt',
  content: 'Hello World',
  commit_message: 'Create new file'
});
```

### Shared Types Include

- **Request/Response Types**: `GetFilesRequest`, `SaveFileRequest`, etc.
- **Data Models**: `FileInfo`, `MultipleFilesResponse`, etc. 
- **API Client**: `FilesApiClient` with all methods
- **Common Types**: `ApiResponse`, `User`, etc.

### Benefits

- ✅ **Type Safety**: IntelliSense and compile-time checks
- ✅ **Consistency**: Same types across frontend and backend
- ✅ **DX**: Better developer experience with autocomplete
- ✅ **Maintainability**: Single source of truth for API contracts

## File Storage

### Development Environment
- **Required**: Must set `STORAGE_DIR` environment variable
- **Example**: `STORAGE_DIR=/path/to/files npm run dev`
- **Error**: Server will fail to start without `STORAGE_DIR` in development

### Production/CLI Environment  
- **Default**: Current working directory where CLI is executed
- **Example**: 
  ```bash
  # Files stored in current directory
  loopme3
  ```