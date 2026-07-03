---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Arrays Overview'
---
An array is a sequentially allocated, contiguous collection of elements of the same type. In WGSL, arrays are zero-indexed: the first element is located at index \(0\), and the \(i\)-th element is accessed via the subscript operator `a[i]`.

WGSL divides arrays into two main categories:

1. **Fixed-Size Arrays**: The element count is known at compile-time or pipeline-creation time. Declared as <code>array&lt;<span class="template template-array-t">T</span>, <span class="template template-array-n">N</span>&gt;</code>.
2. **Runtime-Sized Arrays**: The element count is determined at runtime based on the size of the bound buffer. Declared as <code>array&lt;<span class="template template-array-t">T</span>&gt;</code>.

---

## Type Strictness and Safety

WGSL enforces strict typing rules. Unlike languages with implicit conversions or dynamic typing:

- Every element in an array must share the exact same type.
- There is **no implicit type coercion**. For example, initializing an `array<f32, 2>` with a mix of float and integer literals (such as `1.0` and `2`) will trigger a compilation error.
- Strict type matching is a zero-overhead compile-time feature that prevents performance degradations and guarantees predictable code execution across different hardware and GPU driver compilers.

---

## Array Constructors

Fixed-size arrays can be created using several constructor syntaxes depending on whether the element type and element count are specified explicitly or inferred.

### 1. Explicit Constructor
To construct an array by explicitly specifying both the element type and the size:

```wgsl
let explicitly_typed = array<f32, 3>(1.0, 2.0, 3.0);
```

### 2. Inferred Constructor
If the constructor arguments have a consistent type, the compiler can automatically infer the element type and count. This avoids redundant declarations:

```wgsl
// Infers type: array<f32, 3>
let inferred_array = array(1.0, 2.0, 3.0);
```

### 3. Zero-Initialization Constructor
Invoking the constructor with no arguments initializes all elements of the array to their zero-value (e.g., `0.0` for floats, `0` for integers):

```wgsl
// Initializes to: array<i32, 5>(0, 0, 0, 0, 0)
let zeroed_array = array<i32, 5>();
```

---

## Memory Layout and Contiguity

Because array elements are stored contiguously in memory, they are highly cache-friendly. The layout of an array is determined by its **element stride**, which represents the byte distance from the start of one element to the start of the next. By default, the stride is the size of the element type aligned to its natural alignment requirements.

!!! note
    Runtime-sized arrays do not have a defined constructor, because their sizes are not determined until the shader is executed on the GPU.

---

## Section Navigation

- [Fixed-Size Arrays](fixed-size-arrays.md): Compile-time arrays, nested multi-dimensional structures, custom strides, and out-of-bounds safety.
- [Runtime-Sized Arrays](runtime-sized-arrays.md): Buffer-backed arrays of indefinite size and dynamic length queries using `arrayLength`.