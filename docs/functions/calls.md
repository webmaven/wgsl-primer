---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Function Calls & Recursion'
shader: ./calls.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "transform_val(12.5)", "type": "f32"}]}'
---
Functions in WGSL are called by writing the function name followed by comma-separated arguments enclosed in parentheses `()`.

---

### Declaration Order Independence

Unlike languages like C/C++, WGSL does not require functions to be declared before they are called. You can organize your functions in any order in the source file, and they will resolve successfully.

<details class='example'>
<summary>Example: Declaration order</summary>

```rust
fn initialize() {
  calculate_values(); // Ok, even though 'calculate_values' is declared below
}

fn calculate_values() {
  // body
}
```

</details>

---

### Why Recursion is Forbidden

Function calls in WGSL **cannot be recursive**, either directly (a function calling itself) or indirectly (function `a` calling `b`, which in turn calls `a`).

!!! warning "Static Compile-Time Allocation"
    GPU architectures do not manage thread execution using dynamic runtime stack pointers. Instead, the shader compiler pre-allocates an exact, static amount of memory for every thread invocation at compile time. Because recursion requires a dynamic runtime call stack, it is structurally prohibited to guarantee execution safety and hardware speed.

---

### Passing Arguments: Value vs. Pointer

*   **Passed By Value**: By default, parameters in WGSL are passed *by value*. The function receives a complete copy of the argument, and any modifications to the parameters inside the function do not affect the original variables in the calling scope.
*   **Passed By Pointer**: When you need a helper function to mutate your local variables (e.g., swapping values or accumulating results), you can pass variables *by pointer*.
    
    *Detailed Pointer Mechanics* (including the address-of `&` and dereferencing `*` operators) are covered extensively in the dedicated [Passing Pointers](../types/pointers/passing_pointers.md) sub-section of the **Types** section.