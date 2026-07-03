---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: "For Statements"
shader: ./for.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "for_loop()",  "type": "u32"}
]}'
---

A `for` statement is made up of:

- An optional initializer
- An optional condition
- An optional `continuing` expression
- A loop body

The initializer, condition, and `continuing` expressions are each separated by a `;`.

<details class='example'>
<summary>Example</summary>

```wgsl
for (var i = 0; i < 10; i = i + 1) {
    // loop body
}
```

</details>

Unlike `if` and `switch` statements, a `for` statement requires parentheses around its loop controls.

Braces are strictly required around the `for` body.

All loops in WGSL **must** terminate.

As with other statement conditions, if provided, the condition must be a
boolean expression.

The condition is evaluated before executing the body on each iteration.
If the condition is `false` the loop will end.

A `break` statement can be used to terminate the closest enclosing loop or `switch` statement.

<details class='example'>
<summary>Example</summary>

```wgsl
for (;;) {
  break;
}
```

```wgsl
for (;;) {
  const a = 1;
  switch (a) {
    case 1, default: {
      // Breaks the switch, but not the for loop
      break;
    }
  }
}
```

</details>

A `continue` statement can be used to skip the rest of the current iteration and proceed to the next iteration (jumping directly to the update/continuing expression of the loop).

<details class='example'>
<summary>Example</summary>

```wgsl
for (var i = 0; i < 10; i = i + 1) {
  if (i == 1) {
    continue;
  }
}
```

</details>

!!! important "No Increment/Decrement or Compound Assignment Operators"
    Unlike JavaScript, C++, or GLSL, WGSL **does not support** increment/decrement operators (`++`, `--`) or compound assignment operators (`+=`, `-=`, `*=`, `/=`).
    
    You must always write out the full explicit assignment, for example:
    - Use `i = i + 1` instead of `i++` or `i += 1`.
    - Use `counter = counter + 1` instead of `counter += 1`.
