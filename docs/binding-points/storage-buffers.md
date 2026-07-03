---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: 'Storage Buffers'
---
Storage buffers in WGSL are used to store large amounts of data that can be read from and written to by shaders. They are declared using the `var<storage>` keyword and can be configured with specific access modes: `read` (default) or `read_write`.

!!! important
    Unlike storage textures, WGSL storage buffers **do not support** a pure `write` access mode. They are either read-only (`read`) or read-write (`read_write`).

### Declaring Storage Buffers

In WGSL, storage variables must reside in the `storage` address space.

**Syntax:**

```wgsl
var<storage, read> s: T;       // Read-only storage buffer (explicit)
var<storage> s: T;             // Read-only storage buffer (implicit default)
var<storage, read_write> s: T; // Read-write storage buffer
```

- `T` must be a **host-shareable** structure type.
- If a storage buffer contains a runtime-sized array (e.g., `array<f32>`), it **must** be the last member of a structure.

### Example: Declaring and Binding a Storage Buffer

Here is a complete setup demonstrating how a storage buffer is defined in WGSL and mapped to JavaScript on the host side.

<details class='example'>
<summary>Example</summary>

**WGSL Code:**

```wgsl
struct MyStorageBufferType {
    data: array<f32>,
}

@group(0) @binding(1) var<storage, read_write> myStorageBuffer: MyStorageBufferType;
```

**JavaScript Code:**

```javascript
// Define the storage buffer data
const storageData = new Float32Array([1.0, 2.0, 3.0, 4.0]);

// Create the storage buffer on the GPU
const storageBuffer = device.createBuffer({
  size: storageData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

// Write host data to the storage buffer
device.queue.writeBuffer(storageBuffer, 0, storageData);

// Create the bind group layout
const bindGroupLayout = device.createBindGroupLayout({
  entries: [
    {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: 'storage', // Maps to var<storage, read_write>
      },
    },
  ],
});

// Create the bind group referencing our buffer
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [
    {
      binding: 1,
      resource: {
        buffer: storageBuffer,
      },
    },
  ],
});
```

</details>

### Access Modes Summary

| WGSL Address Space & Access Mode | JS Bind Group Layout Entry  | Usage Scenario                                                      |
| :------------------------------- | :-------------------------- | :------------------------------------------------------------------ |
| `var<storage, read>`             | `type: 'read-only-storage'` | Reading large arrays (e.g., lookup tables, vertex inputs).          |
| `var<storage, read_write>`       | `type: 'storage'`           | Reading and writing data (e.g., compute shader simulation outputs). |

- **Host-Shareable Types**: Storage buffers require structure types whose layouts conform to host-alignment requirements.
- **Runtime-Sized Arrays**: A storage buffer is the only place in WGSL where you can declare a runtime-sized <code>array&lt;<span class="template template-array-t">T</span>&gt;</code>, enabling dynamic buffer sizing from the JavaScript host API.