---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
title: "Structures Overview"
shader: ./index.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [
    {"expr": "a_bicycle.num_wheels",  "type": "u32"},
    {"expr": "a_bicycle.mass_kg",  "type": "f32"},
    {"expr": "bike_num_wheels",  "type": "u32"},
    {"expr": "all_zeros_vehicle.num_wheels",  "type": "u32"},
    {"expr": "all_zeros_vehicle.mass_kg",  "type": "f32"},
    {"expr": "light.intensity", "type": "f32"},
    {"expr": "light_shininess", "type": "f32"}
]}'
---
In WebGPU, shaders process complex multi-dimensional data such as 3D meshes, material properties, and physical lights. A **structure** is a user-defined custom data type that groups related variables into a single, cohesive unit.

Rather than managing disjointed values or passing numerous individual parameters to functions, you can declare structures to modularize and logically model your physical graphics pipelines.

---

## Declaring Structures

Structures are declared at module scope (outside of functions) using the `struct` keyword, followed by the struct name and a comma-separated list of member variables inside braces:

```wgsl
struct Vehicle {
  num_wheels: u32,
  mass_kg: f32, // Note: trailing commas are fully optional
} // Semicolons after closing braces are also optional
```

Each member variable must have a unique identifier and a concrete data type.

---

## Constructing Structure Values

You can construct a structure value using its functional constructor. WGSL provides two primary initialization paths:

### 1. All-Member Constructor
To initialize a structure with specific values, pass arguments to the constructor in the exact order members were declared:

<code><span class="template template-struct-name">MyStruct</span>(<span class="template template-struct-v1">val_1</span>, <span class="template template-struct-v2">val_2</span>, <span class="template template-struct-v3">...</span>)</code>

* Here, <span class="template template-struct-v1">val_1</span> initializes the first member of the structure, <span class="template template-struct-v2">val_2</span> initializes the second member, and so on.
* The types of the passed expressions must strictly match the declared types of the members. For example:
  ```wgsl
  const a_bicycle = Vehicle(2u, 10.5); // num_wheels is u32, mass_kg is f32
  ```

### 2. Zero-Initialized Constructor
If a structure is [constructible](http://w3.org/TR/WGSL#constructible), you can omit all arguments to construct a value with all members recursively initialized to zero (or equivalent default states):

<code><span class="template template-struct-name">MyStruct</span>()</code>

* For instance, `Vehicle()` constructs a `Vehicle` with `num_wheels` set to `0u` and `mass_kg` set to `0.0`.

---

## Accessing and Mutating Members

Use standard dot-member notation (`.`) to read or write a member variable:

* **Reading**: `const wheels = a_bicycle.num_wheels;` retrieves the current value of the member.
* **Mutating**: Within functions, if a structure is declared as a mutable variable (`var`), individual members can be updated directly without affecting the remaining data:
  ```wgsl
  var result = v;
  result.mass_kg += cargo_mass; // Only mass_kg is mutated
  ```

---

## Structural Nesting

WGSL supports **structural nesting**, meaning a structure can contain another structure as a member variable. This is highly useful in graphics to represent hierarchical entities, such as nested material lighting structures:

```wgsl
struct Material {
  color: vec3<f32>,
  shininess: f32,
}

struct PointLight {
  position: vec3<f32>,
  intensity: f32,
  material: Material, // Nested struct member!
}
```

To initialize nested structures, nest their constructors:
```wgsl
const default_material = Material(vec3<f32>(1.0, 0.5, 0.0), 32.0);
const light = PointLight(vec3<f32>(0.0, 5.0, -2.0), 1.5, default_material);
```

You can read nested members by chaining dot-member accessors together:

* `light.material.shininess` accesses the nested `shininess` member.
