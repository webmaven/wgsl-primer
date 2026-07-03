---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: "Vector Constructors"
shader: ./constructors.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
   {"expr": "zero_init",                       "type": "vec2f"},
   {"expr": "splat",                           "type": "vec2u"},
   {"expr": "construct_with_scalars",          "type": "vec3f"},
   {"expr": "construct_mix_of_scalar_and_vec", "type": "vec4i"},
   {"expr": "convert_vec3f_to_vec3u",          "type": "vec3u"},
   {"expr": "infer_type",                      "type": "vec3f"},
   {"expr": "implict_abstract_convert",        "type": "vec3f"}
]}'
---
In WGSL, vectors can be constructed or converted using several built-in constructor forms. There are three primary constructor styles, alongside type inference and element-wise conversion syntax.

| Style                                              | Syntax Pattern                | Description                                                       |
| :------------------------------------------------- | :---------------------------- | :---------------------------------------------------------------- |
| **[Zero-Value](#zero-value-constructors)**         | <code>vec<span class="template template-vec-n">N</span>&lt;<span class="template template-vec-t">T</span>&gt;()</code> / <code>vec<span class="template template-vec-n">N</span>f()</code> | Initializes all components to their default zero value.           |
| **[Splat](#splat-constructors)**                   | <code>vec<span class="template template-vec-n">N</span>&lt;<span class="template template-vec-t">T</span>&gt;(val)</code> / <code>vec<span class="template template-vec-n">N</span>f(val)</code> | Replicates a single scalar value across all components.           |
| **[Element-Wise](#element-wise-constructors)**     | <code>vec<span class="template template-vec-n">N</span>&lt;<span class="template template-vec-t">T</span>&gt;(x, y, ...)</code> | Initializes components from individual scalars or nested vectors. |
| **[Type-Inferring](#type-inferring-constructors)** | <code>vec<span class="template template-vec-n">N</span>(x, y, ...)</code> | Infers the component type from the supplied arguments.            |
| **[Type-Converting](#vector-type-conversions)**    | <code>vec<span class="template template-vec-n">N</span>&lt;<span class="template template-vec-t">T</span>&gt;(vector)</code> | Converts a vector of one element type to another element type.    |

---

## Zero-Value Constructors

Constructs a vector with each component initialized to its default/zero value (e.g., `0.0` for float, `0` for integer, or `false` for boolean).

```wgsl
let z_float = vec2f();       // Equivalent to vec2f(0.0, 0.0)
let z_bool  = vec3<bool>();  // Equivalent to vec3<bool>(false, false, false)
```

---

## Splat Constructors

Constructs a vector by replicating (or "splatting") a single scalar value across all of its components.

```wgsl
let s_int  = vec4i(5);         // Equivalent to vec4i(5, 5, 5, 5)
let s_bool = vec2<bool>(true); // Equivalent to vec2<bool>(true, true)
```

---

## Element-Wise Constructors

Constructs a vector by specifying the exact value of each component. The arguments can be individual scalars, or a mix of scalars and smaller vectors.

If a constructor argument is a vector, WGSL automatically **unpacks** its components in order. This allows you to easily build larger vectors from smaller ones.

```wgsl
// Constructing from individual scalar values
let coord = vec3u(1, 2, 3);

// Constructing by mixing scalars and a vec2 (automatic unpacking)
let color = vec4f(1.0, vec2f(2.0, 3.0), 4.0); // Equivalent to vec4f(1.0, 2.0, 3.0, 4.0)
```

---

## Type-Inferring Constructors

If you omit the element type suffix or generic parameter (using just the bare `vec2`, `vec3`, or `vec4` form), the compiler automatically infers the element type from the supplied arguments.

```wgsl
let v_u32    = vec4(1u);       // Infers vec4<u32> because '1u' is a u32
let v_aint   = vec2(1, 2);     // Infers vec2 of abstract-int (1, 2)
let v_afloat = vec2(1, 2.5);   // Infers vec2 of abstract-float (1.0, 2.5)
```

---

## Vector Type Conversions

You can convert a vector from one component type to another (e.g., from `f32` to `u32`) by passing the original vector as the sole argument to a constructor with the target type. This performs an element-wise cast of each component.

```wgsl
let v_float = vec3f(5.0, 7.5, 10.0);
let v_uint  = vec3u(v_float); // Truncates components: vec3u(5u, 7u, 10u)
```

---