---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Bitwise Operators & Data Packing'
shader: ./bitwise-packing.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "get_input_normal()", "type": "vec3f"}, {"expr": "get_input_specular()", "type": "f32"}, {"expr": "get_packed_val()", "type": "u32"}, {"expr": "get_unpacked_normal()", "type": "vec3f"}, {"expr": "get_unpacked_specular()", "type": "f32"}]}'
---
In real-time graphics and WebGPU shader pipelines, GPU execution units are incredibly fast, but memory bandwidth (retreading data from VRAM) is often the primary bottleneck. Passing uncompressed floating-point data through buffers wastes precious bandwidth.

To solve this, professional graphics programmers use **data packing**—compressing multiple distinct attributes (like coordinates, directions, and material properties) into a single compact integer (like a `u32`) using **bitwise operators**.

This section covers the core bitwise operators in WGSL and applies them to a real-world case study: packing a 3D unit normal vector and a specular coefficient into a single `u32`.

---

## The Bitwise Operators

Bitwise operators manipulate the individual bits of integer values (`i32` and `u32`). They are extremely fast because they map directly to hardware-level bit-logic circuits.

| Operator | Name | Behavior |
| :--- | :--- | :--- |
| `&` | **AND** | Sets each bit to \(1\) if both bits are \(1\). |
| `\|` | **OR** | Sets each bit to \(1\) if at least one bit is \(1\). |
| `^` | **XOR** | Sets each bit to \(1\) if only one bit is \(1\). |
| `~` | **NOT** | Flips all bits (\(1\) becomes \(0\), and vice versa). |
| `<<` | **Left Shift** | Shifts bits to the left, filling empty spaces on the right with \(0\). |
| `>>` | **Right Shift** | Shifts bits to the right, preserving or filling sign bits on the left. |

---

## Case Study: Normal & Specular Packing

Imagine we are building a Deferred Rendering pipeline. For each screen pixel, we must write its surface data (a **G-Buffer**) to texture storage.

Each pixel needs:
1. A **surface normal vector** (representing direction): three coordinates, \(x, y, z \in [-1.0, 1.0]\).
2. A **specular reflectivity coefficient**: a scalar, \(s \in [0.0, 1.0]\).If we store these as uncompressed floats, we need three `f32` values for the vector (\(12\) bytes) and one `f32` for the specular (\(4\) bytes), totaling **\(16\) bytes**.

By using a **9-9-9-5 layout** (which "splits the difference" to provide extremely high precision for both the normals and the specular coefficient), we can fit all four attributes into a single `u32` (**\(4\) bytes**), reducing our memory bandwidth footprint by **\(75\%\)**!

### Layout Strategy
A `u32` has \(32\) bits. We allocate:
- **\(9\) bits** for \(x\) (value range \(0\) to \(511\))
- **\(9\) bits** for \(y\) (value range \(0\) to \(511\))
- **\(9\) bits** for \(z\) (value range \(0\) to \(511\))
- **\(5\) bits** for specular \(s\) (value range \(0\) to \(31\))

### Precision, Quantization, & Bit Allocation Trade-offs

When packing floating-point data into integers, we must perform **quantization** (mapping continuous float ranges to discrete integer steps). Because we are fitting multiple fields into a single \(32\)-bit `u32`, bit allocation is a zero-sum game: allocating more bits to one attribute means taking them away from another.

The following comparison of the **9-9-9-5 layout** with other options illustrates this trade-off.

#### Layout A: 10-10-10-2 (High-Precision Normals, Low-Precision Specular)

* **Normal Coordinates (\(x, y, z\))**: \(10\) bits each.
  * \(2^{10} = 1024\) discrete steps.
  * Step size: \(\frac{2.0}{1023} \approx 0.00195\).
  * **Precision**: The maximum reconstruction error is less than \(0.001\). For 3D surface normals, an angular direction error of less than \(0.1\%\) is imperceptible to the human eye under real-world lighting ("zero visible loss in precision").
  * **Result**: An input of \(-0.577\) unpacks to \(\approx -0.577712\) (error \(\approx 0.0007\)).
* **Specular (\(s\))**: \(2\) bits.
  * \(2^2 = 4\) discrete steps.
  * Possible unpacked values: \(0.0\), \(\approx 0.333\), \(\approx 0.667\), and \(1.0\).
  * **Precision**: Extremely coarse. Specular shininess is highly quantized.
  * **Result**: An input of \(0.75\) maps to step \(2\) (\(0.75 \times 3.0 = 2.25\), rounded to \(2.0\)), which unpacks back to \(\frac{2}{3} \approx 0.6667\). The error is \(0.0833\) (\(8.3\%\)).

