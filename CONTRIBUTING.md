# Contributing to RevoRoof AI

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local`
5. Run dev server: `npm run dev`

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types on functions

### React
- Functional components only
- Hooks for state management
- Server Components where possible

### Styling
- Tailwind CSS utility classes
- Custom classes in `globals.css`
- Mobile-first responsive design

### Naming Conventions
- Components: PascalCase
- Files: kebab-case
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

## Commit Messages

Follow Conventional Commits: