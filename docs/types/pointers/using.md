---
# Copyright ©2026 Michael R. Bernstein. Licensed under CC-BY 4.0.
# See root README.md for global project-wide upstream attributions.
title: 'Creating and Using Pointers'
shader: ./using.wgsl
visualizer: /ts/pointer_visualizer.ts
visualizerOptions: '{"fields": [{"expr": "run_test_age()", "type": "f32"}]}'
---
To work with pointers, WGSL provides two fundamental operators: the **Address-of (`&`)** operator to create a pointer, and the **Dereference (`*`)** operator to read or write the memory it references.

---

## 1. Creating Pointers: The Address-of (`&`) Operator

You can get a pointer to a variable (or part of a variable) by applying the `&` operator:

* **Whole Variables**: If `x` is a variable, then `&x` is a pointer referring to all the memory allocated for `x`.
* **Sub-components / Composites**: You can also take the address of a specific sub-member inside a structure or an array:
  - If `chair` is a custom struct with a member `legs` (an array of 4 values), then taking `&chair.legs[3]` returns a pointer pointing *strictly* to the last index of that sub-array.

---

## 2. Using Pointers: The Dereference (`*`) Operator

To access or modify the memory a pointer points to, you must apply the `*` operator to turn the pointer back into an active memory **Reference**.

In the WGSL type system:

1. `p` has type `ptr<AS, T>`.
2. `*p` has type `ref<AS, T>` (a **Reference**).

What happens to `*p` depends entirely on where it appears in your code:

* **Writing to Memory (L-Value)**: If `*p` appears on the left-hand side of an assignment, a write occurs.
  ```wgsl
  *p = 12u; // Writes the value 12 directly to the memory pointed to by p
  ```

* **Reading from Memory (R-Value)**: If `*p` appears anywhere else, the pointer is dereferenced and the value is read out.
  ```wgsl
  let current_val = *p; // Reads the value from the memory pointed to by p
  ```

---

!!! info "Interactive Pointer-Stack Memory Visualizer"
    This page features an interactive **Pointer-Stack Memory Visualizer** (visible in the right-hand panel on desktop, or integrated below on mobile). Click the navigation dots or directly select lines inside the code card to trace how GPU stack frames allocate variables, resolve address-of (`&`) bindings, and execute dereference (`*`) reads and writes step-by-step in real-time.

---

## Visualizing Pointer Memory Tracing

The diagram below shows how a pointer `px` resides in the thread stack frame as a compile-time alias pointing to the storage cell of variable `x`:

<div style="background: #0f172a; border: 1.5px solid #1e293b; border-radius: 12px; padding: 24px; margin: 24px 0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; align-items: center; gap: 16px;">
  
  <div style="display: flex; flex-direction: column; width: 100%; max-width: 480px; gap: 12px;">
    <div style="text-align: center; color: #cbd5e1; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
      Thread Execution Stack Frame (f)
    </div>
    
    <!-- Variable x Cell -->
    <div style="display: flex; border: 1.5px solid #38bdf8; border-radius: 8px; background: rgba(56, 189, 248, 0.05); overflow: hidden; box-shadow: 0 0 15px rgba(56, 189, 248, 0.05);">
      <div style="flex: 2; padding: 12px; border-right: 1.5px solid #38bdf8; background: rgba(56, 189, 248, 0.1); display: flex; flex-direction: column; justify-content: center;">
        <span style="color: #38bdf8; font-size: 12px; font-weight: 700;">Variable x</span>
        <span style="color: #64748b; font-size: 9px; font-weight: 500;">Type: f32 | Addr: 0x1004</span>
      </div>
      <div style="flex: 3; padding: 12px; display: flex; align-items: center; justify-content: center; position: relative;">
        <span style="color: #cbd5e1; font-family: monospace; font-size: 14px; font-weight: 600;">3.0</span>
        <!-- Target dot for pointer arrow -->
        <span style="position: absolute; left: 0; width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; transform: translateX(-50%); box-shadow: 0 0 6px #38bdf8;"></span>
      </div>
    </div>

    <!-- Pointer Path Connector -->
    <div style="display: flex; flex-direction: column; align-items: center; height: 32px; justify-content: center; position: relative;">
      <!-- Vertical dotted pointer arrow line -->
      <div style="width: 2px; height: 100%; border-left: 2px dotted #38bdf8;"></div>
      <div style="position: absolute; bottom: 0; transform: translateY(4px); border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #38bdf8;"></div>
    </div>

    <!-- Pointer px Cell -->
    <div style="display: flex; border: 1.5px solid #f43f5e; border-radius: 8px; background: rgba(244, 63, 94, 0.05); overflow: hidden; box-shadow: 0 0 15px rgba(244, 63, 94, 0.05);">
      <div style="flex: 2; padding: 12px; border-right: 1.5px solid #f43f5e; background: rgba(244, 63, 94, 0.1); display: flex; flex-direction: column; justify-content: center;">
        <span style="color: #f43f5e; font-size: 12px; font-weight: 700;">Pointer px</span>
        <span style="color: #64748b; font-size: 9px; font-weight: 500;">Type: ptr&lt;function, f32&gt;</span>
      </div>
      <div style="flex: 3; padding: 12px; display: flex; align-items: center; justify-content: center;">
        <span style="color: #cbd5e1; font-family: monospace; font-size: 12px; font-weight: 600;">&amp;x (Ref: 0x1004)</span>
      </div>
    </div>
  </div>

  <div style="color: #64748b; font-size: 10px; font-weight: 500; text-align: center; max-width: 400px; line-height: 1.4;">
    Creating pointer <code style="color: #f43f5e; background: none; padding: 0;">px = &amp;x</code> stores the address of <code style="color: #38bdf8; background: none; padding: 0;">x</code>. Dereferencing <code style="color: #f43f5e; background: none; padding: 0;">*px</code> directly reads or writes to <code style="color: #38bdf8; background: none; padding: 0;">x</code>'s storage.
  </div>
</div>

---

## Playpen Exercise

In the accompanying shader code playground, we declare a global variable `age` in the `private` address space. 

Our helper function `happy_birthday()` takes a pointer `age_ptr` to the age variable, reads the value out, increments it, and writes the incremented value back to memory. 

Click **Run** to compile and execute the shader, observing the updated age value!