#### Layout B: 8-8-8-8 (Balanced Normals & Specular)

If your graphics engine needs higher specular precision and can tolerate slightly rougher normals, you might choose an alternative **8-8-8-8 layout**:

* **Normal Coordinates (\(x, y, z\))**: \(8\) bits each.
  * \(2^8 = 256\) discrete steps.
  * Step size: \(\frac{2.0}{255} \approx 0.00784\).
  * **Precision**: Coarser normals. The reconstruction error can be up to \(0.004\). Under sharp specular lighting, this can occasionally cause subtle lighting banding (mach banding) on smooth curved surfaces.
  * **Result**: An input of \(-0.577\) maps to step \(54\) (\((-0.577 \times 0.5 + 0.5) \times 255.0 = 53.93\), rounded to \(54\)), which unpacks to \(\frac{54}{255} \times 2.0 - 1.0 \approx -0.57647\) (error \(\approx 0.0005\)). However, an input of \(-0.570\) maps to step \(55\), which unpacks to \(\frac{55}{255} \times 2.0 - 1.0 \approx -0.5686\) (error \(\approx 0.0014\)).
* **Specular (\(s\))**: \(8\) bits.
  * \(2^8 = 256\) discrete steps.
  * Step size: \(\frac{1.0}{255} \approx 0.00392\).
  * **Precision**: High-precision specular.
  * **Result**: An input of \(0.75\) maps to step \(191\) (\(0.75 \times 255.0 = 191.25\), rounded to \(191\)), which unpacks to \(\frac{191}{255} \approx 0.74902\). The error is only \(0.00098\) (\(0.1\%\)), preserving the specular value almost perfectly!

#### Layout C: 9-9-9-5 (The Sweet Spot / "Splitting the Difference")

By splitting the difference, we can allocate \(9\) bits to each coordinate of the normal, and use the remaining \(5\) bits for specular intensity:

* **Normal Coordinates (\(x, y, z\))**: \(9\) bits each.
  * \(2^9 = 512\) discrete steps.
  * Step size: \(\frac{2.0}{511} \approx 0.00391\).
  * **Precision**: Extremely good. The maximum reconstruction error is around \(0.002\), which is completely imperceptible under typical lighting conditions and prevents any visible banding.
  * **Result**: An input of \(-0.577\) maps to step \(108\) (\((-0.577 \times 0.5 + 0.5) \times 511.0 = 108.0755\), rounded to \(108\)), which unpacks back to \(\frac{108}{511} \times 2.0 - 1.0 \approx -0.577299\) (error is just \(\approx 0.0003\)).
* **Specular (\(s\))**: \(5\) bits.
  * \(2^5 = 32\) discrete steps.
  * Step size: \(\frac{1.0}{31} \approx 0.03226\).
  * **Precision**: Much better material definition. With \(32\) distinct shininess values, the specular coefficient is smooth enough for highly realistic lighting highlights.
  * **Result**: An input of \(0.75\) maps to step \(23\) (\(0.75 \times 31.0 = 23.25\), rounded to \(23\)), which unpacks to \(\frac{23}{31} \approx 0.74194\). The error is only \(0.008\) (\(0.8\%\)), which represents a **\(10\times\) precision increase** for the specular component compared to the 10-10-10-2 layout!

!!! note "Single-Precision Floating-Point Limits (`f32`)"
    Even before data packing, you will notice that the input normal `vec3f(-0.577, ...)` is displayed in the visualizer as `vec3f(-0.5770000219345093, ...)`. This is because standard 32-bit floating-point numbers store values in binary (base-2), and numbers like `0.577` cannot be represented exactly in binary fractional form (much like \(\frac{1}{3}\) in decimal). The browser and GPU instantly approximate it to the closest representable binary float.

---

## Implementing the Packer in WGSL

The math and bit-manipulations required to pack and unpack this data are detailed below.

### Step 1: Mapping Float Ranges to Integers
Bitwise operations work on integers, so we must first convert our floating-point values into positive integers that fit within their allocated bit-widths.

- **Normal components** (\([-1.0, 1.0]\)):
  We map the coordinate \(v\) into \([0.0, 1.0]\) using the equation \(v_{\text{mapped}} = 0.5v + 0.5\).
  Next, we scale it by \(511.0\) (the maximum value of a \(9\)-bit integer, \(2^{9}-1\)) and convert to integer:
  
  ```wgsl
  let x_u32 = u32(round((normal.x * 0.5 + 0.5) * 511.0));
  ```

- **Specular coefficient** (\([0.0, 1.0]\)):
  We scale by \(31.0\) (the maximum value of a \(5\)-bit integer, \(2^{5}-1\)) and convert:
  
  ```wgsl
  let s_u32 = u32(round(specular * 31.0));
  ```

