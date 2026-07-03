---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Uniform Buffers'
---
Uniform buffers in WGSL are used to store read-only data that can be accessed efficiently by any shader stage. They are typically used for data that remains constant across an entire draw or dispatch call, such as transformation matrices, lighting parameters, camera positions, or system settings.

### Declaring Uniform Variables

Uniform variables reside in the `uniform` address space.

**Syntax:**

```wgsl
var<uniform> u: T;
```

- `T` must be a **host-shareable** type, typically a structure.
- **No Access Modes**: Unlike `storage` variables, you **cannot** specify an access mode (e.g., `read`) for uniform variables. Writing `var<uniform, read>` is a WGSL syntax error. Uniform buffers are implicitly read-only.
- **Strict Alignment**: WebGPU requires strict alignment for uniform buffers. The type `T` must align to 16 bytes on the host side, and nested structures or arrays must be padded accordingly.

---

## Example: Declaring and Binding a Uniform Buffer

This complete example shows how a uniform buffer is defined in WGSL and mapped to JavaScript on the host side.

<details class='example'>
<summary>Example</summary>

**WGSL Code:**

```wgsl
struct MyUniformBufferType {
    modelMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> myUniformBuffer: MyUniformBufferType;
```

**JavaScript Code:**

```javascript
// Define the uniform buffer data
const modelMatrix = new Float32Array([
  1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
]);

const viewMatrix = new Float32Array([
  1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
]);

const projectionMatrix = new Float32Array([
  1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
]);

const uniformData = new Float32Array([...modelMatrix, ...viewMatrix, ...projectionMatrix]);

// Create the uniform buffer
const uniformBuffer = device.createBuffer({
  size: uniformData.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// Write data to the uniform buffer
device.queue.writeBuffer(uniformBuffer, 0, uniformData);

// Create the bind group layout
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: {
        type: 'uniform',
      },
    },
  ],
});

// Create the bind group
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: {
        buffer: uniformBuffer,
      },
    },
  ],
});
```

</details>

---

## Technical Considerations

- **Size Limits**: Uniform buffers are optimized for low-latency, cached access, but they are limited in size. By default, WebGPU guarantees a maximum uniform buffer size of **16 KB** (though individual GPUs may support more). For larger datasets, use storage buffers.
- **Layout Constraints**: Because of hardware performance optimizations, types within uniform buffers have strict alignment rules:
  - Structure members are aligned based on their type's alignment requirements.
  - Uniform matrices (like `mat4x4<f32>`) require each column to be aligned to 16 bytes.
  - Arrays inside uniform buffers (using the <code>array&lt;<span class="template template-array-t">T</span>, <span class="template template-array-n">N</span>&gt;</code> syntax) must have an element stride that is a multiple of 16 bytes.