---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: "If Statements"
shader: ./if.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "executed_block()",  "type": "u32"},
    {"expr": "else_block()",  "type": "u32"},
    {"expr": "casted_block()",  "type": "u32"}
]}'
---

For simple branching, the `if` statement is provided for control flow.

An `if` statement requires a condition, which must be a boolean expression of type `bool`.

Parentheses are optional around the condition, but curly braces `{}` are strictly required around the body.

<details class='example'>
<summary>Example</summary>

```wgsl
if a {
    // executed if a is true
} else if (b) {
    // executed if a is false and b is true
}
```

</details>

An `if` statement can be followed by zero or more `else if` blocks and a single optional `else` block.

<details class='example'>
<summary>Example</summary>

```wgsl
if a {
    // executed if a is true
} else if b {
    // executed if a is false and b is true
} else if c {
    // executed if a and b are false and c is true
} else {
    // executed if all conditions are false
}
```

</details>

The `else` block must come last.
