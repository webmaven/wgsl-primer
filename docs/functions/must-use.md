---
title: '@must_use'
shader: ./must-use.wgsl
visualizer: /ts/value_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "calculate_critical_factor(2.5)", "type": "f32"}, {"expr": "standard_calculation(4.2)", "type": "f32"}]}'
---

# The `@must_use` Attribute

In shader programming, functions are primarily designed to calculate values rather than perform stateful side effects. If you call a pure mathematical function but discard its returned result, the entire computation is wasted. This is almost always a logical bug in your shader.

To prevent these silent bugs, WGSL provides the `@must_use` attribute. When applied to a function, the compiler will refuse to compile your shader if that function's returned value is discarded.

---

### The `@must_use` Syntax

To declare a custom function as must-use, prepend its declaration with the `@must_use` attribute:

<code>@must_use fn <span class="template template-fn-name">name</span>(<span class="template template-fn-params">parameters</span>) -&gt; <span class="template template-fn-ret">return_type</span> { <span class="template template-fn-body">body</span> }</code>

*   The `@must_use` attribute is only valid on functions that explicitly declare a <span class="template template-fn-ret">return_type</span>.
*   If a function has no return value (a void function), adding `@must_use` is a compile-time error.

---

### Why is `@must_use` Safety-Critical?

On highly parallel GPUs, computational operations are extremely resource-sensitive. For example, if you calculate a coordinate projection or a normal vector transformation but fail to use the result, you waste precious clock cycles. 

Moreover, discarding values often indicates that a developer forgot to write a critical line of code, such as applying a calculated translation to a vertex position. The `@must_use` attribute acts as an automated compiler-enforced safeguard to catch these mistakes instantly.

---

### Native WGSL Built-ins

To protect you from common bugs, almost all of WGSL's native mathematical and vector utilities are natively annotated as `@must_use`. If you attempt to write a statement that contains just a built-in math call, the compiler will error out:

*   **Trigonometry**: `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`
*   **Vector Math**: `dot()`, `cross()`, `normalize()`, `length()`, `distance()`
*   **Arithmetic**: `clamp()`, `min()`, `max()`, `pow()`, `sqrt()`, `abs()`

---

### What Qualifies as "Using" a Value?

The compiler is satisfied as long as the returned value is consumed or stored in one of the following ways:

#### 1. Stored in a Variable or Constant
Saving the output directly into a memory cell:
```rust
let rotated_pos = rotate_vector(position, angle);
```

#### 2. Embedded in a Larger Expression
Using the output directly inside a broader calculation:
```rust
let offset = dot(normal, light_dir) * 0.5;
```

#### 3. Used to Control Execution Flow
Utilizing the result inside a loop, conditional statement, or branch:
```rust
if (distance(p1, p2) < 0.001) {
    discard;
}
```

#### 4. Passed as an Argument to Another Function
Nesting the function call as an input parameter:
```rust
let pixel_color = shade_pixel(normalize(surface_normal));
```

---

### Try it in the Playground

In the interactive playground code, we have defined a custom `@must_use` function `calculate_critical_factor()`. Notice how the commented-out statement `calculate_critical_factor(2.5);` would crash compilation. 

Uncomment line 43 in the playground to observe the compile error directly, then fix it by assigning the result to a variable.
