---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: "Variables Overview"
---
In WGSL, variables, constants, and resources are declared using specific keywords (`let`, `const`, `override`, `var`) combined with **address spaces** and **access modes**. 

These declarations define where the underlying data resides in GPU memory, its mutability, its access permissions, and its execution scope.

---

## Storage Spaces, Declarations, & Lifetimes

The following table provides a reference for all declaration types and memory spaces in WGSL:

| Declaration & Space | Scope | Mutability | Primary Use Case |
| :--- | :--- | :--- | :--- |
| [`const`](const.md) | Module or Function | Strictly Immutable (Compile-Time) | Mathematical constants, compile-time configurations, and static assertions. |
| [`let`](let.md) | Function Block | Strictly Immutable (Runtime) | Local registers, block-scoped naming of intermediate runtime calculations. |
| [`override`](override.md) | Module (Global) | Pipeline-Creation Constant | Host-configurable parameters (e.g., thread counts) overridden during pipeline setup. |
| [`var<function>`](var-function.md) | Function Block | Mutable | Standard local thread-private storage allocated on the GPU register/stack. |
| [`var<private>`](var-private.md) | Module (Global) | Mutable (Thread-Private) | Global variables unique to each invocation; persists across nested function calls. |
| [`var<workgroup>`](var-workgroup.md) | Module (Global) | Mutable (Workgroup-Shared) | High-speed on-chip shared memory (SRAM) shared among threads in a single workgroup. |
| [`var<uniform>`](var-uniform.md) | Module (Global) | Read-Only (Host-Bound) | High-speed cached read-only buffers (e.g., camera matrices or material parameters). |
| [`var<storage>`](var-storage.md) | Module (Global) | Read-Only / Read-Write (Host-Bound) | High-capacity buffer arrays (e.g., particle data, scene hierarchies, or compute outputs). |
| [Handle Variables](var-handle.md) | Module (Global) | Opaque Reference (Host-Bound) | Opaque system handles representing GPU-allocated textures and samplers. |

---

## Conceptual Categories

Declarations are divided into three main conceptual areas:

### 1. Constant Bindings
Compile-time and pipeline-time declarations that cannot be re-assigned during shader execution:
*   **[`const`](const.md)**: Zero runtime overhead, evaluated entirely by the compiler.
*   **[`let`](let.md)**: Local, block-scoped runtime-constant references.
*   **[`override`](override.md)**: Host-configurable shader parameters.

### 2. Thread-Local & Cooperative Memory
Memory allocations located on-chip, managed directly by executing threads:
*   **[Local Variables](var-function.md)**: Standard mutable local storage.
*   **[Private Variables](var-private.md)**: Global module-scope variables that are thread-private.
*   **[Workgroup Variables](var-workgroup.md)**: Shared workgroup memory.
*   **[Thread Coordinates](thread-coordinates.md)**: Locate and coordinate executions in a compute grid.
*   **[Barriers & Synchronization](memory-barriers.md)**: Control thread execution flow and memory visibility.

### 3. Host-Bound Resource Bindings
Variables representing buffers, textures, and memory units bound from the JavaScript host application:
*   **[Uniform Variables](var-uniform.md)**: Read-only, highly cached GPU buffers.
*   **[Storage Variables](var-storage.md)**: Large read/write GPU buffers.
*   **[Handle Variables](var-handle.md)**: Textures and samplers.

---

## Name Resolution & Scopes

*   **[Name Shadowing](shadowing.md)**: Rules governing identifier scopes, nested blocks, and shadowing in WGSL.