### Step 2: Packing with Shifts (`<<`) and OR (`|`)
Now we position the integer values within our \(32\)-bit block. Each component is shifted left to its allocated slot:

- \(x\) is stored in bits \(0\) to \(8\): shift by \(0\) bits.
- \(y\) is stored in bits \(9\) to \(17\): shift left by \(9\) bits (`<< 9u`).
- \(z\) is stored in bits \(18\) to \(26\): shift left by \(18\) bits (`<< 18u`).
- \(s\) is stored in bits \(27\) and \(31\): shift left by \(27\) bits (`<< 27u`).

We then combine these shifted components together using the bitwise OR (`|`) operator:

```wgsl
let packed = x_u32 | (y_u32 << 9u) | (z_u32 << 18u) | (s_u32 << 27u);
```

### Step 3: Unpacking with Shifts (`>>`) and Masks (`&`)
To retrieve the values in our lighting shader, we reverse the process.

First, we shift the bits of the target component to the rightmost position.
Then, we use a bitwise AND (`&`) with a **bitmask** to clear out any preceding bits.

- To extract a \(9\)-bit integer, we use the mask `0x1FFu` (which is binary `111111111`, representing \(9\) bits of \(1\)s).
- To extract a \(5\)-bit integer, we use the mask `0x1Fu` (binary `11111`, representing \(5\) bits of \(1\)s).

```wgsl
let x_u32 = packed & 0x1FFu;               // bits 0-8
let y_u32 = (packed >> 9u) & 0x1FFu;       // bits 9-17
let z_u32 = (packed >> 18u) & 0x1FFu;      // bits 18-26
let s_u32 = (packed >> 27u) & 0x1Fu;       // bits 27-31
```

### Step 4: Reconstructing floats
Finally, we convert our integers back to `f32` and scale them back to their original ranges:

```wgsl
let x = (f32(x_u32) / 511.0) * 2.0 - 1.0;
let y = (f32(y_u32) / 511.0) * 2.0 - 1.0;
let z = (f32(z_u32) / 511.0) * 2.0 - 1.0;
let specular = f32(s_u32) / 31.0;
```

---

## Advanced Layouts: SIMD-Friendly Vectorized Packing (96-Bit Interleaved Layout)

In professional real-time rendering pipelines (such as G-buffers in AAA game engines), optimization often requires packing multiple related vector attributes across shared, compact integer layouts. 

Rather than packing individual vectors into single integer variables, compilers and graphics programmers pack groups of attributes together across multiple integers. This maximizes memory bandwidth savings and aligns with the parallel execution units of the GPU.

### Memory Optimization Case Study: Dual 3D Vectors
Consider a scenario where a shader needs to store **two sets of 3D coordinates**: a surface position vector \(\vec{P} = (x_P, y_P, z_P)\) and a normal vector \(\vec{N} = (x_N, y_N, z_N)\), totaling 6 floating-point values.

To minimize storage overhead, these 6 floats can be packed into **three 32-bit integers** (\(3 \times \text{u32} = 96\) bits):
- **Uncompressed representation**: The 6 floats require **24 bytes** of memory.
- **Compressed representation**: By packing them into three `u32` integers, the footprint is reduced to **12 bytes** (a \(50\%\) memory bandwidth reduction).
- **Precision retention**: This allocation provides **16 bits per coordinate** (\(2^{16} = 65,536\) discrete steps), preserving high precision (such as sub-millimeter position steps).

### Comparison of Layout Approaches

#### Sequential Approach
A sequential approach would pack \(\vec{P}\) into the first 1.5 integers and \(\vec{N}\) into the remaining 1.5 integers. Unpacking this layout is inefficient because it requires complex, non-uniform scalar bit-shifts and masking, which prevents vectorized GPU optimizations and increases scalar instruction overhead.

#### Interleaved (Vectorized) Approach
To optimize for the GPU's vectorized architecture, we use an **interleaved layout** where corresponding coordinates are packed together into the same integer container:
- **`integer_0`** stores the \\(x\)-coordinates: \(x_P\) in bits \(0\text{–}15\), and \(x_N\) in bits \(16\text{–}31\).
- **`integer_1`** stores the \\(y\)-coordinates: \(y_P\) in bits \(0\text{–}15\), and \(y_N\) in bits \(16\text{–}31\).
- **`integer_2`** stores the \\(z\)-coordinates: \(z_P\) in bits \(0\text{–}15\), and \(z_N\) in bits \(16\text{–}31\).

