---
title: 'Bitwise Operators & Data-Packing Masterclass'
shader: ./bitwise-packing.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "get_input_normal()", "type": "vec3f"}, {"expr": "get_input_specular()", "type": "f32"}, {"expr": "get_packed_val()", "type": "u32"}, {"expr": "get_unpacked_normal()", "type": "vec3f"}, {"expr": "get_unpacked_specular()", "type": "f32"}]}'
---

# Bitwise Operators & Data-Packing Masterclass

In real-time graphics and WebGPU shader pipelines, GPU execution units are incredibly fast, but memory bandwidth (retreading data from VRAM) is often the primary bottleneck. Passing uncompressed floating-point data through buffers wastes precious bandwidth.

To solve this, professional graphics programmers use **data packing**—compressing multiple distinct attributes (like coordinates, directions, and material properties) into a single compact integer (like a `u32`) using **bitwise operators**.

In this masterclass, we will cover the core bitwise operators in WGSL and apply them to a real-world case study: packing a 3D unit normal vector and a specular coefficient into a single `u32`.

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

Let's look at how our chosen **9-9-9-5 layout** compares with other layouts to understand this trade-off.

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

> [!NOTE]
> **Single-Precision Floating-Point Limits (`f32`)**:
> Even before data packing, you will notice that the input normal `vec3f(-0.577, ...)` is displayed in the visualizer as `vec3f(-0.5770000219345093, ...)`. This is because standard 32-bit floating-point numbers store values in binary (base-2), and numbers like `0.577` cannot be represented exactly in binary fractional form (much like \(\frac{1}{3}\) in decimal). The browser and GPU instantly approximate it to the closest representable binary float.

---

## Implementing the Packer in WGSL

Let's walk through the math and bit-manipulations required to pack and unpack this data.

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

## Interactive Visualizer

In the interactive editor on the right, you can see this exact system executing on your GPU. 

Look at the **Results** section to compare the input values against the packed `u32` integer representation, and witness how the unpacked normal is perfectly reconstructed with zero visible loss in precision.
