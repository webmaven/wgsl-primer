---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Atomic Types'
shader: ./atomic-types.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "run_atomic_test()", "type": "i32"}]}'
---

To use atomic operations in WGSL, you must declare your variables with a dedicated atomic type. This ensures that the WGSL compiler and the underlying GPU hardware can guarantee safe, coordinated memory access.

---

## Declaring Atomic Types

An atomic type is defined as <code>atomic&lt;<span class="template template-atomic-t">T</span>&gt;</code>, where the underlying type <span class="template template-atomic-t">T</span> is restricted to 32-bit integers:

* **`u32`** (unsigned 32-bit integer)
* **`i32`** (signed 32-bit integer)


!!! info "Why Only 32-Bit Integers?"
    GPU hardware execution units are highly optimized for integer mathematics at a 32-bit register width. Standard GPU memory sub-systems and ALU pipelines feature dedicated hardware support specifically for 32-bit atomic operations, while float atomics or 64-bit integer atomics are either unsupported or significantly slower depending on the target hardware.

---

## Address Space Constraints

An atomic variable can **only** be declared inside two specific address spaces:

1. **`workgroup`**: Shared memory within a single local workgroup.
2. **`storage`** (with `read_write` access mode): Global GPU memory shared across all workgroups.


```wgsl
var<workgroup> secure_counter: atomic<u32>;
@group(0) @binding(0) var<storage, read_write> global_accumulator: atomic<i32>;
```

!!! important "Why Are Other Address Spaces Prohibited?"
    The compiler strictly prevents atomic declarations in other address spaces for hardware and logical reasons:

    * **`uniform`**: Uniform buffers are read-only at the hardware level. Since writes are physically impossible, concurrency conflicts cannot occur.
    * **`private` & `function`**: These variables reside in thread-local registers or stack memory. Because they are strictly private to a *single thread*, concurrent access is impossible and atomics are redundant.

---

## The Compile-Time Shield: Non-Constructibility

Atomic types are **not constructible**. This is a powerful safety feature in the WGSL type system. Because they are not constructible, you **cannot** use them directly:

* In expressions (e.g., `let x = secure_counter;` is a compile error).
* With standard math or assignment operators (e.g., `secure_counter += 1;` or `secure_counter = 0;` are compile errors).
* As function arguments or return values directly.
* In initializers or custom structure constructors.


By blocking normal operators, the WGSL compiler prevents you from accidentally bypassing the dedicated hardware atomic execution paths.

### Reading and Writing with Pointers

To interact with an atomic variable, you must pass its **pointer** (`&`) to dedicated **atomic built-in functions**.

Because standard assignments are forbidden, you must use **`atomicLoad`** to read the value and **`atomicStore`** to write a new value:

```wgsl
fn safe_access() {
  // Read safely using a pointer
  let current_val = atomicLoad(&secure_counter);

  // Write safely using a pointer
  atomicStore(&secure_counter, current_val + 5u);
}
```
