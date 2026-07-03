---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Pointers As Short Names'
shader: ./pointers_as_short_names.wgsl
visualizer: /ts/buffer_viewer.ts
visualizerOptions: '{"length": 8, "datatype": "f32"}'
---
When working with deeply nested, complex structures, writing out full variable access paths like `particles[i].physics.transform.position` over and over is tedious, error-prone, and clutters your shader code. 

Inside a function, you can combine the address-of operator `&` with an immutable [let-declaration](../../variables/let.md) to create a clean, ultra-fast **short name** (alias pointer) targeting a sub-element inside a larger structure.

---

## Member Access Precedence: The Parentheses Rule

When using pointers as short names to access structure fields or array items, you must be careful with **operator binding precedence**.

In WGSL, member access (the `.` operator) and array indexing (the `[]` operator) **bind more tightly** than the dereference operator (`*`).

<div class="precedence-block">

### Why `*p.pos` is a Compiler Error

If you have a pointer `p` to a structure and write:

```wgsl
*p.pos = 5.0; // ❌ Compile Error!
```

The compiler parses this according to precedence as:

```wgsl
*(p.pos) = 5.0;
```

This means: *"Access member `.pos` of the pointer `p`, then dereference the result."* However, `p` is a **pointer**, not a structure. Pointers do not have members!

### The Correct Way: `(*p).pos`

To solve this, you must wrap the dereference in parentheses to force the compiler to resolve it first:

```wgsl
(*p).pos = 5.0; //  Success!
```

This tells the compiler: *"Dereference `p` first to get the underlying structure reference, and then access member `.pos`."*

</div>

---

!!! tip "Precedence Reference Cheat-Sheet"
    Always parenthesize dereferences before doing member access or array indexing:
    
    * **Structure Field**: `(*p).member`
    * **Array Indexing**: `(*p)[index]`

---

## Playground Walkthrough

In the accompanying interactive playground, we use the **Buffer Viewer** to show how input buffer values are transformed into output buffer values. 

The shader defines a custom `DataPoint` structure:
```wgsl
struct DataPoint {
    val: f32,
    scaled: f32,
}
```

Inside the `main` entrypoint, we load values from the input buffer, load them into a local `DataPoint` instance, and then use `&` to create a pointer short-name to that structure:
```wgsl
let p = &data;
```

We then cleanly read and update the structure members using correct precedence:
```wgsl
let original = (*p).val;
(*p).scaled = original * 3.0;
```

The computed values are then written to the output storage buffer. You can click on the input cells below to modify the values in real-time and watch the GPU animate the scaled output!