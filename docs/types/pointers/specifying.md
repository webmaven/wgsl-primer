---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Specifying a pointer type'
shader: ./specifying.wgsl
---
A pointer type in WGSL is parameterized. It defines not only the type of data being pointed to, but also where that data lives and what access permissions are allowed.

A pointer type is written in one of two ways:

* <code>ptr&lt;<span class="template template-ptr-as">AS</span>, <span class="template template-ptr-t">T</span>, <span class="template template-ptr-am">AM</span>&gt;</code> (with an explicit access mode)
* <code>ptr&lt;<span class="template template-ptr-as">AS</span>, <span class="template template-ptr-t">T</span>&gt;</code> (relying on the default access mode)

Where:

* <span class="template template-ptr-as">AS</span> is the **Address Space** (e.g. `function`, `private`, `workgroup`, `uniform`, `storage`).
* <span class="template template-ptr-t">T</span> is the **Store Type** (e.g. `f32`, `u32`, `vec3f`). This represents the underlying concrete type of the value being stored in memory.
* <span class="template template-ptr-am">AM</span> is the **Access Mode** (e.g. `read`, `read_write`).

---

## When to Specify the Access Mode

The access mode <span class="template template-ptr-am">AM</span> is **optional** for most address spaces, as they have strict default behaviors. In fact, WGSL compilers require you to **only** specify the access mode when the address space <span class="template template-ptr-as">AS</span> is `storage`.

For all other address spaces, you must omit the access mode—the compiler will implicitly use the default access mode of that address space.

---

## Address Space Reference Matrix

The following reference matrix summarizes how WGSL address spaces, memory tiers, and access modes combine:

<div class="tour-table-container">
  <table class="tour-table">
    <thead>
      <tr>
        <th>Address Space (<span class="template template-ptr-as">AS</span>)</th>
        <th>Default Access Mode</th>
        <th>Allowed Access Modes</th>
        <th>Hardware Tier</th>
        <th>Typical Store Types (<span class="template template-ptr-t">T</span>)</th>
      </tr>
    </thead>
    <tbody>
      <!-- function -->
      <tr>
        <td><span class="template template-ptr-as">function</span></td>
        <td><span class="template template-ptr-am">read_write</span></td>
        <td><code>read_write</code> only</td>
        <td style="color: #38bdf8; font-weight: 600;">Core Registers / L1</td>
        <td>Any constructible type</td>
      </tr>
      <!-- private -->
      <tr>
        <td><span class="template template-ptr-as">private</span></td>
        <td><span class="template template-ptr-am">read_write</span></td>
        <td><code>read_write</code> only</td>
        <td style="color: #38bdf8; font-weight: 600;">Core Registers / L1</td>
        <td>Any constructible type</td>
      </tr>
      <!-- workgroup -->
      <tr>
        <td><span class="template template-ptr-as as-workgroup">workgroup</span></td>
        <td><span class="template template-ptr-am">read_write</span></td>
        <td><code>read_write</code> only</td>
        <td style="color: #ff914d; font-weight: 600;">On-Chip LDS</td>
        <td>Any constructible type</td>
      </tr>
      <!-- uniform -->
      <tr>
        <td><span class="template template-ptr-as as-global">uniform</span></td>
        <td><span class="template template-ptr-am">read</span></td>
        <td><code>read</code> only</td>
        <td style="color: #34d399; font-weight: 600;">Global VRAM (Cached)</td>
        <td>Host-shareable structures, arrays</td>
      </tr>
      <!-- storage -->
      <tr>
        <td><span class="template template-ptr-as as-global">storage</span></td>
        <td><span class="template template-ptr-am">read</span></td>
        <td><span class="template template-ptr-am">read</span>, <span class="template template-ptr-am">read_write</span></td>
        <td style="color: #34d399; font-weight: 600;">Global VRAM (Uncached)</td>
        <td>Host-shareable structures, runtime arrays</td>
      </tr>
    </tbody>
  </table>
</div>

---

## Code Examples

In the accompanying shader code editor, we use alias definitions to inspect valid and invalid pointer declarations. 

Notice how `alias ptr_to_f32_in_storage_buffer_rw = ptr<storage, i32, read_write>` is completely legal because it targets `storage`, while adding a `read` access mode to a `private` pointer will fail shader compilation!