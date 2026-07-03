---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Storage Variables'
---
Storage variables represent regions of GPU memory that are backed by **storage buffers**. They are typically used for sharing large quantities of structured data between the host application (JavaScript) and the GPU, and are the only buffer types in WGSL that support both **reading and writing** inside the shader.

---

## Declaring Storage Variables

Storage variables must be declared in the **global scope** (outside of any functions) and must specify the `storage` address space.

**Syntax:**

```wgsl
@group(group_index) @binding(binding_index) var<storage, access_mode> name: Type;
```

- **Address Space**: `storage` is required.
- **Access Mode** (optional):
  - `read`: The shader can only read from the buffer (implicit default if omitted).
  - `read_write`: The shader can both read from and write to the buffer.
  - _Note: Pure `write` is not a valid access mode for storage buffers._
- **Type**: Must be a **host-shareable** structure type.

### Examples

<details class='example'>
<summary>Example</summary>

```wgsl
struct MyData {
    values: array<f32>,
};

// Declaring a read-only storage buffer (implicitly)
@group(0) @binding(0) var<storage> readOnlyBuffer: MyData;

// Declaring a read-write storage buffer (explicitly)
@group(0) @binding(1) var<storage, read_write> readWriteBuffer: MyData;
```

</details>

---

## Important Rules & Restrictions

1. **Host-Shareable Store Type**: The store type of a storage variable must be **host-shareable**. Although wrapping your storage buffers in **structures** is the standard idiom in WGSL, you can also bind arrays (e.g., `array<vec4<f32>>`) or individual scalar types directly, as long as they follow alignment and layout rules.
2. **Runtime-Sized Arrays**: A storage buffer is the only place in WGSL where you can declare a runtime-sized array (e.g., `array<f32>`). If used, it **must** be the last member of the structure.
3. **No Local Declarations**: You cannot declare storage variables inside a function.
4. **Coherent Memory Access**: Multiple shader invocations can read and write to storage variables concurrently. To prevent race conditions, use appropriate synchronizations (like barriers) or atomic types.

---

## Example: Modifying Data in a Compute Shader

The following compute shader takes an array of floating-point values and scales them by 2.0 in-place:

<details class='example'>
<summary>Example</summary>

```wgsl
struct NumberArray {
    data: array<f32>,
};

@group(0) @binding(0) var<storage, read_write> numbers: NumberArray;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;

    // Read, modify, and write back to the storage buffer
    numbers.data[index] = numbers.data[index] * 2.0;
}
```

</details>

---

## Summary

- **Read and Write**: Storage variables reside in the `storage` address space and are the primary way shaders write large datasets back to the host.
- **Access Modes**: Supported access modes are `read` and `read_write`. Pure `write` is invalid.
- **Structure and Padding**: Storage buffer types must be structure types and conform to host-alignment layout specifications.
- **Host Setup**: For detailed instructions on how to create, fill, and map storage buffers on the host in JavaScript, see [Binding Points -> Storage Buffers](../binding-points/storage-buffers.md).