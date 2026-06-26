# Tour of WGSL - Inline Styling & Notation Style Guide

This style guide establishes explicit, unambiguous rules and semantic constraints for using **Inline Code**, **Inline Code with Templates**, and **Inline Math** across the Tour of WGSL curriculum.

Ensuring a clean, premium, and zero-jitter layout requires separating these three forms of inline elements based on their exact semantic roles.

---

## 1. Notation Categories at a Glance

| Style Category                 | Formatting Syntax                                          | Visual Appearance                                                                         | Primary Semantic Role                                                                                                                  |
| :----------------------------- | :--------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Inline Code**                | `` `code` ``                                               | Monospace font, backdrop shading, rounded borders, compact padding.                       | Concrete, literal programming constructs, variable identifiers, explicit type instances, keywords, file names, or CLI commands.        |
| **Inline Code with Templates** | `<code>... <span class="template-*">...</span> ...</code>` | Monospace font with nested, colored, border-highlighted parameter chips.                  | Generic syntax templates, parameterized type signatures, or structure definitions where parameters require color-coded linkage.        |
| **Standalone Template Chips**  | `<span class="template template-*">Param</span>`           | Standing alone inside prose. Colored, border-highlighted chip matching a parent template. | Referencing a specific parameter/placeholder on its own in the explanatory sentences following a template definition.                  |
| **Inline Math**                | `\( math \)`                                               | High-quality, serif-based MathJax LaTeX mathematical typesetting (no border or backdrop). | Pure mathematical notation, algebraic variables, matrix/vector dimensionalities, algebraic coordinate indices, or geometric equations. |

---

## 2. Unambiguous Styling Rules

### Rule A: Inline Code (Standard Backticks)

Use inline code **strictly** for concrete, non-parameterized, and syntactically valid programming elements.

- **When to Use**:
  - **Identifiers & Variables**: `` `my_variable` ``, `` `main` ``
  - **Concrete Type Instances**: `` `vec3<f32>` ``, `` `u32` ``, `` `array<f32, 5>` ``
  - **Language Keywords**: `` `let` ``, `` `const` ``, `` `override` ``, `` `var` ``
  - **Builtin Functions**: `` `dpdx()` ``, `` `textureSample()` ``
  - **File Paths & Shell Commands**: `` `style.scss` ``, `` `npm run build` ``
- **Prohibited**: Never use inline code for generic/parameterized signatures (e.g. do not write `` `vecN<T>` ``). These must use HTML templates. Never use it for abstract mathematical coordinates or algebraic indices.

### Rule B: Inline Code with Templates (Semantic `<code>` + `<span class="template">`)

Use this compound layout **strictly** for defining generic syntax structures, signature definitions, or type templates.

- **When to Use**:
  - **Vector Syntax Definition**: `<code>vec<span class="template template-vec-n">N</span>&lt;<span class="template template-vec-t">T</span>&gt;</code>`
  - **Array Syntax Definition**: `<code>array&lt;<span class="template template-array-t">T</span>, <span class="template template-array-n">N</span>&gt;</code>`
  - **Matrix Syntax Definition**: `<code>mat<span class="template template-mat-c">C</span>x<span class="template template-mat-r">R</span>&lt;<span class="template template-mat-t">T</span>&gt;</code>`
  - **Pointer Syntax Definition**: `<code>ptr&lt;<span class="template template-ptr-as">AS</span>, <span class="template template-ptr-t">T</span>, <span class="template template-ptr-am">AM</span>&gt;</code>`
- **Prohibited**: Do not embed raw markdown backticks inside HTML `<code>` elements. Do not use `<span class="template">` as an outer wrapper (rely on `<code>` as the parent).

### Rule C: Standalone Template Chips

Use standalone template chips (`<span class="template template-*">...</span>`) outside of code blocks **only** when directly explaining individual parameters from a recently declared template signature.

- **When to Use**:
  - `where <span class="template template-array-t">T</span> is the element type, and <span class="template template-array-n">N</span> is...`
- **Prohibited**: Do not use standalone template chips for general variables or non-parameter references. If a parameter is not linked to a specific type template, refer to it in inline code `` `T` `` or math \(T\) depending on context.

