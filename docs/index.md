---
# Copyright ©2026 Michael R. Bernstein. All new modifications licensed under CC-BY 4.0.
# Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
IsHome: true
title: "WGSL: A Primer"
shader: ./index.wgsl
visualizer: /ts/graphics_visualizer.ts
---

<!-- Force pages rebuild -->

# WGSL: A Primer

<p class="primer-subtitle">An introductory tour of the WebGPU Shader Language</p>

This site is a quick introduction to the [WebGPU Shading
Language](https://w3.org/TR/WGSL). The primer provides an overview
of the syntax and features of WGSL, but assumes a familiarity with
programming.

The primer provides the WGSL shaders for each example. The shaders can be
edited in the text view on the right (or below), and the resulting output is displayed
below the editor.

The editor provides:

- Automatic execution of the entered shader.
- Inline error messages for shader compilation errors.
  Errors also appear in the developer console, so it may be handy
  to keep that open too.
- Pressing `ctrl-o` when the cursor is on an attribute (e.g. `@builtin`)
  a builtin value (e.g. `vertex_index`) or many of the builtin functions
  (e.g. `sin`) to show documentation on selected element.

Each of these shaders can serve as the starting point for your own
exploration.

!!! question "Warmup Activity"
    As a warmup, edit the `frag_main` function. First, uncomment the assignment on line 67 (which rotates the color values clockwise: `final_color = final_color.gbr;`). Then, instead, try uncommenting the assignment on line 69 (which rotates the color values counter-clockwise: `final_color = final_color.brg;`). What happens to the gradient's colors?

The primer is organized into the following sections:

- **[Functions](functions/index.md)**: Function syntax, calls, the `@must_use` attribute, and entry points.
- **[Types](types/index.md)**: Supported types in WGSL, from basic scalars and vectors to structures, pointers, and atomics.
- **[Expressions](expressions/index.md)**: Operators and different evaluation stages (constant, override, runtime).
- **[Variables & Constants](variables/index.md)**: Declaration and usage of mutable variables (`var`) and immutable values (`const`, `override`, `let`).
- **[Control Flow](control-flow/index.md)**: Branching and looping statements (`if`, `switch`, `loop`, `while`, `for`).
- **[Binding Points](binding-points/index.md)**: Connection of shaders to CPU-side resources like buffers and textures using binding points and attributes.
- **[Uniformity Analysis](uniformity-analysis/index.md)**: Compile-time execution uniformity tracking for derivative and barrier safety.

Each section has several sub-pages, and you can navigate forward
and backward using the buttons on the bottom of each page, or by using the
left and right keys on your keyboard.

