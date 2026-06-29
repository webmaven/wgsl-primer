---
title: "Atomic Operations"
shader: ./atomic-operations.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "ops_results.initial_val", "type": "u32"},
    {"expr": "ops_results.after_add", "type": "u32"},
    {"expr": "ops_results.after_cas_mul", "type": "u32"}
]}'
---

# Atomic Operations

Having declared atomic variables, we manipulate them using WGSL's built-in atomic functions. These functions bypass standard CPU/GPU caching hazards to interact directly with physical memory, guaranteeing serialized execution.

---

## 1. Primary Accessors

To perform basic reads or writes on an atomic variable without modifying it mathematically, you must use the standard load and store built-ins:

* **`atomicLoad(ptr)`**: Safely reads and returns the current value of the atomic variable.
* **`atomicStore(ptr, value)`**: Safely writes `value` into the atomic variable, overwriting the previous value. No value is returned.

---

## 2. Read-Modify-Write (RMW) Operations

These functions perform an arithmetic or bitwise operation on the memory location as a single, indivisible hardware transaction:

* **`atomicAdd(ptr, value)`**: Safely adds `value` to the variable.
* **`atomicSub(ptr, value)`**: Safely subtracts `value` from the variable.
* **`atomicMin(ptr, value)`** / **`atomicMax(ptr, value)`**: Computes the minimum or maximum between `value` and the current variable.
* **`atomicAnd(ptr, value)`** / **`atomicOr(ptr, value)`** / **`atomicXor(ptr, value)`**: Performs a bitwise AND, OR, or XOR on the variable.
* **`atomicExchange(ptr, value)`**: Writes `value` to the variable, replacing the current value.

### The Power of the "Old Value"

A crucial detail of all RMW functions is that **they return the variable's value *before* the operation occurred**.

This old value is highly valuable for multi-threaded coordination. For example, if multiple threads are writing to a shared append-only array, they can use `atomicAdd` to reserve a unique index (slot) in the array safely:

```wgsl
// Reserving a safe, unique index in a shared array
let write_index = atomicAdd(&shared_queue_counter, 1u);
shared_array[write_index] = thread_computed_result;
```

Even if hundreds of threads execute this block concurrently, each thread is guaranteed to receive a unique, un-overlapped `write_index`.

---

## 3. Advanced Coordination: Compare-and-Swap

For advanced lock-free algorithms, WGSL provides **`atomicCompareExchangeWeak`**, which is the fundamental block for Compare-and-Swap (CAS) routines:

* **`atomicCompareExchangeWeak(ptr, compare, value)`**: 
    If the current value at `ptr` is equal to `compare`, it is overwritten with `value`. 
    
    It returns a pre-defined structure containing two fields:

    * **`old_value`**: The value of the atomic variable before the operation.
    * **`exchanged`**: A `bool` indicating whether the exchange occurred (`true` if `old_value == compare`, `false` otherwise).


### Implementing a CAS Loop

Because WGSL does not natively support operations like atomic multiplication or atomic floating-point additions, you can implement them yourself using a CAS retry loop. The loop continuously reads the old value, computes the desired update, and attempts a compare-exchange until it succeeds:

```wgsl
// Example: Safe atomic multiplication by 2
var<workgroup> my_atomic: atomic<u32>;

fn atomic_multiply_by_two() {
  var old = atomicLoad(&my_atomic);
  loop {
    let new_val = old * 2u;
    let res = atomicCompareExchangeWeak(&my_atomic, old, new_val);
    
    // If successful, the exchange occurred and we are done!
    if res.exchanged {
      break;
    }
    
    // If unsuccessful, another thread modified my_atomic first.
    // Update old with the actual current value and retry.
    old = res.old_value;
  }
}
```

---

!!! note "Multi-Variable Memory Barriers"
    Remember that atomic operations only serialize and coordinate updates for a **single** memory location. If you need to ensure that non-atomic writes are visible to other threads, or coordinate multi-variable structures, you must combine atomics with execution or memory barriers. Learn more in the [Barriers & Memory Synchronization](../../variables/memory-barriers.md) section.

---

## Live Operations Demonstration

The simulation on the right displays the results of running sequential atomic operations:

* **Initial Value (`initial_val`)**: The counter is initialized safely to \(10\) via `atomicStore(&my_atomic, 10u)`.
* **After Addition (`after_add`)**: We add \(5\) safely using `atomicAdd(&my_atomic, 5u)`. This returns the old value (\(10\)) and sets the new value to \(15\).
* **After CAS Multiplication (`after_cas_mul`)**: We multiply by \(2\) using our custom Compare-and-Swap retry loop, resulting in a final value of \(30\).

This demonstrates how standard reads, writes, and complex lock-free custom logic (like multiplication) are executed safely and reliably on the GPU.
