# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** open a public issue for security vulnerabilities.

Email: security@revolutionroofing.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours.

## Security Measures

### Authentication
- Supabase Auth with RLS
- JWT tokens with expiration
- Password hashing (bcrypt)

### Data Protection
- AES-256-GCM encryption at rest
- TLS 1.3 in transit
- Row Level Security on all tables

### API Security
- Rate limiting (1 req/sec per user)
- Input validation (Zod schemas)
- CORS restrictions
- Server-side only API keys

### Infrastructure
- HTTPS only
- CSP headers
- HSTS enabled
- Regular dependency updates

## Compliance

- GDPR compliant
- SOC 2 Type II (in progress)
- PCI DSS Level 1 (Stripe)

## Audit Log

All sensitive operations logged:
- User authentication
- Data access
- Permission changes
- Payment transactions