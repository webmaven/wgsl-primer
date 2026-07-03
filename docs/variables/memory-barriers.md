---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: "Barriers & Memory Synchronization"
shader: ./memory-barriers.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "sync_status.has_raced", "type": "u32"},
    {"expr": "sync_status.barrier_passed", "type": "u32"}
]}'
---

In a GPGPU compute shader, thousands of threads execute concurrently. When these threads cooperate using shared memory (like `var<workgroup>`), we need a way to synchronize them to avoid data races and corruption.

WGSL provides **barriers** to synchronize threads within the same workgroup.

### Execution vs. Memory Synchronization

A barrier performs two critical tasks:

1. **Execution Synchronization (Control Barrier)**: It blocks execution of any thread in the workgroup until _every_ thread in that workgroup has reached the barrier. This ensures all threads are aligned in time before proceeding.
2. **Memory Synchronization (Memory Barrier)**: It ensures that all memory reads/writes performed by any thread before hitting the barrier are completed and made fully visible to all other threads in the workgroup.

### WGSL Synchronization Built-ins

There are two primary barrier functions in WGSL:

#### `workgroupBarrier()`

This function synchronizes all threads within the local workgroup. It forces all threads to wait, and flushes all `var<workgroup>` memory operations to ensure visibility.

```wgsl
workgroup_shared_array[local_idx] = input_array[global_idx];
workgroupBarrier(); // Sync: wait for all threads to write to the workgroup array
let left_neighbor = workgroup_shared_array[(local_idx + 1u) % 64u];
```

#### `storageBarrier()`

This function is similar to `workgroupBarrier()`, but it specifically flushes reads and writes to **storage buffers** (`var<storage, read_write>`), ensuring visibility of storage memory accesses across threads in the workgroup.

!!! important
    **Barrier Constraints**: Barriers can _only_ be called in compute shaders and _only_ within uniform control flow (meaning all threads in the workgroup must execute the barrier. Calling a barrier inside an `if` statement where some threads execute it and others do not leads to **undefined behavior** or **deadlocks**!).

!!! tip "Atomics vs. Barriers"
    While memory barriers synchronize execution and memory visibility across *multiple* variables inside a workgroup, you can also perform safe, indivisible operations on *individual* 32-bit integers using **Atomics**. Refer to the [Atomics](../types/atomics/index.md) section.

### Simulating Synchronization

In the shader code on the right, we show how thread coordination and safety flags are tracked. The visualizer outputs the status.
