---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Handle Variables'
---
In WGSL, variables that refer to opaque resources like **textures** and **samplers** are conceptually part of the `handle` address space.

However, there is a major syntax rule in WGSL regarding handles:

!!! warning
    **Do not write `var<handle>`!**

    While textures and samplers live in the `handle` address space, the `handle` address space keyword **is not a valid token** in variable declarations. Including the brackets `<handle>` is a compilation syntax error. Instead, handle variables are declared simply using `var` with no address space.

---

## Declaring Handle Variables

Handle variables are defined at the **global scope** (module-scope). They represent resources bound from the host application using `@group` and `@binding` attributes.

**Syntax:**

```wgsl
@group(group_index) @binding(binding_index) var name: ResourceType;
```

### Examples

<details class='example'>
<summary>Example</summary>

```wgsl
@group(0) @binding(0) var myTexture: texture_2d<f32>; // Correct! Simple 'var'
@group(0) @binding(1) var mySampler: sampler;         // Correct! Simple 'var'
```

</details>

---

## Opaque Handles and Address Space Rules

The `handle` address space is highly unique compared to other address spaces (like `function`, `uniform`, or `storage`):

1. **Opaque Types**: You cannot construct or modify a handle variable directly inside a shader. They are read-only references representing pre-allocated resources on the GPU.
2. **Implicit Access Mode**: Handles are implicitly managed by built-in sampling and read/write instructions (like `textureSample` or `textureLoad`).
3. **No Pointers**: Unlike variables in the `private` or `workgroup` spaces, you cannot take the address of a handle (i.e., you cannot use the address-of operator `&myTexture` or declare a pointer <code>ptr&lt;handle, ...&gt;</code>).

---

## Example: Sampling a Texture

Here is a simple, correct fragment shader demonstrating the use of textures and samplers:

<details class='example'>
<summary>Example</summary>

```wgsl
@group(0) @binding(0) var myTexture: texture_2d<f32>;
@group(0) @binding(1) var mySampler: sampler;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    // Sample the color from the texture at coordinates uv
    let texColor: vec4<f32> = textureSample(myTexture, mySampler, uv);
    return texColor;
}
```

</details>

---

## Summary

- **No Brackets**: Textures and samplers reside in the `handle` address space but are declared simply as `var name: type;`. Do not write `<handle>`.
- **Global Only**: Handle variables must be declared in the global scope of the shader.
- **Opaque & Immutable**: Handles represent resources allocated and configured via the WebGPU host API, which are accessed using built-in WGSL functions.
- **Further Reading**: For information on how to configure and bind these textures on the host side in JavaScript, check out [Binding Points -> Textures](../binding-points/textures.md).