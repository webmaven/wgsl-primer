# Tour of WGSL - Inline Styling & Notation Style Guide

This style guide establishes explicit, unambiguous rules and semantic constraints for using **Inline Code**, **Inline Code with Templates**, **Inline Math**, and **PyMdown Admonitions** across the Tour of WGSL curriculum.

Ensuring a clean, premium, and zero-jitter layout requires separating these notation categories based on their exact semantic roles.

---

## 1. Notation Categories at a Glance

| Style Category                 | Formatting Syntax                                          | Visual Appearance                                                                         | Primary Semantic Role                                                                                                                  |
| :----------------------------- | :--------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Inline Code**                | `` `code` ``                                               | Monospace font, backdrop shading, rounded borders, compact padding.                       | Concrete, literal programming constructs, variable identifiers, explicit type instances, keywords, file names, or CLI commands.        |
| **Inline Code with Templates** | `<code>... <span class="template-*">...</span> ...</code>` | Monospace font with nested, colored, border-highlighted parameter chips.                  | Generic syntax templates, parameterized type signatures, or structure definitions where parameters require color-coded linkage.        |
| **Standalone Template Chips**  | `<span class="template template-*">Param</span>`           | Standing alone inside prose. Colored, border-highlighted chip matching a parent template. | Referencing a specific parameter/placeholder on its own in the explanatory sentences following a template definition.                  |
| **Inline Math**                | `\( math \)`                                               | High-quality, serif-based MathJax LaTeX mathematical typesetting (no border or backdrop). | Pure mathematical notation, algebraic variables, matrix/vector dimensionalities, algebraic coordinate indices, or geometric equations. |
| **Admonitions**                | `!!! type "Title"`                                         | Highlighted callout panel with a colored left-border, custom title, and icon.             | Off-flow contextual highlights, warnings, tips, exercises, or architectural notes.                                                     |

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
  - **Structure Syntax Definition**: `<code><span class="template template-struct-name">MyStruct</span>(<span class="template template-struct-v1">val_1</span>, <span class="template template-struct-v2">val_2</span>, <span class="template template-struct-v3">...</span>)</code>`
  - **Layout Attributes Definition**: `<code>@align(<span class="template template-align-n">N</span>)</code>` or `<code>@size(<span class="template template-size-n">N</span>)</code>`
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

## 2.1 Template Class Color Schemes

To maintain logical organization and structural linkage, template parameter classes are mapped to distinct, premium color-coded schemes inside `style.scss`:

| Class Name                                                                                            | Color-Coding Scheme                                | Represented Concepts / Parameters                            |
| :---------------------------------------------------------------------------------------------------- | :------------------------------------------------- | :----------------------------------------------------------- |
| `template-vec-n`<br>`template-array-n`<br>`template-mat-c`                                            | **Light Blue/Cyan**                                | Dimensional sizes, matrix column counts, array lengths.      |
| `template-vec-s`                                                                                      | **Green**                                          | Vector coordinate components/swizzles.                       |
| `template-vec-t`<br>`template-array-t`<br>`template-atomic-t`<br>`template-ptr-t`<br>`template-mat-t` | **Light Red/Coral**                                | Underlying element types (`f32`, `u32`, `i32`, `atomic`).    |
| `template-ptr-as`                                                                                     | **Light Blue/Cyan**                                | Pointer address spaces (`uniform`, `storage`, `private`).    |
| `template-ptr-am`                                                                                     | **Green**                                          | Pointer access modes (`read`, `write`, `read_write`).        |
| `template-struct-name`                                                                                | **Gold/Amber**                                     | Custom structure or class-level constructor names.           |
| `template-struct-v1`<br>`template-struct-v2`<br>`template-struct-v3`                                  | **Distinct Multi-Colors<br>(Blue, Orange, Coral)** | Positional constructor parameter values in sequential order. |
| `template-align-n`<br>`template-size-n`                                                               | **Green**                                          | Hardware layout attributes constraints and sizes.            |

---

## 3. PyMdown Admonition Guidelines

Tour of WGSL uses Python-Markdown's `admonition` extension to render rich, structured sidebar callouts. Never use raw HTML container elements (`<div class="warning">`, etc.) for callout boxes.

### Block Syntax

An admonition block begins with exactly three exclamation points (`!!!`), followed by a space, the admonition type identifier, and an optional custom title enclosed in double quotes:

```markdown
!!! note "Optional Custom Title"
The content of the admonition must be indented by exactly four spaces.
You can use inline formatting like `inline code` and \(math\) inside.
```

### Supported Admonition Types

| Admonition Type | Recommended Usage                                                                                        | Default Title |
| :-------------- | :------------------------------------------------------------------------------------------------------- | :------------ |
| `note`          | Background context, helpful explanations, or non-blocking implementation details.                        | Note          |
| `info`          | Conceptual information, reference references, or extra reading topics.                                   | Info          |
| `tip`           | Performance optimizations, best practices, or compiler optimization hints.                               | Tip           |
| `important`     | Mandatory compiler constraints, target architecture requirements, or must-know rules to compile shaders. | Important     |
| `warning`       | High-risk pitfalls, concurrency issues, driver compiler bugs, or breaking API behaviors.                 | Warning       |
| `question`      | Multi-choice exercises, self-assessment questions, or interactive challenges.                            | Question      |

### Semantic & Styling Rules

