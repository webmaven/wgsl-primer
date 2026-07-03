---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'const'
---
A `const` declaration gives a permanent name to a compile-time immutable value. These constants are evaluated entirely on the CPU by the compiler when your shader module is created, resulting in zero runtime overhead.

---

## Scoping

A `const` can be declared in two locations:

1. **Module Scope**: Declared at the top level of your shader (outside any function). It is visible to all functions in the shader module.
2. **Function Scope**: Declared inside a function block. It is visible only within that block (and nested sub-blocks) after its point of declaration.

---

## Syntax and Initialization

A `const` declaration must be initialized immediately, and can specify an optional type. If the type is omitted, the compiler automatically infers it from the initializer expression.

**Explicit Type Syntax:**
```wgsl
const name : type = initializer;
```

**Inferred Type Syntax:**
```wgsl
const name = initializer;
```

<details class='example'>
<summary>Examples</summary>

```wgsl
// Module-scope constants
const PI: f32 = 3.14159265;
const MAX_LIGHTS = 4u; // Inferred as u32

fn main() {
    // Function-scope constant
    const LOCAL_BIAS = 0.05f;
}
```

</details>

---

## Constraints

To ensure compile-time evaluation, `const` declarations are subject to the following rules:

- **Immutable**: Constant values cannot be reassigned or modified. Any attempt to write to a `const` causes a compilation error.
- **Initializer Expression**: The initializer must be a valid **constant-expression**. It can only be composed of literal values, other compile-time constants, and `@const` built-in function calls. It *cannot* depend on `let` variables, `override` constants, function parameters, or mutable `var` variables.

```wgsl
const BASE_SPEED = 2.0;               // ✔️ VALID: literal initializer
const MAX_SPEED = BASE_SPEED * 1.5;   // ✔️ VALID: constant-expression initializer

fn process(runtime_multiplier: f32) {
    // ❌ COMPILE ERROR: runtime_multiplier is a dynamic parameter, not a constant
    const dynamic_speed = BASE_SPEED * runtime_multiplier; 
}
```

---

!!! info "Deep-Dive: Constant Evaluation Stage"
    For details on how the compiler processes constants, including CPU-side constant folding, `@const` built-in function execution, and compile-time assertions, see the **[Constant Stage](../expressions/evaluation-stage/constant/index.md)** reference.
