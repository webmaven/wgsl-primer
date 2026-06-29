---
title: "Structure Layouts & Memory Alignment"
shader: ./alignment.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "computed_offsets.u_align",  "type": "u32"},
    {"expr": "computed_offsets.v_align",  "type": "u32"},
    {"expr": "computed_offsets.w_align",  "type": "u32"},
    {"expr": "computed_offsets.size_of_struct", "type": "u32"}
    ]}'
---

# Structure Layouts & Memory Alignment

When passing structures between your host program (JavaScript/TypeScript) and shaders, you must follow strict **Structure Layout & Memory Alignment** rules. 

Unlike general-purpose CPU programming where compilers automatically hide alignment and padding details, GPU memory architectures enforce explicit layouts. Understanding these rules is essential to prevent mismatched CPU-to-GPU structures, which lead to corrupted data or silent rendering failures.

---

## Why Is Memory Alignment Enforced?

At the physical hardware level, GPU execution units process data by fetching memory in parallel **coalesced blocks** (typically 32-byte, 64-byte, or 128-byte cache lines). 

* **Hardware Coalescing**: If a 32-bit float spans across a cache-line boundary, the GPU would require **two separate memory clock cycles** to retrieve a single value, severely reducing memory bandwidth.
* **CPU-to-GPU Serialization**: WebGPU pipelines require that data buffers bound as uniforms or storage buffers match the native GPU layout exactly. WebGPU adopts the Vulkan `std430` layout specification to enforce these hardware boundaries.

---

## Memory Alignment & Sizing Rules

Every WGSL data type has a compile-time **alignment requirement** (the starting byte offset of the variable must be a multiple of this value) and an inherent **size** (the actual bytes it occupies in memory).

| Type | Alignment (bytes) | Size (bytes) |
| :--- | :--- | :--- |
| `f32`, `i32`, `u32` | \(4\) | \(4\) |
| `vec2<f32>` | \(8\) | \(8\) |
| `vec3<f32>` | **\(16\)** | **\(12\)** |
| `vec4<f32>` | \(16\) | \(16\) |
| `mat4x4<f32>` | \(16\) | \(64\) (4 columns of 16 bytes each) |

> [!WARNING]
> **The `vec3` Trap**: A `vec3<f32>` contains 3 floats, meaning it only occupies \(12\) bytes of raw data. However, **its alignment requirement is \(16\) bytes**. If you place a variable immediately after a `vec3`, the compiler forces it to start at the next \(16\)-byte boundary, creating an automatic **\(4\)-byte padding hole** in your structure!

---

## Mathematical Formulation of Struct Layouts

The final layout of a custom structure is calculated recursively based on its members:

1. **Structure Alignment**: The alignment requirement of a structure \(\text{align}(S)\) is the **maximum alignment** of any of its members:
   \[\text{align}(S) = \max_{m \in S} (\text{align}(m))\]

2. **Structure Size**: The final size of a structure \(\text{size}(S)\) is its unpadded size rounded up to the nearest multiple of its structure alignment \(\text{align}(S)\):
   \[\text{size}(S) = \lceil \text{unpadded\_size}(S) / \text{align}(S) \rceil \times \text{align}(S)\]

---

## Interactive 32-Byte Structure Memory Layout

Consider the WGSL structure `MyData` shown below:

```wgsl
struct MyData {
  a : u32,       // Offset 0, size 4  (aligned to 4)
  b : vec3<f32>, // Offset 16, size 12 (aligned to 16) - 12 bytes of padding after 'a'
  c : f32,       // Offset 28, size 4  (aligned to 4)
}                // Total size: 32 bytes (aligned to 16, the largest member's alignment)
```

Here is a visual, byte-by-byte representation of `MyData` laid out in memory across two **\(16\)-byte (128-bit) GPU cache boundaries**:

