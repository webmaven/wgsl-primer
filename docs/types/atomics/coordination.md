---
title: "Atomics & Coordination"
shader: ./coordination.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "atomic_results.raced_sum", "type": "u32"},
    {"expr": "atomic_results.atomic_sum", "type": "u32"}
]}'
---

When multiple threads concurrently read, modify, and write back to the same memory location, ordinary variables suffer from **race conditions** and data corruption.

For example, if two threads attempt to increment a variable starting at `0` at the same time:

1. Thread A reads `0`.
2. Thread B reads `0`.
3. Thread A computes `0 + 1 = 1` and writes `1`.
4. Thread B computes `0 + 1 = 1` and writes `1`.

Instead of the correct sum `2`, the final value is corrupted to `1`.

### Avoiding Corruption with Hardware Serialization

**Atomics** solve this coordination problem by performing the entire Read-Modify-Write (RMW) cycle as a single, indivisible hardware operation. The GPU guarantees that overlapping requests are serialized—executed one after another—ensuring no updates are lost.

### WGSL Atomic Built-in Functions

To manipulate atomic variables (`atomic<u32>` or `atomic<i32>`), you must pass their pointers to WGSL atomic built-in functions:

- **`atomicAdd(ptr, value)`**: Safely adds `value` to the variable, returning its _old_ value.
- **`atomicSub(ptr, value)`**: Safely subtracts `value`.
- **`atomicMin(ptr, value)`** / **`atomicMax(ptr, value)`**: Computes minimum or maximum.
- **`atomicAnd(ptr, value)`** / **`atomicOr(ptr, value)`** / **`atomicXor(ptr, value)`**: Bitwise operations.
- **`atomicExchange(ptr, value)`**: Writes `value` and returns the old value.
- **`atomicCompareExchangeWeak(ptr, compare, value)`**: If the variable matches `compare`, overwrites with `value`. Returns a structure containing the old value and a boolean success flag.

### Coordination Demo

In the shader code on the right, we define a simulation where 1000 threads attempt concurrent increments. We see the race condition result vs. the safe atomic result!