### Rule D: Inline Math (`\( ... \)`)

Use inline math **strictly** for mathematical and geometrical concepts. Do not mix code fonts with math fonts.

- **When to Use**:
  - **Algebraic Variables**: `\(x\)`, `\(y\)`, `\(e\)` (e.g., "with respect to \(x\)")
  - **Conceptual Dimensionality**: `\(2 \times 2\)` pixel clusters, an `\(M \times N\)` matrix.
  - **Mathematical Indices**: the `\(i\)`-th column, row `\(r\)`, column `\(c\)`.
  - **Vector Geometry**: the dot product `\(\vec{a} \cdot \vec{b}\)`.
- **Prohibited**:
  - Never use single dollar signs (`$ ... $`) as inline math delimiters due to collisions with shell commands, currency, and template macros. Always use `\(` and `\)`.
  - Never write actual programming variables, builtins, or types inside inline math (e.g., write `` `dpdx` ``, not `\(dpdx\)`).

---

## 3. Correct vs. Incorrect Usage Examples

### Case 1: Describing the index of a vector or array

- ❌ **Incorrect (Muddled Math & Code)**: "We extract the `i`-th element from the vector `vec3f`."
- ❌ **Incorrect (Muddled Math & Code)**: "We extract the \(i\)-th element from the vector \(vec3f\)."
- ✔️ **Correct**: "We extract the \(i\)-th element from the vector `vec3f`."
  - _Rationale_: The index \(i\) is an abstract mathematical count, so it is inline math. The type `vec3f` is a concrete programming literal, so it is inline code.

### Case 2: Declaring or describing a type syntax

- ❌ **Incorrect (Plain Code)**: "Fixed arrays are defined as `array<T, N>` where `T` is the type and `N` is the size."
- ❌ **Incorrect (Messy Nesting)**: "Fixed arrays are defined as `<code>array<<span class="template-array-t">T</span>, <span class="template-array-n">N</span>></code>`."
- ✔️ **Correct**: "Fixed arrays are defined as <code>array&lt;<span class="template template-array-t">T</span>, <span class="template template-array-n">N</span>&gt;</code>, where <span class="template template-array-t">T</span> is the element type and <span class="template template-array-n">N</span> is..."
  - _Rationale_: Defines a generic structure, so it uses HTML `<code>` and colored, border-highlighted template parameters. The following standalone tokens use the same color code to tie back to the signature.

### Case 3: Displaying concrete code examples

- ❌ **Incorrect (Redundant Templates)**: "For instance, we can write <code>array&lt;<span class="template template-array-t">f32</span>, <span class="template template-array-n">5</span>&gt;</code>."
- ✔️ **Correct**: "For instance, we can write `array<f32, 5>`."
  - _Rationale_: This is a concrete, syntactically valid instance of a type in a WGSL shader (not an abstract parameter/syntax definition), so it uses standard monospace backticks.

### Case 4: Dimensions and Layout

- ❌ **Incorrect (Monospace Math)**: "Shaders run on `2x2` pixel quads."
- ❌ **Incorrect (Raw Math Delimiters)**: "Shaders run on $2 \times 2$ pixel quads."
- ✔️ **Correct**: "Shaders run on \(2 \times 2\) pixel quads."
  - _Rationale_: The dimensions of a physical/mathematical pixel cluster are geometrical, requiring premium math formatting, and `\(` and `\)` prevent delimiter collisions.

---

## 4. Enforcement Guidelines for the Agent

1.  **Strict SASS Scoping**: Group rules under `code:not(pre code)` and avoid custom wrappers. Let the browser handle standard inline flow (`display: inline`) to guarantee that multi-line wrapping does not cause vertical height fluctuations.
2.  **Audit on Edits**: When editing any `.md` page inside `docs/`, check if inline backticks contain parameterized symbols (like `<T>`). If they do, refactor them to use semantic `<code>` with nested colored parameter spans.
3.  **Standardize MathJax Delimiters**: Scan and replace any remaining single-dollar mathematical indicators (`$ ... $`) with standard LaTeX delimiters `\(` and `\)`.
