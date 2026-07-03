---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Textures'
---
Textures in WGSL store multi-dimensional array data (usually image data) that can be sampled, read, or written within a shader. They are fundamental for applying images to 3D surfaces, performing post-processing, and running data-parallel computations.

WebGPU categorizes textures into two main groups based on how they are accessed:

1. **Sampled Textures**: Read-only textures accessed through a **sampler**, which filters, interpolates, and wraps coordinates.
2. **Storage Textures**: Raw, voxel-by-voxel or pixel-by-pixel reads and writes. Typically used in compute shaders for image processing or simulation.

---

## Declaring Textures in WGSL

Textures belong conceptually to the `handle` address space. In WGSL, **handles must not specify an address space** in their syntax. They are declared using simple `var` syntax.

### Sampled Textures and Samplers

A sampled texture and its corresponding sampler are declared as distinct variables and work together inside the shader.

```wgsl
@group(0) @binding(0) var myTexture: texture_2d<f32>;
@group(0) @binding(1) var mySampler: sampler;
```

Common sampled texture types include:

- `texture_2d<f32>`: Standard 2D texture (stores floating-point color channels).
- `texture_depth_2d`: 2D depth texture.
- `texture_cube<f32>`: Cubemap texture.

### Storage Textures

Storage textures are declared with a specific texel format and an access mode.

```wgsl
@group(0) @binding(2) var myStorageTexture: texture_storage_2d<rgba8unorm, write>;
```

- **Texel Format**: E.g., `rgba8unorm` (8-bit normalized RGBA channels).
- **Access Mode**: Storage textures in standard WebGPU/WGSL typically support the `write` access mode (meaning write-only).

!!! note
    Some WebGPU implementations support `read` or `read_write` modes on storage textures if the `readonly_and_readwrite_storage_textures` language feature is enabled.

---

## JavaScript to WGSL Mapping

To use textures, you must create the texture resource in JavaScript on the host, create a matching bind group layout, and then bind the texture's GPU view.

### Example: Sampled Texture

<details class='example'>
<summary>Example</summary>

**JavaScript Code:**

```javascript
// 1. Create the GPU Texture
const texture = device.createTexture({
  size: [512, 512, 1],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
});

// 2. Create the Sampler (handles filtering and wrapping)
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
});

// 3. Create Bind Group Layout
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      texture: { sampleType: 'float' },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {},
    },
  ],
});

// 4. Bind the Resources
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: texture.createView(),
    },
    {
      binding: 1,
      resource: sampler,
    },
  ],
});
```

</details>

---

### Example: Storage Texture

Storage textures are bound using a `storageTexture` entry in the bind group layout.

<details class='example'>
<summary>Example</summary>

**JavaScript Code:**

```javascript
// 1. Create the Storage Texture
const storageTexture = device.createTexture({
  size: [512, 512, 1],
  format: 'rgba8unorm',
  usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST,
});

// 2. Create Bind Group Layout
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 2,
      visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
      storageTexture: {
        access: 'write-only', // Maps to 'write' in WGSL
        format: 'rgba8unorm',
      },
    },
  ],
});

// 3. Bind the Resource View
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 2,
      resource: storageTexture.createView(),
    },
  ],
});
```

</details>

---

## Technical Summary

- **No Address Space Syntax**: Textures/samplers are handles. Writing `var<handle>` is invalid WGSL syntax; write simply `var`.
- **Access Modes**: Sampled textures are always read-only via helper sampling functions (like `textureSample`). Storage textures are declared with explicit formats and access modes (typically `write`).
- **Filtering & Sampling**: Only sampled textures can be used with `sampler` objects. Storage textures do not use samplers; instead, they are read/written at exact integer coordinates via functions like `textureStore` and `textureLoad`.