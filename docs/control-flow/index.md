---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Control Flow Overview'
---
WGSL provides structured, type-safe control flow statements for conditional branching and looping:

- **[If Statements](if-statements.md)**: Standard conditional branching using `if`, `else if` chains, and an optional `else` block. Parentheses around conditions are optional, but curly braces `{}` are strictly required around block bodies. All guard conditions must evaluate to a strict `bool` type, as WGSL does not support implicit type coercion.
- **[Switch Statements](switch-statements.md)**: Multi-way branching evaluated against discrete, concrete integer scalar values (such as `i32` or `u32`). Every `switch` statement requires a `default` block, and all cases must have curly braces `{}`. WGSL does not support implicit `fallthrough`, but allows sharing code blocks by listing multiple comma-separated case selectors.
- **[While Statements](while-statements.md)**: Standard pre-checked loop constructs that repeatedly execute a body as long as a boolean guard condition remains `true`. Parentheses around conditions are optional, but curly braces `{}` are strictly required around the loop body.
- **[For Statements](for-statements.md)**: Iterative loops containing an optional initializer, loop guard condition, and increment/update expression, separated by semicolons. WGSL does not support post-increment/decrement operators (`++`/`--`) or compound assignments (like `+=`) as loop updates; they must be written as explicit assignments (e.g., `i = i + 1`).
- **[The loop Statement](loop-statements.md)**: WGSL's fundamental loop construct that executes indefinitely unless explicitly exited via `break`, `return`, or a `break if` statement inside an optional `continuing` block. It serves as the primitive building block that other loops are compiled into, and can be used to construct custom structures like `do-while` or `do-until` loops.