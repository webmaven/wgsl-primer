---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Syntax'
shader: ./syntax.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "give_me_a_number()", "type": "i32"}, {"expr": "average(10.0, 20.0)", "type": "f32"}]}'
---
Functions in WGSL are declared using the `fn` keyword. Each function must explicitly specify its parameters and return type if it yields a value.

---

### Function Signature Template

A user-defined function has the following structure:

<code>fn <span class="template template-fn-name">name</span>(<span class="template template-fn-params">parameters</span>) -&gt; <span class="template template-fn-ret">return_type</span> { <span class="template template-fn-body">body</span> }</code>

*   <span class="template template-fn-name">name</span> is the unique identifier of the function (e.g., `average`).
*   <span class="template template-fn-params">parameters</span> is a comma-separated list of inputs in the form `identifier : type`.
*   <span class="template template-fn-ret">return_type</span> is the explicit type of the value the function returns.
*   <span class="template template-fn-body">body</span> is the enclosed block of statements executing the subroutine.

---

### Zero Implicit Coercion (Strict Type Matching)

WGSL enforces **strict typing** with absolutely no implicit type conversion. When calling a function, the arguments you pass must *exactly* match the declared types of the parameters.

!!! warning "Strict Type Matching"
    If a parameter is declared as `f32`, passing an integer literal like `5` or an `i32` variable will result in a compile-time error. You must explicitly cast the value: e.g., `5.0` or `f32(my_int)`.

---

### Implicit Parameter Immutability (Read-Only)

All function parameters in WGSL are **implicitly read-only**. You cannot re-assign or modify the value of a parameter variable within the function body. If you need a mutable copy, you must explicitly declare a local variable using `var` and copy the parameter into it.

```rust
fn square_and_add(val : f32) -> f32 {
  // val = val * val; // COMPILE ERROR: cannot assign to parameter 'val'
  var local_val = val;
  local_val = local_val * local_val; // OK
  return local_val + 1.0;
}
```

---

### GPU-Specific Type Restrictions

To maintain deterministic execution on GPU hardware, WGSL places strict restrictions on what types can be passed to or returned from user-defined functions:

*   **No Textures or Samplers as Parameters**: Unlike GLSL or HLSL, you cannot pass texture or sampler variables as parameters into user-defined functions. They must instead be accessed as global variables.
*   **Constructible Return Types Only**: A user-defined function can only return **constructible types** (such as scalars, vectors, matrices, arrays, and structs). Pointers, textures, and samplers are not constructible and cannot be returned.


---

### Declaring Void Functions (No Return Value)

If a function does not return a value, the arrow `->` and return type are completely omitted from the signature:

<details class='example'>
<summary>Example: Function returning nothing</summary>

```rust
fn print_or_store_value(val : f32) {
  // Perform side effects, e.g., updating storage or handle
  // No return statement is needed
}
```

</details>

---

### Declaring Returning Functions

Functions that return a value specify the type after the parameter list and *must* terminate all code paths with a matching `return` statement:

<details class='example'>
<summary>Example: Calculating an average</summary>

```rust
fn average(a : f32, b : f32) -> f32 {
  return (a + b) / 2.0;
}
```

</details>

Use the playground to see these functions compile and return values in real-time.