---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'The loop Statement'
---
The `loop` statement is WGSL's most fundamental loop construct. It executes its body repeatedly and indefinitely, unless interrupted by a `break` or `return` statement.

In fact, the WGSL compiler internally desugars both `for` and `while` loops into primitive `loop` statements!

### Syntax

```wgsl
loop {
    // Loop body

    continuing {
        // Continuing block (optional)
        // Executed at the end of each iteration
    }
}
```

### The `continuing` Block

A `loop` statement can optionally end with a `continuing` block. The statements inside the `continuing` block are executed at the end of each iteration, after the main loop body completes.

The `continuing` block has a key property in WGSL:

- Executing a `continue` statement anywhere within the loop body immediately transfers control flow directly to the `continuing` block.
- It is typically used to update loop indices or state variables (e.g., `i = i + 1;`) to ensure they are updated even when an iteration is skipped via `continue`.

### Example: Simple Counter Loop

Here is how you write a basic counting loop using a `loop` statement and a `continuing` block:

<details class='example'>
<summary>Example</summary>

```wgsl
var i: i32 = 0;

loop {
    if (i >= 10) {
        break; // Exit the loop when i reaches 10
    }

    // Code to execute in each iteration

    continuing {
        i = i + 1; // Increment the counter before the next iteration
    }
}
```

</details>

### Control Flow Statements: `break` and `continue`

- **`break`**: Immediately terminates the closest enclosing loop, transferring control to the next line of code following the loop.
- **`continue`**: Skips the rest of the current iteration's loop body and jumps directly to the `continuing` block. After the `continuing` block executes, control loops back to the start of the loop body.

### Example: Using `break` and `continue`

The following example skips even numbers and terminates when `i` reaches `8`:

<details class='example'>
<summary>Example</summary>

```wgsl
var i: i32 = 0;

loop {
    if (i >= 10) {
        break;
    }

    if (i % 2 == 0) {
        continue; // Skips printing/processing even numbers and jumps to continuing
    }

    // This code only runs for odd numbers
    let oddValue = i;

    continuing {
        i = i + 1; // Ensures i is always incremented, even when continue is hit
    }
}
```

</details>

!!! important
    Because `continue` transfers execution to the `continuing` block, placing loop variable updates (like `i = i + 1;`) inside the `continuing` block is critical. If you placed the update at the end of the main loop body instead, hitting `continue` would skip the update and cause an infinite loop!

---

## Implementing Other Loop Semantics with `loop`

While WGSL has built-in support for `for` and `while` loops, you can use the primitive `loop` statement combined with `break if` to easily construct other advanced loop patterns, such as **do-while** (post-test loops) and **do-until** loops.

### The `break if` Statement

WGSL provides a unique statement called `break if`, which can **only** be placed as the last statement inside a `continuing` block:

```wgsl
break if condition;
```

It evaluates `condition` (which must be a `bool`). If `condition` is `true`, the loop immediately terminates; if `false`, execution loops back to the start of the loop body.

---

### 1. Implementing a `do-while` Loop

A standard `do-while` loop executes its body first, then checks a condition. If the condition is `true`, it runs again.

To achieve this in WGSL, place the negation of your condition (`!condition`) in the `break if` statement:

<details class='example'>
<summary>Example: do-while simulation</summary>

```wgsl
var i: i32 = 0;

loop {
    // Loop body executes at least once
    // ... do work ...

    continuing {
        i = i + 1;
        // Exit loop when i >= 5 (equivalent to: do { ... } while (i < 5))
        break if !(i < 5);
    }
}
```

</details>

---

### 2. Implementing a `do-until` Loop

An `until` loop executes its body repeatedly *until* a specific condition becomes `true`.

Because `break if` exits when its condition is `true`, it naturally maps directly to a `do-until` loop:

<details class='example'>
<summary>Example: do-until simulation</summary>

```wgsl
var i: i32 = 0;

loop {
    // Loop body executes at least once
    // ... do work ...

    continuing {
        i = i + 1;
        // Exit loop once i reaches or exceeds 5
        break if i >= 5;
    }
}
```

</details>
