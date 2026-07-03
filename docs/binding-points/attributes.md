---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Attributes'
---
WebGPU Shading Language (WGSL) uses attributes to attach metadata to declarations. Attributes provide essential instructions to the compiler, link resources to WebGPU API host handles, and coordinate inputs/outputs between pipeline stages. 

Attributes are specified using the `@` symbol followed by the attribute name and any necessary parameters, such as `@group(0)`.

---

## 1. Resource Binding Attributes

Resource binding attributes connect WGSL variables to CPU-side WebGPU API resources (like buffers, textures, and samplers).

### `@group` and `@binding`

Every resource declaration at module scope must be annotated with both `@group` and `@binding`.

- **`@group(G)`**: Specifies the bind group index (logical collection of resources bound together).
- **`@binding(B)`**: Specifies the binding slot index within that specific bind group.

Together, they form a unique coordinate `(group, binding)` for each resource.

```wgsl
@group(0) @binding(0) var<uniform> myUniformBuffer: MyUniformBufferType;
@group(0) @binding(1) var<storage, read_write> myStorageBuffer: MyStorageBufferType;
```

---

### JavaScript to WGSL Mapping

To use resources in your shader, you must define matching layouts and bind groups on the host side in JavaScript.

#### Example 1: Binding a Uniform Buffer

This example binds a read-only uniform buffer containing matrices.

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

```js
// 1. Create the uniform buffer on the GPU
const uniformBuffer = device.createBuffer({
  size: 192, // 3 matrices * 64 bytes each
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// 2. Create the bind group layout
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: { type: 'uniform' },
    },
  ],
});

// 3. Bind the resource
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: { buffer: uniformBuffer },
    },
  ],
});
```

</details>

---

#### Example 2: Multiple Resources (Uniform + Storage Buffer)

This example combines a uniform configuration buffer and a read-write storage buffer within a single bind group.

!!! important "Shader Stage Validation"
    In WebGPU, read-write storage buffers (`var<storage, read_write>`) are **strictly prohibited** in the vertex shader stage. Therefore, their bindings must be visible only to the `COMPUTE` or `FRAGMENT` stages.

<details class='example'>
<summary>Example</summary>

**WGSL Code:**

```wgsl
struct Config {
    factor: f32,
}

struct MyStorageBufferType {
    data: array<f32>,
}

@group(0) @binding(0) var<uniform> myConfig: Config;
@group(0) @binding(1) var<storage, read_write> myStorageBuffer: MyStorageBufferType;
```

**JavaScript Code:**

```js
// 1. Create GPU buffers
const configBuffer = device.createBuffer({
  size: 16, // Padded config size
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const storageBuffer = device.createBuffer({
  size: 1024,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

// 2. Define the Bind Group Layout (Compute visibility)
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'uniform' },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: 'storage' }, // Maps to read_write in WGSL
    },
  ],
});

// 3. Create the Bind Group
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: { buffer: configBuffer },
    },
    {
      binding: 1,
      resource: { buffer: storageBuffer },
    },
  ],
});
```

</details>

---

## 2. Pipeline Interface Attributes

Pipeline interface attributes declare how data enters and exits the stages of your graphics or compute pipelines.

### `@location`

The `@location(N)` attribute defines a generic user-defined IO channel, where `N` is an unsigned integer. It serves different roles depending on where it is applied:

1. **Vertex Inputs**: Maps GPU vertex buffers (specified via the host API vertex layouts) directly to vertex shader input parameters.
2. **Inter-Stage Linkage**: Connects outputs from the vertex shader to inputs of the fragment shader. The rasterizer automatically interpolates these values across the triangles.
3. **Fragment Outputs**: Maps fragment shader outputs to specific render targets (color attachments) in the render pipeline.

#### Example: Inter-Stage Linkage

Here, color data is passed from the vertex shader to the fragment shader via channel 0 (`@location(0)`).

```wgsl
struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f, // Output color channel 0
}

@vertex
fn vs_main() -> VertexOutput {
    var out: VertexOutput;
    out.pos = vec4f(0.0, 0.0, 0.0, 1.0);
    out.color = vec4f(1.0, 0.0, 0.0, 1.0); // Pass red color
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
    return in.color; // Outputs red to color target index 0
}
```

---

### `@builtin`

The `@builtin(name)` attribute connects variables to system-generated inputs or outputs managed by the GPU hardware and rasterizer.

| Built-in Name | Stage | I/O | Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `position` | Vertex / Fragment | Out / In | `vec4f` | Clip-space position (Vertex output); window-space coordinates (Fragment input). |
| `vertex_index` | Vertex | In | `u32` | Index of the current vertex being processed. |
| `instance_index` | Vertex | In | `u32` | Index of the current instance being drawn. |
| `global_invocation_id` | Compute | In | `vec3u` | Absolute coordinate of the current thread within the global dispatch grid. |
| `local_invocation_id` | Compute | In | `vec3u` | Coordinate of the thread relative to the current workgroup. |

#### Example: Using Built-ins

```wgsl
@vertex
fn vs_main(@builtin(vertex_index) v_idx: u32) -> @builtin(position) vec4f {
    // Generate a full-screen triangle using the vertex index
    var pos = vec2f(0.0);
    if (v_idx == 1u) { pos = vec2f(2.0, 0.0); }
    if (v_idx == 2u) { pos = vec2f(0.0, 2.0); }
    return vec4f(pos, 0.0, 1.0);
}
```

---

## 3. Other Core Attributes

WGSL includes other specialized attributes covered in depth in their respective chapters:

- **`@vertex` / `@fragment` / `@compute`**: Declares a function as a pipeline entry point ([Entry Points](../functions/entry-points.md)).
- **`@workgroup_size(X, Y, Z)`**: Sets the dimensions of a compute shader's local execution block ([Local Variables](../variables/var-function.md)).
- **`@align(A)` / `@size(S)`**: Controls memory layout, padding, and alignment of structure members ([Alignment](../types/structures/alignment.md)).
- **`@id(I)`**: Associates a pipeline constant with an overridable constant ([Override Declaration](../variables/override.md)).
- **`@must_use`**: Prevents ignoring a function's return value ([Must Use Attributes](../functions/must-use.md)).