```
                      32-Bit Unsigned Integer Layout
            Bit 31                    Bit 16 | Bit 15                    Bit 0
 integer_0: [    Vector B's X-Coordinate    ] | [    Vector A's X-Coordinate    ]
 integer_1: [    Vector B's Y-Coordinate    ] | [    Vector A's Y-Coordinate    ]
 integer_2: [    Vector B's Z-Coordinate    ] | [    Vector A's Z-Coordinate    ]
```

### Vectorized Unpacking Semantics
By interleaving the bits, a single `vec3<u32>` can represent the grouped coordinates, enabling **SIMD (Single Instruction, Multiple Data)** bitwise operations across all three axes in parallel. 

Unpacking both 3D vectors is highly efficient in WGSL:

```wgsl
struct UnpackedPairs {
    position: vec3f,
    normal: vec3f,
};

fn unpack_coordinate_pairs(packed_xyz: vec3<u32>) -> UnpackedPairs {
    // 1. Isolate lower 16 bits (Vector A) and upper 16 bits (Vector B) for all 3 axes in parallel!
    let a_u16 = packed_xyz & vec3<u32>(0xFFFFu);
    let b_u16 = packed_xyz >> vec3<u32>(16u);

    // 2. Reconstruct both 3D floating-point vectors in parallel using vector arithmetic
    var unpacked: UnpackedPairs;
    
    // Scale 16-bit unsigned ints [0, 65535] to normalized range [0.0, 1.0] (or map to [-1.0, 1.0])
    unpacked.position = vec3f(a_u16) / 65535.0;
    unpacked.normal   = (vec3f(b_u16) / 65535.0) * 2.0 - 1.0;

    return unpacked;
}
```

### Performance Analysis
Because modern GPUs are hardware-optimized for 3D vector arithmetic, the vectorized bitwise operations `& vec3<u32>` and `>> vec3<u32>` compile down to a single instruction cycle on the GPU's execution registers. This eliminates scalar register bottlenecks and allows the graphics pipeline to unpack surface positions and normal channels with minimal overhead.

---

## Packing Constraints & Hardware Realities

When planning a custom data packing layout, developers often ask if they can pack very low-bitwidth integers (such as 8-bit `i8` or `u8` elements) into a 16-bit floating-point type (`f16`), or if they should stick to integer registers (`u32` or `i32`).

### Why You Should Never Pack Integer Bits into Floating-Point Containers (`f16`/`f32`)

While it might seem intuitive to pack two 8-bit integers into a single 16-bit float (`f16`), doing so is a major anti-pattern on the GPU:

1. **Risk of Bit Corruption (NaNs, Infinities, and Denormals)**: The IEEE-754 half-precision float (`f16`) uses a structured bit format (1 sign bit, 5 exponent bits, and 10 mantissa bits). If you force-pack raw 8-bit integer bits into these ranges, the resulting combined 16-bit pattern may represent a **NaN (Not-a-Number)**, a **positive/negative infinity**, or a **denormal**. Modern GPU floating-point arithmetic units (ALUs) or compiler drivers can automatically clamp, flush, or modify these special float representations, permanently corrupting your underlying integer bits.
2. **No Bitwise Operators on Floats**: WGSL strictly prohibits performing bitwise operations (such as `&`, `|`, `<<`, and `>>`) directly on floating-point types (`f16` and `f32`). To unpack them, you would have to bitcast the float to a temporary integer container, wasting precious ALU clock cycles.
3. **Optional Support**: The `f16` type is an **optional extension** in WebGPU. If you write a shader relying on `f16` for packing, it will fail to compile on devices that do not support the extension. In contrast, 32-bit integers (`u32`/`i32`) are universally supported on all WebGPU hardware.

### The Optimal GPU Way: Fixed-Function Hardware Unpacking

Instead of writing complex ALU instructions to pack and unpack 8-bit integers (like four `i8` into a `u32`), you should rely on the GPU's **fixed-function texture and vertex fetch pipelines**:

- **GPU Texture & Vertex Formats**: You can store data in GPU memory buffers or textures using standard 8-bit channels—such as `R8G8B8A8_UINT` (unsigned 8-bit integers), `R8G8B8A8_SINT` (signed 8-bit integers), or `R8G8B8A8_UNORM` (unsigned normalized floating-point representation).
- **Zero ALU Cost Unpacking**: When the shader fetches or samples from these memory blocks, the GPU's specialized hardware sampler/fetch unit automatically decompresses the 8-bit values into standard 32-bit register formats (`vec4u`, `vec4i`, or `vec4f`) **before** your shader code runs. This provides instant, hardware-level unpacking with absolute zero ALU overhead.

---

## Interactive Visualizer

The interactive editor demonstrates this packing system executing directly on the GPU. The **Results** section displays the input values alongside their packed `u32` integer representations, showing how the unpacked normal is reconstructed with high precision.
