---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: "Switch Statements"
shader: ./switch.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "switch_case()",  "type": "u32"},
    {"expr": "switch_default()",  "type": "u32"}
]}'
---

Similar to `if` statements, a `switch` statement can be used to branch over multiple execution paths.

A `switch` statement has a condition, which must evaluate to a [concrete integer scalar](../types/basic-scalars.md) type (such as `i32` or `u32`). The `case` selectors must have the same type as the condition expression.

Like with `if` statements, the parentheses around the condition are optional.

A `switch` statement can have zero or more `case` blocks.

A `default` block is strictly required in every `switch` statement. Multiple `default` blocks are not permitted.

`case` and `default` blocks require curly braces `{}` around their bodies.

There is no implicit `fallthrough` in WGSL (no `break` is needed at the end of a block), but `case` blocks can specify multiple selectors in a comma-separated list. The `default` keyword may also be included in a multi-selector list.

<details class='example'>
<summary>Example</summary>

```wgsl
let a = 4;
switch a {
  case 1, 2, 3: {
    // Executes if a is 1, 2, or 3
  }
  default: {
    // Executes if none of the above match
  }
}

// Default can be included in a multi-selector list
switch a {
  case 1, 2, default: {
    // Executes for 1, 2, or any unhandled value
  }
}
```

</details>