1. **Four-Space Indentation**: All lines within the admonition block must be indented with **exactly four spaces**. Indentation errors will break static generation or render content outside the block.
2. **Title Descriptiveness**: Avoid redundant custom titles that match the block's type (e.g., do not write `!!! note "Note"`). Only use custom titles if they provide specific context (e.g., `!!! warning "Beware: Weak Ordering"`). If a custom title is unnecessary, omit it entirely to use the default title.
3. **No HTML Blocks**: Do not use raw HTML boxes or custom alert frames in place of admonitions. Native admonitions are styled consistently across dark and light themes.

---

## 3.1 Mermaid Diagram Syntax & Constraints

To ensure Mermaid diagrams render correctly across all platforms and do not trigger parser syntax errors during build time, adhere strictly to the following syntactic constraints:

1. **Explicit Subgraph Identifiers & Labels**: Subgraph declarations must **never** use unquoted spaces, parentheses, or other special characters directly in their identifiers. Always declare an alphanumeric, snake_case identifier and provide a quoted label in square brackets:
   - ❌ **Incorrect**: `subgraph Module Scope (Globals)`
   - ✔️ **Correct**: `subgraph module_scope ["Module Scope (Globals)"]`
2. **Quoted Node Text with Special Characters**: Any node text or labels containing spaces, parentheses, brackets, or single/double quotes must be enclosed within double quotes:
   - ❌ **Incorrect**: `GlobalA[Global Constant: 'scale']`
   - ✔️ **Correct**: `GlobalA["Global Constant: 'scale'"]`
3. **Safe Line Breaks**: If a line break (`<br>`) is required inside a node label, the entire label must be enclosed in double quotes:
   - ❌ **Incorrect**: `ShadowA[Local variable: 'scale' <br>(Shadows Global Constant)]`
   - ✔️ **Correct**: `ShadowA["Local variable: 'scale' <br>(Shadows Global Constant)"]`

---

## 3.2 Heading Hierarchy & Redundant Header Antipattern

To ensure semantic clarity, web accessibility (a11y), and a consistent visual layout across the platform, the Tour of WGSL enforces strict rules regarding heading usage:

1. **No Redundant Page Headings**: ProperDocs automatically generates the main title (`<h1>`) of each page from the frontmatter `title` metadata. Adding a duplicate `# ` or `## ` heading at the very top of the markdown body content is strictly prohibited. The markdown body must start directly with an introductory paragraph, allowing content to flow immediately under the page's auto-generated title.
2. **No Secondary H1 Headings**: Every page must have exactly one `<h1>` element, which is the auto-generated page title. Therefore, using the `# <Heading>` (H1) syntax inside a markdown file's body is strictly prohibited. Sub-sections within a page must start at `## ` (H2) or lower.
3. **No Immediate H1 followed by H2 (H1+H2 Antipattern)**: Having an H1 immediately followed by a redundant H2 subheading without intervening prose is an antipattern. For example, writing `# My Title` immediately followed by `## My Title in WGSL` creates structural duplication, visual clutter, and breaks screen reader flow.

---

## 3.3 Pedagogical & Reference Tone Guidelines (Anti-Handholding Principle)

The Tour of WGSL is designed for professional programmers and GPGPU developers. To maintain an authoritative, clean, and highly technical tone:

1. **Remove Conversational/Hand-holding Phrases**: Avoid conversational, patronizing, or "tutorial-style" transitions such as:
   - "In this section, we will learn..." or "What you will learn"
   - "Let's dive in" or "Let's find out how..."
   - "Discover how..." or "Congratulations! You have..."
2. **Objective, Authoritative & Factual Tone**: Always write in an objective, factual, and reference-style tone. Focus on explaining technical constraints, specifications, hardware execution models, and compiler characteristics directly.
3. **Direct Explanations**: Use clear, concise, and direct explanations instead of leading the reader through a slow, conversational narrative.

---

## 4. Correct vs. Incorrect Usage Examples

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

### Case 5: Alert Callouts

- ❌ **Incorrect (GitHub Alerts)**: `> [!WARNING] Avoid weak ordering bugs.`
- ❌ **Incorrect (HTML Alert)**: `<div class="warning">Avoid weak ordering bugs.</div>`
- ✔️ **Correct**:
  ```markdown
  !!! warning "Beware: Weak Ordering"
  Avoid weak ordering bugs by inserting synchronization barriers.
  ```
  - _Rationale_: This utilizes native, theme-harmonized PyMdown admonitions, with a descriptive and clean title.

---

## 5. Enforcement Guidelines for the Agent

1.  **Strict SASS Scoping**: Group rules under `code:not(pre code)` and avoid custom wrappers. Let the browser handle standard inline flow (`display: inline`) to guarantee that multi-line wrapping does not cause vertical height fluctuations.
2.  **Audit on Edits**: When editing any `.md` page inside `docs/`, check if inline backticks contain parameterized symbols (like `<T>`). If they do, refactor them to use semantic `<code>` with nested colored parameter spans.
3.  **Standardize MathJax Delimiters**: Scan and replace any remaining single-dollar mathematical indicators (`$ ... $`) with standard LaTeX delimiters `\(` and `\)`.
4.  **Enforce PyMdown Admonitions**: Whenever a warning, note, or alert block is found using blockquotes (`> [!type]`) or raw HTML, immediately convert it to PyMdown syntax.
