---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Uniform Variables'
---
Uniform variables are module-scoped variables that reside in the `uniform` address space. They represent regions of read-only GPU memory backed by **uniform buffers**, which are highly optimized for fast, low-latency, and cached access by all shader stages.

Uniform buffers are perfect for data that is shared across many shader invocations and doesn't change within a draw or dispatch call (e.g., camera matrices, lighting parameters, and viewport dimensions).

---

## Declaring Uniform Variables

Uniform variables must be declared in the **global scope** and require specifying the `uniform` address space.

**Syntax:**

```wgsl
@group(group_index) @binding(binding_index) var<uniform> name: Type;
```

- **Address Space**: `<uniform>` is required.
- **No Access Modes**: Writing `var<uniform, read>` is a syntax error. Uniform variables are implicitly and strictly read-only.
- **Type**: Must be a **host-shareable** structure type.

### Example

<details class='example'>
<summary>Example</summary>

```wgsl
struct CameraTransforms {
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> camera: CameraTransforms;
```

</details>

---

## Language Rules & Alignment Constraints

To achieve low-latency caching, WebGPU hardware enforces strict alignment constraints on uniform buffer variables:

1. **Host-Shareable Store Type**: The store type of a uniform variable must be **host-shareable**. While wrapping uniform parameters inside a **structure** is the most common and highly recommended practice (especially for managing layout, padding, and alignment on the host), you can also bind individual scalar types (e.g. `f32`), vectors, matrices, or fixed-size arrays directly.
2. **16-Byte Alignment**: Structures inside the `uniform` address space must have their members aligned to multiples of 16 bytes.
   - E.g., types like `vec3<f32>` and matrices like `mat4x4<f32>` have an alignment of 16 bytes. If you have a `vec3<f32>` followed by an `f32`, the compiler forces padding to align subsequent elements to 16 bytes.
3. **No Runtime Arrays**: Uniform buffers must have a fixed, statically-known size at compile time. You **cannot** use runtime-sized arrays (`array<f32>`) in uniform variables.
4. **Size Restrictions**: Uniform buffers are limited in size. By default, WebGPU guarantees support for uniform buffers of up to **16 KB** per buffer. For larger datasets, use storage buffers.

---

## Example: Accessing Uniforms in a Vertex Shader

The following vertex shader accesses a uniform camera struct to transform input positions into clip-space:

<details class='example'>
<summary>Example</summary>

```wgsl
struct CameraTransforms {
    modelMatrix: mat4x4<f32>,
    viewProjMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> camera: CameraTransforms;

@vertex
fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
    // Access members of the uniform variable using dot syntax
    let worldPosition = camera.modelMatrix * vec4<f32>(position, 1.0);
    return camera.viewProjMatrix * worldPosition;
}
```

</details>

---

## Summary

- **Read-Only**: Uniform variables represent read-only constant parameters optimized for uniform, low-latency access.
- **Brackets `<uniform>`**: Declared with explicit `<uniform>` brackets, but do not specify any access mode.
- **16-Byte Layout Rules**: All types within a uniform variable must conform to rigid host-sharing alignment and padding constraints.
- **Host Setup**: For instructions on creating and binding uniform buffers on the host in JavaScript, see [Binding Points -> Uniform Buffers](../binding-points/uniform-buffers.md).