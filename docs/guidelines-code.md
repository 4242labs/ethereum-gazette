# Ethereum Gazette: Code Guidelines

TypeScript standards, React patterns, component architecture, testing, and review checklist.

---

## TypeScript Standards

### Strict Mode

TypeScript strict mode is mandatory. No `any` types without explicit justification comment.

### Naming Conventions

- **Variables/functions:** camelCase
- **Components/types/interfaces:** PascalCase
- **Constants:** UPPER_SNAKE_CASE
- **Files:** kebab-case for utilities, PascalCase for components

### Type Definitions

- All functions must have explicit return types and typed parameters
- Props interfaces defined for all components (no inline prop types)
- Shared types live in `types/` directory
- Use `interface` for object shapes, `type` for unions/intersections

```typescript
// Good
interface PostCardProps {
  post: Post
  featured?: boolean
}

const PostCard = ({ post, featured = false }: PostCardProps): JSX.Element => { ... }

// Bad
const PostCard = ({ post, featured }: any) => { ... }
```

---

## React Patterns

### Component Architecture

- **Layout components** (`layout/`): Shell, structural containers
- **Feature components** (`features/`): Business logic, domain-specific
- **UI components** (`ui/`): Reusable primitives, no business logic
- **Feed components** (`feed/`): Content display, card rendering

### Hooks Rules

- Dependencies arrays must be correct and complete
- Custom hooks in `hooks/` directory with `use` prefix
- Cleanup functions in `useEffect` for subscriptions, timers, listeners

### State Management (Zustand)

- Single store pattern via `useAppStore`
- Actions collocated with state
- No direct state mutation — always use `set()`
- Selectors for derived data

### Data Fetching Pattern

```tsx
const Feed = () => {
  const { posts, loading, error } = useFeed()

  if (loading) return <FeedSkeleton />
  if (error) return <ErrorState />
  if (!posts.length) return <EmptyState />

  return <PostList posts={posts} />
}
```

### Error Handling

- Error boundaries wrapping component trees
- Try/catch with meaningful error messages for async operations
- User-facing errors: friendly message, no internals exposed
- API errors: structured `{ success: false, error: string }` format

### External Links

All external links must use:

```tsx
window.open(url, '_blank', 'noopener,noreferrer')
// or
<a href={url} target="_blank" rel="noopener noreferrer">
```

---

## CSS / Styling

### Tailwind Conventions

- Use Tailwind utility classes as primary styling method
- `dark:` variants for dark mode
- CSS custom properties for dynamic/theme values
- No inline styles except for truly dynamic values

### Custom Classes

- `.shadow-soft` / `.shadow-soft-md` / `.shadow-soft-lg` — neutral shadows
- `.hover-lift` — card hover elevation effect
- `.text-title` / `.text-body` / `.text-meta` — typography system

### Dark Mode

- Implementation: CSS variables + Tailwind `dark:` prefix + Zustand store
- System preference detection as fallback
- Known debt: some `!important` overrides needed due to Tailwind v4 processing order

---

## Performance

### Code Splitting

- Route-based chunks via React.lazy
- Suspense boundaries with skeleton fallbacks

### Memoization

- `useMemo` for expensive computations (filtering, sorting)
- `React.memo` for components receiving stable props
- `useCallback` for handler functions passed as props

### Bundle Size

- Target: <200KB initial JS
- Tree-shake imports (named imports, not default)
- Lazy-load non-critical components (Featured, Search)

---

## Testing

### Framework

- **Vitest** for unit and integration tests
- **Playwright** for E2E (planned)

### What to Test

- Business logic (filtering, scoring, parsing, normalization)
- Component rendering with various prop combinations
- Error states and edge cases
- API endpoint responses

### Test Quality Requirements

- Tests must assert behavior, not just "renders without error"
- Cover happy path, error path, and edge cases
- Mocks should be appropriate — don't mock what should be tested
- New code without corresponding tests should be flagged

---

## Security Checklist

| Check                              | Severity   |
|:-----------------------------------|:-----------|
| No `any` types without justification | Blocker   |
| No hardcoded secrets/credentials   | Blocker    |
| XSS: user/RSS input sanitized      | Critical   |
| No `dangerouslySetInnerHTML` without sanitization | Critical |
| No `eval()` with external input    | Critical   |
| Input validation on all boundaries | Critical   |
| External links use `noopener noreferrer` | Medium  |
| Console.log removed (except debug mode) | Medium  |
| Error messages don't leak internals | Medium    |

---

## Vercel Compliance

- API routes have proper error handling and timeouts (`maxDuration`)
- Environment variables documented (not in code)
- No secrets in `vercel.json`
- Cron jobs use `CRON_SECRET` authentication
- Functions don't exceed Vercel limits (10s default, 60s for crons)

---

**Last Updated:** 2026-03-21
