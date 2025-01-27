# BITCOIN STAMPS EXPLORER AND API

This is the official API and block explorer for
[Bitcoin Stamps](https://stampchain.io/). It provides a comprehensive interface
for exploring Bitcoin Stamps transactions and metadata, working in conjunction
with the [Bitcoin Stamps Indexer](https://github.com/stampchain-io/btc_stamps).

## Features

- Full Bitcoin Stamps block explorer
- API with OpenAPI/Swagger documentation
- Support for SRC-20, SRC-721, and SRC-101 token standards
- Secure audio streaming and management system

## Media Features

### Music Integration
- Secure audio file streaming with range request support
- Admin interface for music management
- CSRF-protected audio upload system
- Custom-styled audio player with modern UI
- Support for various audio formats
- Efficient audio file storage and retrieval
- Caching system for improved performance

### Media Content
- Curated interviews section
- News coverage integration
- YouTube video embedding
- Responsive media layout

## Prerequisites

1. **Install Deno**
   > ⚠️ **Required Version**: 2.1.5
   ```sh
   curl -fsSL https://deno.land/install.sh | sh
   ```

   Add Deno to your path:
   ```sh
   echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
   echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Required Services**
   - MySQL/MariaDB (with read-only user access)
   - Redis (for caching)
   - Bitcoin Stamps Indexer database

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/stampchain-io/bitcoin-stamps-explorer.git
   cd bitcoin-stamps-explorer
   ```

2. **Environment Setup**
   ```sh
   cp .env.sample .env
   # Edit .env with your configuration
   ```

   ⚠️ **IMPORTANT**: Ensure DB_USER has READ-ONLY permissions for security!

   **Music Integration Setup**
   - Configure audio file storage in MySQL/MariaDB
   - Run audio tables migration:
   ```sh
   deno run -A scripts/run-migration.ts
   ```
   - Required environment variables in `.env`:
     ```sh
     # Database Configuration
     DB_HOST=your_host
     DB_USER=your_user
     DB_PASSWORD=your_password
     DB_PORT=3306
     DB_NAME=your_database
     
     # Redis Cache (optional)
     ELASTICACHE_ENDPOINT=your_redis_endpoint
     CACHE=true
     ```
   - Set up secure audio endpoints:
     - `/api/internal/secure-audio/[id].ts` for streaming
     - `/api/internal/secure-audio/upload.ts` for file upload
   - Admin access required for music management at `/admin/music`
   
   **Audio File Requirements**
   - Supported formats: MP3, WAV, OGG, AAC
   - File size limit: Determined by MySQL `max_allowed_packet` setting
   - Files are stored in the database as MEDIUMBLOB (max 16MB)
   - Streaming support with range requests for better performance

## Development Commands

```sh
# Start development server with hot reload and debugging
deno task dev

# Code quality checks (formatting, linting, type checking)
deno task check

# Update Fresh framework
deno task update

# Decode SRC-20 transactions
deno task decode
deno task decode_olga

# Run schema validation
deno task validate:schema
```

## Production Deployment

1. **Build the project:**
   ```sh
   deno task build
   ```

2. **Start production server:**
   ```sh
   deno task start
   ```

Docker deployment is also supported:

```sh
docker build -t btc-stamps-explorer:2.1.5 .
docker run -p 8000:8000 btc-stamps-explorer:2.1.5
```

The container uses:

- Deno 2.1.5 Alpine base image
- Production environment
- Port 8000
- Required permissions for network, file system, and environment variables

For development with Docker:

```sh
# Build with development tag
docker build -t btc-stamps-explorer:dev .

# Run with mounted volumes for development
docker run -p 8000:8000 \
    --env-file .env \
    -v $(pwd):/app \
    btc-stamps-explorer:dev deno task dev
```

## API Documentation

- OpenAPI/Swagger documentation available at `/docs`
- Schema validation with `deno task validate:schema`

## Music Player Integration

### Using the Music Player Component

```tsx
import { MusicSection } from "$components/media/MusicSection.tsx";

// In your page component:
export default function YourPage() {
  return (
    <div>
      <MusicSection />
    </div>
  );
}
```

### Styling
The music player includes custom styles for a modern UI:
- Pixelated background effect
- Custom audio controls styling
- Responsive design
- Gradient backgrounds
- Hover effects

### Security
- CSRF protection for audio endpoints
- Secure streaming with range request support
- Admin-only upload access
- File type validation
- Size limit enforcement

### Technical Details
- **Caching Strategy**:
  - Audio files are cached in Redis for 5 minutes
  - Streaming supports partial content (HTTP 206)
  - Range requests for efficient seeking
  - Client-side caching headers

- **Security Model**:
  - CSRF tokens required for all requests
  - File type validation on upload
  - Secure file storage in database
  - Admin-only management interface
  - Rate limiting on streaming endpoints

- **Error Handling**:
  - Graceful fallbacks for missing files
  - Proper error status codes
  - User-friendly error messages
  - Upload validation feedback

## Testing and Quality Assurance

### Unit Tests
```sh
# Run all tests
deno task test

# Run specific test suites
deno task test:audio
```

Test coverage includes:
- Audio file upload and streaming
- CSRF token validation
- Range request handling
- Error scenarios
- Cache effectiveness

### Integration Tests
- End-to-end audio streaming tests
- Admin interface functionality
- Component rendering tests
- Security validation tests

### Performance Tests
Test scenarios include:
- Concurrent streaming (1000 users)
- Large file uploads
- Cache hit rates
- Memory usage patterns

Performance requirements:
- Response time < 500ms for streaming
- Upload success rate > 99.9%
- Cache hit rate > 80%
- Memory usage < 50MB per instance

## Monitoring and Logging

### Metrics Collection
- Audio file access patterns
- Streaming performance
- Cache effectiveness
- Error rates
- Resource usage

### Logging Strategy
```typescript
// Logging levels and categories
logger.error("stamps", {
  message: "Error retrieving audio file",
  error: error.message,
  stack: error.stack,
  id: audioId,
});
```

### Health Checks
- Database connectivity
- Redis cache availability
- Storage capacity
- Memory usage
- API endpoint health

### Alerts and Notifications
- Error rate thresholds
- Storage capacity warnings
- Performance degradation
- Security incidents

## Maintenance and Operations

### Backup Procedures
1. Database Backups
   ```sh
   # Backup audio files table
   mysqldump -u [user] -p [database] audio_files > backup.sql
   ```

2. Verification Steps
   - Check backup integrity
   - Verify file counts
   - Test restore procedure

### Storage Management
- Regular cleanup of unused files
- Storage usage monitoring
- Compression optimization
- Cache invalidation

### Security Updates
- Regular security audits
- CSRF token rotation
- Access control reviews
- Rate limit adjustments

## API Reference

### Audio Streaming API

#### Get Audio File
```http
GET /api/internal/secure-audio/[id]
```

Headers:
- `x-csrf-token`: Required for authentication
- `range`: Optional for partial content requests

Response:
- `200`: Full audio file
- `206`: Partial content
- `401`: Unauthorized
- `404`: File not found

#### Upload Audio File
```http
POST /api/internal/secure-audio/upload
```

Headers:
- `x-csrf-token`: Required for authentication
- `Content-Type`: multipart/form-data

Body:
- `audio`: Audio file (MP3, WAV, OGG, AAC)

Response:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "size": "number"
  }
}
```

### Component API

#### MusicSection Component
```tsx
import { MusicSection } from "$components/media/MusicSection.tsx";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
}
```

Props:
- None (uses internal state management)

Features:
- Automatic CSRF token handling
- Range request streaming
- Progress tracking
- Error handling

## Troubleshooting Guide

### Common Issues

#### Audio Streaming Issues
1. **CSRF Token Errors**
   ```typescript
   // Check if token is present in headers
   const token = req.headers.get("x-csrf-token");
   if (!token) {
     return ApiResponseUtil.unauthorized("Missing CSRF token");
   }
   ```
   Solution: Ensure CSRF token is properly initialized and included in requests

2. **Range Request Failures**
   ```typescript
   // Verify range header format
   const range = req.headers.get("range");
   if (range && !range.startsWith("bytes=")) {
     return ApiResponseUtil.badRequest("Invalid range header");
   }
   ```
   Solution: Check browser compatibility and range header format

3. **Upload Failures**
   - Verify file size is within limits
   - Check file format compatibility
   - Ensure database connection is active
   - Verify storage capacity

#### Performance Issues
1. **Slow Streaming**
   - Check Redis cache configuration
   - Verify network bandwidth
   - Monitor database performance
   - Review concurrent connections

2. **Memory Leaks**
   - Monitor audio buffer handling
   - Check stream closure
   - Review cache invalidation
   - Inspect connection pooling

### Debugging Tools
```sh
# Enable debug logging
DENO_ENV=development deno task dev

