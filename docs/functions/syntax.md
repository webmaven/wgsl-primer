---
title: 'Syntax'
shader: ./syntax.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "give_me_a_number()", "type": "i32"}, {"expr": "average(10.0, 20.0)", "type": "f32"}]}'
---

Functions are declared with `fn`.

A function `f` with no parameters and no return type has the form:

<details class='example'>
<summary>Example</summary>

```rust
fn f() {
  // function body
}
```

</details>

Function parameters are comma-separated, and declared between the `()`.
They have the form <code><span class="template">name</span> : <span class="template">type</span></code>.

<details class='example'>
<summary>Example</summary>

```rust
fn f(a : vec4f, b : i32) {
  // function body
}
```

</details>

Functions that return a value declare the function's return type between the parameter list and the function body.
The return type of this function is `vec3f`:

<details class='example'>
<summary>Example</summary>

```rust
fn negate(v : vec3f) -> vec3f {
  return -v;
}
```

</details>
