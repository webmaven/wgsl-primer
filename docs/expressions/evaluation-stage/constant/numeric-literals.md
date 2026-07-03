---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Numeric Literals'
---
A numeric literal in WGSL is a constant-expression representing a number. It can be written in multiple formats (including decimal and hexadecimal) and can optionally include a suffix that forces a specific concrete type.

---

## Suffixed Literals

Adding a suffix to a numeric literal forces the value to have a concrete, fixed-precision type:

| Suffix | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `i` | `i32` | 32-bit signed integer | `42i`, `-10i` |
| `u` | `u32` | 32-bit unsigned integer | `42u`, `0xFFu` |
| `f` | `f32` | 32-bit single-precision float | `3.14f`, `1.0f`, `1e-3f` |
| `h` | `f16` | 16-bit half-precision float (requires extension) | `2.5h`, `0.5h` |

!!! tip "Performance with f16 (`h` Suffix)"
    The half-precision float `f16` type is extremely important for modern mobile and embedded GPUs, where it halves memory bandwidth and significantly increases arithmetic throughput. 
    
    Using the `h` suffix requires enabling the `f16` extension at the very top of your shader module:
    
    ```wgsl
    enable f16;
    
    const scale: f16 = 1.5h;
    ```

---

## Unsuffixed Literals & Abstract Types

If you write a numeric literal without a suffix, its type is automatically **abstract**. This allows the compiler to treat constant numeric values with extremely high precision at compile time before they are assigned to a concrete fixed-precision type:

- **`abstract-float`**: Any unsuffixed literal with a decimal point (e.g., `1.2`) or an exponent (e.g., `1e2`).
- **`abstract-int`**: Any unsuffixed integer literal (e.g., `42` or hex `0xFF`).

When you assign an unsuffixed literal to a typed variable, the compiler implicitly resolves the abstract type to the concrete type required by the variable:

```wgsl
let a: f32 = 1.5;     // abstract-float 1.5 resolves to f32
let b: i32 = 10;      // abstract-int 10 resolves to i32
let c: u32 = 10;      // abstract-int 10 resolves to u32
```

!!! tip "Deep-Dive: Abstract Numerics Semantics"
    While unsuffixed literals represent the entry-point to WGSL's compile-time types, their full behaviors (64-bit CPU evaluation, implicit conversions, default resolution rules, and strict bounds checking) are detailed in the **[Abstract Numerics](../../../types/abstract-numerics.md)** reference guide.

---

## Hexadecimal Integer Formats

For bitwise operations, masking, and memory structures, hexadecimal integers are much easier to read than decimal integers. Hex integers start with the prefix `0x` or `0X` followed by hex digits (`0-9`, `a-f`, `A-F`):

```wgsl
const mask_32: u32 = 0xFFFFFFFFu; // All 32 bits set to 1
const mask_8: u32  = 0x000000FFu; // Rightmost 8 bits set to 1
```

---

## Hexadecimal Floating-Point Formats

WGSL also supports **hexadecimal floats**, which are extremely common in professional graphics. They allow programmers to write exact, bit-precise floating-point values (like precision limits, bias factors, or specific IEEE 754 bit layouts) without rounding or decimal representation errors.

A hex float begins with `0x` or `0X`, followed by a hexadecimal significand (mantissa), a mandatory exponent indicator `p` or `P`, and a decimal power-of-2 exponent:

<code>0x<span class="template template-struct-v1">significand</span>p<span class="template template-struct-v2">exponent</span></code>

Below is a breakdown of a real-world example: `0x1.5p-3`

- `0x1.5`: The significand in hexadecimal. In hex, \(0.5\) is equivalent to \(\frac{5}{16} = 0.3125\), so `1.5` is \(1 + \frac{5}{16} = 1.3125\) in decimal.
- `p-3`: This specifies a binary exponent of \(2^{-3}\) (which is \(\frac{1}{8} = 0.125\)).
- The final value is \(1.3125 \times 2^{-3} = 0.1640625\).

```wgsl
const precise_float: f32 = 0x1.5p-3f; // Evaluates exactly to 0.1640625f
```
