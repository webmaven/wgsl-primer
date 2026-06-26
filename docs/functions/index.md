---
title: 'Functions'
---

# Functions Overview

Functions in WGSL are named, reusable subroutines that group a series of statements to perform specific tasks. Because shaders operate in a highly parallel execution environment, WGSL functions are designed for high efficiency and predictable execution.

---

### The GPU Execution Model

Shaders are executed on the GPU across thousands of concurrent threads (or [invocations](../uniformity-analysis/invocations.md)). To ensure maximum hardware performance, WGSL functions are built under specific rules:

*   **Compiler Inlining**: User-defined functions have virtually zero execution overhead. The GPU compiler almost always performs *inline expansion* (replacing function calls directly with the function's body code) to avoid the overhead of traditional call-stack allocations.
*   **No Dynamic Dispatch**: Function calls are resolved statically at compile time.
*   **Predictable Performance**: These compile-time decisions ensure that your shader execution paths remain highly optimized and uniform.

---

### Section Contents

This section covers the core mechanics of writing and calling functions in WGSL:

- **[Syntax](syntax.md)**: Declaring functions using the `fn` keyword, specifying input parameters, defining return types, and applying strict typing.
- **[Function Calls & Recursion](calls.md)**: Function invocation mechanics, copy-on-pass parameter behavior, and the structural hardware constraints that prohibit recursion.
- **[Pipeline Entry Points](entry-points.md)**: Special entry point stages annotated with `@vertex`, `@fragment`, or `@compute` that serve as interface boundaries with the WebGPU API.
- **[Must Use Attributes](must-use.md)**: Safety-critical compiler guarantees using the `@must_use` attribute to prevent silently discarding evaluation results.


