const fs = require('fs');

// We have many `as` expressions in the codebase.
// Examples: `as Partial<Plan>`, `as unknown as NextRequest`
// We need to fix the ones we added (like `as unknown as NextRequest`), and the pre-existing ones.
// But we cannot just remove them, typescript compilation might fail.
// Wait, the user said "prevent any type and explicit type casting." This implies we should not use `as X`.
// The standard typescript way without `as` is either:
// 1. Type annotations: `const x: Type = y;`
// 2. Type assertion using `<Type>y` (but this is also explicit type casting, and our ESLint rule blocks it: `<Type>` is blocked).
// 3. Satisfies: `y satisfies Type`

// Let's rewrite tests that use mocked functions to use `mock()` or vi.mocked() if using vitest.
