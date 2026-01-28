# Algebra

Pure geometric algebra implementation with no framework dependencies. Provides basis sets, multivector operations, and algebra-specific helpers for CGA and PGA.

## Architecture

```
basisSet.ts     ← Core: creates basis sets, cayley tables, multivector operations
    ↓
cga.ts / pga.ts ← Pre-configured algebras with standard basis elements
    ↓
cgaHelpers.ts / pgaHelpers.ts ← Algebra-specific functions (up/down, classify, etc.)
```

## Design Goals (not neccessarily met yet)

- **Framework-agnostic**: No Svelte, Three.js, or DOM dependencies
- **Immutable**: Operations return new MVs, never mutate
- **Type-safe**: Full TypeScript definitions
- **Testable**: Pure functions enable unit testing
