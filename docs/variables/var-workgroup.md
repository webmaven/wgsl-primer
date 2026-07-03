---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: "Workgroup Variables"
shader: ./var-workgroup.wgsl
visualizer: /ts/workgroup_visualizer.ts
---
Workgroup variables are mutable storage locations declared at the **module scope** (outside of any function body) that reside in the `workgroup` address space. 

This variables space allocates on-chip shared memory (SRAM) that is shared among all concurrent threads (invocations) within a single executing **workgroup**.

---

## Syntax & Sharing Model

A workgroup variable is declared using the `var` keyword and must explicitly specify the `workgroup` address space:

<code>var&lt;<span class="template template-ptr-as">workgroup</span>&gt; <span class="template">name</span>: <span class="template">Type</span>;</code>

---

## Technical Constraints & Rules

1. **Shared Workspace**: Unlike private or local variables, workgroup variables are cooperative. All threads within the same workgroup read and write to the same shared memory allocations. However, separate workgroups are isolated; a thread in workgroup \(A\) cannot access or modify the workgroup variables of workgroup \(B\).
2. **Strictly Module-Scoped**: Workgroup variables must be declared at the top-level (module scope) of the shader. They cannot be declared inside a function body.
3. **No Initializer Expressions**: A workgroup variable **must** specify an explicit type and **cannot** have an initializer expression (e.g., `var<workgroup> data: i32 = 0;` is a compile error).
4. **Automatic Zero-Initialization**: The WebGPU driver automatically zero-initializes all workgroup-space allocations before any shader thread inside that workgroup starts executing.
5. **Memory Sizing Constraints**: Workgroup shared memory resides on high-speed, on-chip SRAM, which is highly finite. The WebGPU standard guarantees a minimum limit of **16 KB** of workgroup storage space per pipeline. Exceeding this limit causes compile-time or pipeline-creation errors.
6. **Data Races & Synchronization**: Because threads within a workgroup execute concurrently, unregulated concurrent reads and writes to a workgroup variable lead to data races. Developers must coordinate memory accesses using:
   *   **`workgroupBarrier()`**: A execution and memory synchronization barrier that forces all threads in the workgroup to pause until every thread reaches the barrier, while ensuring that all preceding memory writes are fully visible to all subsequent reads.
   *   **Atomic Types (`atomic<T>`)**: Atomic operations provide lock-free, race-free updates to shared variables.
7. **Configurable Array Sizing with Overrides**: Although workgroup variables cannot have initializers, you can size a fixed-size array in the `workgroup` address space using an `override` constant (e.g., `var<workgroup> local_cache: array<f32, blockSize>`). This allows you to customize and tune the shared memory allocation size dynamically at pipeline-creation time.

---

## Reference Examples

The following example demonstrates a common GPGPU optimization pattern: threads in a workgroup cooperatively load data from a global storage buffer into a high-speed local workgroup cache, synchronize, and then read safely from the cache:

```wgsl
struct InputBuffer {
    numbers: array<f32, 256>,
}

@group(0) @binding(0) var<storage, read> global_input: InputBuffer;
@group(0) @binding(1) var<storage, read_write> global_output: InputBuffer;

// Allocating a shared cache for 256 elements in workgroup space
var<workgroup> local_cache: array<f32, 256>;

@compute @workgroup_size(256)
fn main(
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(global_invocation_id) global_id: vec3<u32>
) {
    let index = local_id.x;

    // 1. Cooperatively load data from slow global storage into fast workgroup SRAM
    local_cache[index] = global_input.numbers[index];

    // 2. Synchronize: Wait for ALL threads in the workgroup to finish loading
    workgroupBarrier();

    // 3. Safe access: Every thread can now read from any element in the local cache
    // Perform a simple 3-tap local moving average filter
    var average: f32 = 0.0;
    if (index > 0u && index < 255u) {
        average = (local_cache[index - 1u] + local_cache[index] + local_cache[index + 1u]) / 3.0;
    } else {
        average = local_cache[index];
    }

    // Write the results back to the global output buffer
    global_output.numbers[index] = average;
}
```