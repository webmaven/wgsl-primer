---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: "Local Variables"
shader: ./var-function.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "f()", "type": "i32"}]}'
---
Local variables are mutable storage locations allocated within the scope of a function. They reside in the `function` address space, meaning they are allocated on the executing thread's local stack or register file and are strictly private to that specific thread invocation.

---

## Syntax & Scoping

A local variable is declared inside a function body using the `var` keyword. The address space `function` can be explicitly specified, but because it is the implicit default for all function-scoped variables, it is typically omitted.

The following syntax templates are valid for local variables:

<code>var&lt;<span class="template template-ptr-as">function</span>&gt; <span class="template">name</span>: <span class="template">Type</span>;</code>  
<code>var&lt;<span class="template template-ptr-as">function</span>&gt; <span class="template">name</span> = <span class="template">initializer</span>;</code>  
<code>var <span class="template">name</span>: <span class="template">Type</span> = <span class="template">initializer</span>;</code>

---

## Technical Constraints & Rules

1. **Mutability**: Local variables are fully mutable. Their values can be updated at runtime using the assignment operator (`=`).
2. **Implicit Default Address Space**: Omitting the `<function>` address space is the standard idiom in WGSL. Declaring `var x: i32` is semantically identical to `var<function> x: i32`.
3. **Initialization & Zero-Initialization**: If a local variable is declared without an initializer, the compiler automatically zero-initializes it according to its type (e.g., `0` for numeric types, `false` for booleans, or zeroed fields for structures).
4. **Runtime Initializers**: Unlike module-scope variables (such as private or workgroup variables), local variables can be initialized using any runtime-stage expression, including function parameters, dynamic mathematics, or other variable states.
5. **Thread-Isolation**: Each executing shader thread (invocation) has its own separate instance of local variables. Modifying a local variable in one thread has no effect on any other executing thread.
6. **Evaluation Stage**: Accessing or utilizing a local variable always produces a runtime-stage expression.

---

## Reference Examples

The following example demonstrates explicit, implicit, and inferred local variable declarations within a function body:

```wgsl
fn perform_calculations(base_value: f32) -> f32 {
    // 1. Explicit address space with zero-initialization
    var<function> accumulator: f32; // Value is 0.0

    // 2. Omitted address space with type inference
    var scale_factor = 2.5; // Type is inferred as f32

    // 3. Runtime-expression initialization
    var initial_product: f32 = base_value * scale_factor;

    // Mutating variables
    accumulator = initial_product + 10.0;
    accumulator = accumulator * 2.0;

    return accumulator;
}
```