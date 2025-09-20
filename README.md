# LoopMe3 Monorepo

A full-stack TypeScript monorepo with Next.js frontend, NestJS backend, and shared types/DTOs.

## Project Structure

```
├── client/          # Next.js frontend application
├── server/          # NestJS backend application  
├── shared/          # Shared types, DTOs, and utilities
├── package.json     # Root workspace configuration
└── tsconfig.json    # Base TypeScript configuration
```

## Prerequisites

- Node.js 18+ 
- npm 9+ (for workspace support)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build shared package:**
   ```bash
   npm run build:shared
   ```

3. **Install workspace dependencies:**
   ```bash
   npm install --workspaces
   ```

## Development

### Start all services
```bash
npm run dev
```

This will start:
- Frontend (Next.js): http://localhost:3000
- Backend (NestJS): http://localhost:3001

### Individual services
```bash
# Frontend only
npm run dev:client

# Backend only  
npm run dev:server

# Shared package (watch mode)
cd shared && npm run dev
```

## Build

### Build all packages
```bash
npm run build
```

### Individual builds
```bash
npm run build:client
npm run build:server
npm run build:shared
```

## Testing

```bash
# Run tests for all packages
npm run test

# Run linting for all packages
npm run lint
```

## Architecture

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

## CLI Usage

After publishing to npm, users can install and use your application:

```bash
# Install globally
npm install -g loopme3

# Start the application
loopme3

# Or with custom port
PORT=8080 loopme3

# Show help
loopme3 --help

# Show version
loopme3 --version
```

The CLI will start the NestJS server which serves both the API and the static frontend files.

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