# Monitor Redis cache
redis-cli monitor

# Check database connections
mysql -u [user] -p -e "SHOW PROCESSLIST;"
```

## Development Best Practices

### Code Organization
```
server/
├── services/
│   └── audio/
│       ├── audioService.ts    # Core audio functionality
│       └── streamingService.ts # Streaming optimization
├── database/
│   └── migrations/
│       └── audio_files.sql    # Database schema
└── routes/
    └── api/
        └── internal/
            └── secure-audio/  # Audio endpoints
```

### Security Guidelines
1. **Input Validation**
   ```typescript
   // Always validate file types
   if (!audioFile.type.startsWith("audio/")) {
     return ApiResponseUtil.badRequest("Invalid file type");
   }
   ```

2. **Access Control**
   ```typescript
   // Implement role-based access
   if (!await SecurityService.isAdmin(user)) {
     return ApiResponseUtil.forbidden("Admin access required");
   }
   ```

3. **Error Handling**
   ```typescript
   try {
     // Operation code
   } catch (error) {
     logger.error("stamps", {
       message: "Operation failed",
       error: error instanceof Error ? error.message : "Unknown error",
       stack: error instanceof Error ? error.stack : undefined,
     });
     return ApiResponseUtil.internalError(error);
   }
   ```

### Performance Optimization
1. **Caching Strategy**
   ```typescript
   // Implement cache with TTL
   const result = await dbManager.executeQueryWithCache(
     query,
     [id],
     1000 * 60 * 5  // 5 minute TTL
   );
   ```

2. **Streaming Optimization**
   ```typescript
   // Use chunked transfer for large files
   return new Response(audioData.stream(start, end), {
     status: 206,
     headers: {
       "Content-Range": `bytes ${start}-${end}/${size}`,
       "Accept-Ranges": "bytes",
     },
   });
   ```

3. **Resource Management**
   ```typescript
   // Clean up resources after use
   try {
     return await operation();
   } finally {
     await cleanup();
   }
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Run `deno task check` to ensure code quality
4. Add tests for new features
5. Submit a pull request

## Additional Resources

- [Bitcoin Stamps Indexer](https://github.com/stampchain-io/btc_stamps)
- [API Documentation](https://stampchain.io/docs)
- [Discussion Board](https://github.com/orgs/stampchain-io/discussions)

## License

This project is licensed under the [AGPL-3.0 License](LICENSE.md).
