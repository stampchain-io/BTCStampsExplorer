# Security

## Production Security

This is a **Deno project**. The production application runs entirely on Deno with:

- Secure imports from `deno.json` import map
- All runtime dependencies validated through JSR/deno.land registries  
- No Node.js dependencies in production

## Development Dependencies

Some npm packages are used for **development tooling only**:

- `tailwindcss` - CSS processing
- `husky` - Git hooks
- `autoprefixer` - CSS processing
- `postcss` - CSS processing

**Note**: API testing (`newman`) and OpenAPI validation (`@redocly/cli`) are run via Docker to avoid dependency conflicts while maintaining functionality.

**These tools do not affect production security** as they:

1. Never run in production environments
2. Are isolated to local development
3. Don't process user data or external inputs in production context

## Dependabot Alerts

Dependabot alerts for npm packages in this repository relate to development tooling only. While we monitor these alerts, they do not pose direct security risks to the production application.

## Security Best Practices

- Production runs on Deno with explicitly pinned versions
- All external APIs use proper validation and sanitization
- Security headers implemented (see `lib/utils/securityHeaders.ts`)
- Rate limiting and CSRF protection in place

## Reporting Security Issues

For security concerns related to the production application, please contact the maintainers privately. 