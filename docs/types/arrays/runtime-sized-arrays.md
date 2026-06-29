---
title: 'Runtime-Sized Arrays'
shader: ./runtime-sized-arrays.wgsl
visualizer: /ts/buffer_viewer.ts
visualizerOptions: '{"length": 8, "datatype": "f32"}'
---

A runtime-sized array is declared as <code>array&lt;<span class="template template-array-t">T</span>&gt;</code>, where the element count is determined dynamically at runtime based on the actual size of the WebGPU buffer allocated by the host application.

Because their size is not fixed at compile-time, runtime-sized arrays have unique constraints and specialized use cases in WGSL.

---

## Storage Space Constraint

Runtime-sized arrays cannot be used as local variables, uniform variables, or function arguments. They are allowed **exclusively** within the `storage` address space:

- They can cover the entire storage buffer directly.
- Alternatively, they can be placed as the **last member** of a `struct` describing the storage buffer. Placing the array at the end of a structure allows the preceding fields to have statically known, fixed offsets, while the array utilizes all remaining buffer capacity.

```wgsl
struct LightData {
    mean_intensity: f32,
    // The runtime-sized array must be the last member of the struct.
    points: array<vec3f>,
}
```

---

## Querying Array Size with `arrayLength`

To determine how many elements fit inside the bound storage buffer during execution, WGSL provides the `arrayLength` builtin function. 

- `arrayLength` accepts a **pointer** to the runtime-sized array (using the reference operator `&`).
- It returns an unsigned 32-bit integer (`u32`) representing the actual element count.

```wgsl
// Querying the size of a standalone runtime-sized array
let count = arrayLength(&input_data);
```

---

## Copying and Value Passing Restrictions

Since their size is not statically known to the compiler, runtime-sized arrays cannot be copied or assigned on the GPU:

- You cannot assign a runtime-sized array to a variable (e.g., `let copy = input_data;` is a compile error).
- You cannot pass a runtime-sized array as a value to a function.
- You cannot return a runtime-sized array from a function.
- You **can** index into them to extract individual element values, and you can pass a reference/pointer to individual elements to functions.