<div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; font-family: 'Inter', system-ui, sans-serif; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px rgba(56, 189, 248, 0.05);">
  <div style="color: #f8fafc; font-size: 15px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; box-shadow: 0 0 8px #38bdf8;"></span>
    GPU Memory Buffer Layout (32 Bytes total)
  </div>

  <!-- Row 1: Bytes 0 to 15 -->
  <div style="margin-bottom: 24px;">
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-weight: 500; margin-bottom: 4px;">
      <span>CACHE LINE 0 (16 Bytes)</span>
      <span>Offsets 0 - 15</span>
    </div>
    <div style="display: flex; gap: 4px; height: 48px;">
      <!-- Member a (4 bytes) -->
      <div style="flex: 4; background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.3)); border: 1.5px solid #0ea5e9; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(14, 165, 233, 0.1);">
        <span style="color: #38bdf8; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">a</span>
        <span style="color: #0284c7; font-size: 10px; font-weight: 500;">u32 (Bytes 0-3)</span>
      </div>
      <!-- Padding (12 bytes) -->
      <div style="flex: 12; background: repeating-linear-gradient(45deg, rgba(71, 85, 105, 0.05), rgba(71, 85, 105, 0.05) 10px, rgba(71, 85, 105, 0.15) 10px, rgba(71, 85, 105, 0.15) 20px); border: 1.5px dashed #475569; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
        <span style="color: #64748b; font-size: 11px; font-weight: 600; letter-spacing: 1px;">12-BYTE PADDING HOLE</span>
      </div>
    </div>
  </div>

  <!-- Row 2: Bytes 16 to 31 -->
  <div style="margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-weight: 500; margin-bottom: 4px;">
      <span>CACHE LINE 1 (16 Bytes)</span>
      <span>Offsets 16 - 31</span>
    </div>
    <div style="display: flex; gap: 4px; height: 48px;">
      <!-- Member b.x (4 bytes) -->
      <div style="flex: 4; background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.3)); border: 1.5px solid #a855f7; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(168, 85, 247, 0.1);">
        <span style="color: #c084fc; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">b.x</span>
        <span style="color: #8b5cf6; font-size: 9px; font-weight: 500;">f32 (16-19)</span>
      </div>
      <!-- Member b.y (4 bytes) -->
      <div style="flex: 4; background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.3)); border: 1.5px solid #a855f7; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(168, 85, 247, 0.1);">
        <span style="color: #c084fc; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">b.y</span>
        <span style="color: #8b5cf6; font-size: 9px; font-weight: 500;">f32 (20-23)</span>
      </div>
      <!-- Member b.z (4 bytes) -->
      <div style="flex: 4; background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.3)); border: 1.5px solid #a855f7; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(168, 85, 247, 0.1);">
        <span style="color: #c084fc; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">b.z</span>
        <span style="color: #8b5cf6; font-size: 9px; font-weight: 500;">f32 (24-27)</span>
      </div>
      <!-- Member c (4 bytes) -->
      <div style="flex: 4; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.3)); border: 1.5px solid #10b981; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);">
        <span style="color: #34d399; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">c</span>
        <span style="color: #059669; font-size: 9px; font-weight: 500;">f32 (28-31)</span>
      </div>
    </div>
  </div>

  <!-- Legend -->
  <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 11px; border-top: 1px solid #1e293b; padding-top: 14px; margin-top: 14px;">
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 12px; height: 12px; background: #0ea5e9; border-radius: 3px;"></span>
      <span style="color: #94a3b8;"><strong style="color: #cbd5e1;">Member a</strong> (u32, 4B)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 12px; height: 12px; background: #a855f7; border-radius: 3px;"></span>
      <span style="color: #94a3b8;"><strong style="color: #cbd5e1;">Member b</strong> (vec3&lt;f32&gt;, 12B)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 12px; height: 12px; background: #10b981; border-radius: 3px;"></span>
      <span style="color: #94a3b8;"><strong style="color: #cbd5e1;">Member c</strong> (f32, 4B)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-block; width: 12px; height: 12px; background: repeating-linear-gradient(45deg, #475569 0px, #475569 2px, transparent 2px, transparent 4px); border: 1px dashed #475569; border-radius: 3px;"></span>
      <span style="color: #64748b;"><strong style="color: #94a3b8;">Padding Hole</strong> (12B)</span>
    </div>
  </div>
</div>

---

## Enforcing Layouts Dynamically

To maintain absolute control over memory serialization or match a specific host data structure exactly, WGSL supports manual **layout attributes**:

* **`@align(N)`**: Forces a member's alignment requirement to be a multiple of <span class="template template-align-n">N</span> bytes.
* **`@size(N)`**: Forces a member's overall size to occupy exactly <span class="template template-size-n">N</span> bytes, appending trailing padding to that specific member if necessary.

Let's inspect the interactive shader code panel to see how offsets and sizes are computed dynamically using these custom attributes!
