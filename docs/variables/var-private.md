---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: "Private Variables"
shader: ./var-private.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "f()", "type": "i32"}]}'
---
Private variables are mutable storage locations declared at the **module scope** (outside of any function body). They reside in the `private` address space, meaning they are visible to all functions within the shader module but are strictly isolated to each executing thread (invocation).

---

## Syntax & Visibility

A private variable is declared using the `var` keyword and must explicitly specify the `private` address space:

<code>var&lt;<span class="template template-ptr-as">private</span>&gt; <span class="template">name</span>: <span class="template">Type</span>;</code>  
<code>var&lt;<span class="template template-ptr-as">private</span>&gt; <span class="template">name</span> = <span class="template">initializer</span>;</code>  
<code>var&lt;<span class="template template-ptr-as">private</span>&gt; <span class="template">name</span>: <span class="template">Type</span> = <span class="template">initializer</span>;</code>

---

## Technical Constraints & Rules

1. **Module-Scoped Visibility**: Private variables must be declared at the top-level (module scope) of the shader. They cannot be declared inside function blocks. Once declared, any function within the same shader module can read or write to them.
2. **Thread Isolation**: Despite being declared at module scope, private variables are *not* shared between GPU threads. Each executing invocation (thread) receives its own dedicated, private instance of the variable.
3. **Persistent Lifetime**: A private variable's lifetime spans the entire execution of a single shader invocation. This allows it to persist and store mutable state across multiple nested function calls within the same thread.
4. **Compile-Time or Pipeline-Creation Initializers**: If an initializer is provided, it **must** be either a [constant-expression](../expressions/evaluation-stage/constant/index.md) or an [override-expression](../expressions/evaluation-stage/override/index.md). Runtime expressions (such as parameters, texture lookups, or runtime variable calculations) are prohibited. This means you can initialize a private variable using a value customized during pipeline creation in JavaScript.
5. **Zero-Initialization**: If the initializer is omitted, the compiler automatically zero-initializes the variable based on its underlying type (e.g., `0` for numeric values, `false` for booleans).
6. **Evaluation Stage**: Accessing or referencing a private variable always results in a runtime-stage expression.

---

## Reference Examples

The following example demonstrates declaring a private module-scoped accumulator and mutating it across multiple helper functions during a single thread's execution:

```wgsl
// Declaring a mutable, thread-private variable at module scope
var<private> invocation_counter: u32 = 0u;

// Helper function to increment the counter
fn increment_counter() {
    invocation_counter = invocation_counter + 1u;
}

// Another helper function to multiply the counter
fn scale_counter(factor: u32) {
    invocation_counter = invocation_counter * factor;
}

@fragment
fn main() -> @location(0) vec4<f32> {
    // Initial state: invocation_counter is 0u
    increment_counter(); // State is now 1u
    increment_counter(); // State is now 2u
    scale_counter(3u);    // State is now 6u

    // Convert the local private counter to a color channel
    let red_intensity = f32(invocation_counter) / 10.0;
    return vec4<f32>(red_intensity, 0.0, 0.0, 1.0);
}
```