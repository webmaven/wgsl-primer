---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Fragment Derivative Builtins'
---
Fragment derivative builtins in WGSL compute the spatial rate of change (derivative) of a value across the screen-space of a rendered primitive. These functions are highly useful for anti-aliasing, bump mapping, calculating custom mipmap levels, and implementing procedural shading.

Because derivatives are computed relative to adjacent screen pixels, they are **only available in the fragment shader stage**. Calling them in vertex or compute stages is a compile-time error.

---

## Available Builtins

WGSL provides three primary derivative functions:

### `dpdx` (Derivative of \(e\) with respect to \(x\))

Computes the partial derivative of an expression with respect to the screen-space X-coordinate.

**Syntax:**

```wgsl
fn dpdx(e: T) -> T
```

- `e`: A scalar or vector of type `f32` or `f16`.
- Returns the change in value per horizontal pixel.

### `dpdy` (Derivative of \(e\) with respect to \(y\))

Computes the partial derivative of an expression with respect to the screen-space Y-coordinate.

**Syntax:**

```wgsl
fn dpdy(e: T) -> T
```

- `e`: A scalar or vector of type `f32` or `f16`.
- Returns the change in value per vertical pixel.

### `fwidth` (Filter Width)

Computes the sum of the absolute values of the horizontal and vertical derivatives. This represents the total spatial variation of the expression.

**Syntax:**

```wgsl
fn fwidth(e: T) -> T
```

- Under the hood, `fwidth(e)` is equivalent to: `abs(dpdx(e)) + abs(dpdy(e))`.

---

## The Uniformity Analysis Rule

Derivative functions have a strict execution requirement: **they must only be invoked in uniform control flow.**

### Why This Rule Exists

Modern GPUs execute fragment shaders in parallel groups called **quads** (\(2 \times 2\) pixel clusters).
To compute a derivative like `dpdx(someValue)`, the GPU subtracts the value of `someValue` in the current pixel's thread from the value of `someValue` in the horizontally adjacent pixel's thread within the same quad.

```
+-----------+-----------+
|  Pixel 0  |  Pixel 1  |  -> dpdx is computed as:
| (Value A) | (Value B) |     Value B - Value A
+-----------+-----------+
|  Pixel 2  |  Pixel 3  |
|           |           |
+-----------+-----------+
```

If the control flow diverges—for example, if an `if (condition)` causes Pixels 0 and 2 to execute a block of code, but Pixels 1 and 3 skip it—horizontal neighbors are no longer executing the same instructions. Attempting to compute a derivative inside this branch would read uninitialized or garbage data from the inactive threads, leading to undefined behavior or visual artifacts.

To prevent this, WGSL's static **uniformity analysis** compiler pass strictly enforces that:

!!! important
    Any call to `dpdx`, `dpdy`, `fwidth`, or implicit derivative functions (such as `textureSample` which uses derivatives to select mipmaps) inside a divergent `if`, `switch`, or loop statement is a compile-time error.

---

## Practical Example: Manual Mipmap Level Calculation

The following fragment shader calculates the rate of change of texture coordinates to manually compute a mipmap level, illustrating how to safely declare variables and cast types.

<details class='example'>
<summary>Example</summary>

```wgsl
@group(0) @binding(0) var texture: texture_2d<f32>;
@group(0) @binding(1) var textureSampler: sampler;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    // textureSize returns vec2<u32>; cast it to vec2<f32> for type safety
    let texSize = vec2<f32>(textureSize(texture, 0));

    // Scale UV coordinates to texel coordinates
    let texCoord = uv * texSize;

    // Calculate total spatial variation of the texel coordinates (always in uniform control flow!)
    let dx = dpdx(texCoord);
    let dy = dpdy(texCoord);

    // Determine the level of detail (LOD) based on the maximum derivative length
    let deltaMax = max(dot(dx, dx), dot(dy, dy));
    let mipLevel = 0.5 * log2(deltaMax);

    // Sample texture with the explicitly calculated level
    return textureSampleLevel(texture, textureSampler, uv, mipLevel);
}
```

</details>

## Summary

- **Fragment Only**: Derivatives represent pixel changes on the screen, so they only exist in `@fragment` shaders.
- **Uniform Control Flow Required**: Because they read values from neighboring threads inside a \(2 \times 2\) pixel quad, they cannot be called inside divergent blocks.
- **Implicit Derivatives**: `textureSample` and `textureSampleCompare` implicitly compute derivatives for mipmapping. Thus, they are also restricted to uniform control flow! If you need to sample inside divergent control flow, use `textureSampleLevel` or `textureSampleGrad`.