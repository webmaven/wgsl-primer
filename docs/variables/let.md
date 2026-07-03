---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'let'
---
A `let` declaration binds a permanent name to an immutable value within a function. Unlike compile-time constants, `let` variables are allocated at runtime on the GPU, allowing them to capture dynamic thread-specific computations, buffer reads, and texture colors.

---

## Scoping

A `let` variable is strictly **block-scoped** and can only be declared inside a function. 

It is visible only within the curly braces `{}` in which it is defined, starting at its line of declaration. Declaring a `let` at module scope (outside a function) causes a compilation error.

---

## Syntax and Initialization

A `let` declaration must be initialized immediately. It can specify an explicit type or let the compiler automatically infer the type from the initializer expression.

**Explicit Type Syntax:**
```wgsl
let name : type = initializer;
```

**Inferred Type Syntax:**
```wgsl
let name = initializer;
```

<details class='example'>
<summary>Examples</summary>

```wgsl
fn process_pixel(coord: vec2<f32>) {
    // Inferred type (f32) initialized with a dynamic parameter
    let x_offset = coord.x * 2.0; 
    
    // Explicit type initialized with a literal
    let max_depth: f32 = 1.0; 
}
```

</details>

---

## Key Features

`let` declarations possess two critical features that distinguish them from other variables:

### 1. No Evaluation Stage Restrictions
The initializer of a `let` variable can be an expression from any evaluation stage:
- **Constant**: `let val = 42;`
- **Override**: `let size = WORKGROUP_SIZE * 2u;`
- **Runtime**: `let color = textureSample(my_tex, my_samp, uv);`

### 2. Support for Pointer Types
Unlike `var` declarations (which define mutable storage and cannot be of a pointer type directly), a `let` declaration can bind directly to a pointer. This is highly useful for creating readable aliases to deeply nested structure members or buffer elements:

```wgsl
var my_local_var = 10;
let var_pointer = &my_local_var; // ✔️ VALID: let binding to a pointer type
```

---

## Constraints

- **Immutable**: Once initialized, a `let` variable cannot be reassigned or modified.
- **Local Scope Only**: Cannot be declared at the top-level of a shader module.

```wgsl
// ❌ COMPILE ERROR: let is not valid at module scope
let GLOBAL_LIMIT = 100; 

fn test() {
    let x = 5;
    // ❌ COMPILE ERROR: cannot reassign x
    x = 10; 
}
```

---

!!! info "Deep-Dive: Runtime Evaluation Stage"
    For details on how the GPU schedules and evaluates `let` variables across parallel invocations, including their representation in hardware registers and performance optimization techniques, see the **[Runtime Stage](../expressions/evaluation-stage/runtime/index.md)** reference.
