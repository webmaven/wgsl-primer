/**
 * Copyright 2026 The Tour of WGSL Authors
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/// <reference types="@webgpu/types" />

import VisualizerBuilder, { VisualizerError, CompilationFailure, Visualizer } from './visualizer';

export interface BufferViewerOptions {
  length?: number;
  datatype?: 'f32' | 'i32' | 'u32';
}

export class BufferViewer implements Visualizer {
  device: GPUDevice;
  container: HTMLElement;
  length: number;
  datatype: 'f32' | 'i32' | 'u32';
  pipeline: GPUComputePipeline;
  inputBuffer: GPUBuffer;
  outputBuffer: GPUBuffer;
  readbackBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;

  inputCells: HTMLInputElement[] = [];
  outputCells: HTMLElement[] = [];
  inputGrid!: HTMLElement;
  outputGrid!: HTMLElement;

  readonly executeFrequency = 'once';
  readonly output = 'none';

  isQuestionModeActive = false;
  tooltipElement: HTMLElement | null = null;
  globalClickListener: ((e: MouseEvent) => void) | null = null;
  isReallocating = false;

  constructor(
    device: GPUDevice,
    container: HTMLElement,
    length: number,
    datatype: 'f32' | 'i32' | 'u32',
    pipeline: GPUComputePipeline,
    inputBuffer: GPUBuffer,
    outputBuffer: GPUBuffer,
    readbackBuffer: GPUBuffer,
    bindGroup: GPUBindGroup
  ) {
    this.device = device;
    this.container = container;
    this.length = length;
    this.datatype = datatype;
    this.pipeline = pipeline;
    this.inputBuffer = inputBuffer;
    this.outputBuffer = outputBuffer;
    this.readbackBuffer = readbackBuffer;
    this.bindGroup = bindGroup;

    this.rebuildDOM(Array.from({ length: this.length }, (_, i) => i + 1));

    // Hook up help toggle button
    const toggleBtn = this.container.querySelector('.help-inspector-toggle') as HTMLElement;
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleQuestionMode();
      });
    }
  }

  rebuildDOM(values: number[], highlightIndex?: number) {
    this.inputGrid = this.container.querySelector('#input-cells-grid') as HTMLElement;
    this.outputGrid = this.container.querySelector('#output-cells-grid') as HTMLElement;

    if (!this.inputGrid || !this.outputGrid) return;

    this.inputGrid.innerHTML = '';
    this.outputGrid.innerHTML = '';
    this.inputCells = [];
    this.outputCells = [];

    const isMinLength = values.length <= 1;
    const isMaxLength = values.length >= 16;

    for (let i = 0; i < values.length; i++) {
      // 1. Create Input Cell Wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'cell-wrapper';
      if (highlightIndex === i) {
        wrapper.className += ' animate-add';
      }
      wrapper.setAttribute(
        'data-help',
        `<strong>Input Scalar Cell (index ${i})</strong><br>Represents the scalar value at index <code>${i}</code> inside the input storage array in GPU memory. Click the cell in normal mode to edit its value manually.`
      );

      // 2. Create Controls Toolbar
      const controls = document.createElement('div');
      controls.className = 'cell-controls';

      // Left Button
      const leftBtn = document.createElement('button');
      leftBtn.className = 'control-btn';
      leftBtn.innerHTML = '◀';
      leftBtn.title = 'Move Left';
      if (i === 0) leftBtn.disabled = true;
      leftBtn.setAttribute(
        'data-help',
        "<strong>Move Left</strong><br>Swaps this element's position with its left neighbor in-place. This triggers an immediate execution pass and displays a glowing animation on both swapped cells."
      );
      leftBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.swapCells(i, i - 1);
      });

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'control-btn delete-cell';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete';
      if (isMinLength) deleteBtn.disabled = true;
      deleteBtn.setAttribute(
        'data-help',
        '<strong>Delete Element</strong><br>Removes this element. Under the hood, this destroys the old GPU buffers, allocates a smaller buffer, recreates the GPUBindGroup, and re-executes instantly.'
      );
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentValues = this.inputCells.map((c) => parseFloat(c.value) || 0);
        currentValues.splice(i, 1);
        this.reallocate(values.length - 1, currentValues);
      });

      // Right Button
      const rightBtn = document.createElement('button');
      rightBtn.className = 'control-btn';
      rightBtn.innerHTML = '▶';
      rightBtn.title = 'Move Right';
      if (i === values.length - 1) rightBtn.disabled = true;
      rightBtn.setAttribute(
        'data-help',
        "<strong>Move Right</strong><br>Swaps this element's position with its right neighbor in-place. This triggers an immediate execution pass and displays a glowing animation on both swapped cells."
      );
      rightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.swapCells(i, i + 1);
      });

      controls.appendChild(leftBtn);
      controls.appendChild(deleteBtn);
      controls.appendChild(rightBtn);
      wrapper.appendChild(controls);

      // 3. Create Input Cell
      const inputCell = document.createElement('input');
      inputCell.type = 'number';
      inputCell.step = this.datatype === 'f32' ? '0.1' : '1';
      inputCell.value = values[i].toString();
      inputCell.className = 'visualizer-cell input-cell';
      inputCell.addEventListener('input', () => {
        this.execute();
      });

      wrapper.appendChild(inputCell);
      this.inputGrid.appendChild(wrapper);
      this.inputCells.push(inputCell);

      // 4. Create Output Cell
      const outputCell = document.createElement('div');
      outputCell.className = 'visualizer-cell output-cell';
      if (highlightIndex === i) {
        outputCell.className += ' animate-add';
      }
      outputCell.innerText = '-';
      outputCell.setAttribute(
        'data-help',
        `<strong>Output Scalar Cell (index ${i})</strong><br>Displays the computed result written by the GPU compute shader at index <code>${i}</code>. Flashes with a glowing teal wave when modified.`
      );
      this.outputGrid.appendChild(outputCell);
      this.outputCells.push(outputCell);
    }

    // 5. Add Element Button inside Input Grid (if < 16)
    if (!isMaxLength) {
      const addBtn = document.createElement('button');
      addBtn.className = 'add-cell-btn';
      addBtn.innerHTML = '+';
      addBtn.title = 'Add Element';
      addBtn.setAttribute(
        'data-help',
        '<strong>Add Element</strong><br>Appends a new cell. Dynamically reallocates a larger GPU storage buffer and recreates the GPUBindGroup instantly—with <strong>zero shader recompilation overhead</strong>!'
      );
      addBtn.addEventListener('click', () => {
        const currentValues = this.inputCells.map((c) => parseFloat(c.value) || 0);
        const nextVal = currentValues.length > 0 ? Math.max(...currentValues) + 1 : 1;
        currentValues.push(nextVal);
        this.reallocate(values.length + 1, currentValues, values.length);
      });
      this.inputGrid.appendChild(addBtn);
    }
  }

  async reallocate(newLength: number, initialValues?: number[], highlightIndex?: number) {
    this.isReallocating = true;
    try {
      // 1. Trigger memory visual transitions on the DOM
      const isShrinking = newLength < this.length;
      const cellWrappers = this.inputGrid.querySelectorAll('.cell-wrapper');
      const outputCells = this.outputGrid.querySelectorAll('.output-cell');

      if (isShrinking) {
        // Red Deallocation: The entire old GPU buffer is being destroyed/deallocated
        cellWrappers.forEach((c) => c.classList.add('buffer-deallocating'));
        outputCells.forEach((c) => c.classList.add('buffer-deallocating'));
      } else {
        // Amber Reallocation: The existing buffer is reallocated to a larger size
        cellWrappers.forEach((c) => c.classList.add('buffer-deallocating-all'));
        outputCells.forEach((c) => c.classList.add('buffer-deallocating-all'));
      }

      // 2. Wait 400ms for deallocation fade-out/blur/amber animation to play
      await new Promise((resolve) => setTimeout(resolve, 400));

      // 3. Physical hardware reallocation on the GPU
      if (this.inputBuffer) this.inputBuffer.destroy();
      if (this.outputBuffer) this.outputBuffer.destroy();
      if (this.readbackBuffer) this.readbackBuffer.destroy();

      this.length = newLength;
      const bytesPerElement = 4;
      const bufferSize = this.length * bytesPerElement;

      this.inputBuffer = this.device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });

      this.outputBuffer = this.device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });

      this.readbackBuffer = this.device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      this.bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: { buffer: this.inputBuffer },
          },
          {
            binding: 1,
            resource: { buffer: this.outputBuffer },
          },
        ],
      });

      // 4. Rebuild DOM with fresh new cells (which will animate-in springily)
      this.rebuildDOM(
        initialValues || Array.from({ length: this.length }, (_, i) => i + 1),
        highlightIndex
      );

      // 5. Instantly execute compute pass with the new allocation
      await this.execute();
    } catch (e) {
      console.error('BufferViewer reallocation error:', e);
    } finally {
      this.isReallocating = false;
    }
  }

  swapCells(i: number, j: number) {
    if (i < 0 || i >= this.length || j < 0 || j >= this.length) return;

    const temp = this.inputCells[i].value;
    this.inputCells[i].value = this.inputCells[j].value;
    this.inputCells[j].value = temp;

    this.inputCells[i].classList.add('mutated-glow');
    this.inputCells[j].classList.add('mutated-glow');
    setTimeout(() => {
      this.inputCells[i].classList.remove('mutated-glow');
      this.inputCells[j].classList.remove('mutated-glow');
    }, 1000);

    this.execute();
  }

  async execute() {
    try {
      const bytesPerElement = 4;
      const arrayBuffer = new ArrayBuffer(this.length * bytesPerElement);

      if (this.datatype === 'f32') {
        const view = new Float32Array(arrayBuffer);
        for (let i = 0; i < this.length; i++) {
          view[i] = parseFloat(this.inputCells[i].value) || 0.0;
        }
      } else if (this.datatype === 'i32') {
        const view = new Int32Array(arrayBuffer);
        for (let i = 0; i < this.length; i++) {
          view[i] = parseInt(this.inputCells[i].value, 10) || 0;
        }
      } else {
        const view = new Uint32Array(arrayBuffer);
        for (let i = 0; i < this.length; i++) {
          view[i] = Math.max(0, parseInt(this.inputCells[i].value, 10) || 0);
        }
      }

      this.device.queue.writeBuffer(this.inputBuffer, 0, arrayBuffer);

      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(this.pipeline);
      passEncoder.setBindGroup(0, this.bindGroup);

      const workgroupSize = 64;
      const dispatchX = Math.ceil(this.length / workgroupSize);
      passEncoder.dispatchWorkgroups(dispatchX);
      passEncoder.end();

      commandEncoder.copyBufferToBuffer(
        this.outputBuffer,
        0,
        this.readbackBuffer,
        0,
        this.length * bytesPerElement
      );
      this.device.queue.submit([commandEncoder.finish()]);

      await this.readbackBuffer.mapAsync(GPUMapMode.READ);
      const readMapped = this.readbackBuffer.getMappedRange();
      let outputValues: number[] = [];

      if (this.datatype === 'f32') {
        outputValues = Array.from(new Float32Array(readMapped));
      } else if (this.datatype === 'i32') {
        outputValues = Array.from(new Int32Array(readMapped));
      } else {
        outputValues = Array.from(new Uint32Array(readMapped));
      }
      this.readbackBuffer.unmap();

      for (let i = 0; i < this.length; i++) {
        const cell = this.outputCells[i];
        if (!cell) continue;
        const prevValue = cell.innerText;
        const newValue =
          this.datatype === 'f32' ? outputValues[i].toFixed(2) : outputValues[i].toString();

        cell.innerText = newValue;

        if (prevValue !== newValue && prevValue !== '' && !this.isReallocating) {
          cell.classList.add('mutated-glow');
          setTimeout(() => cell.classList.remove('mutated-glow'), 1000);
        }
      }
    } catch (e) {
      console.error('BufferViewer execution error:', e);
    }
  }

  toggleQuestionMode() {
    if (this.isQuestionModeActive) {
      this.deactivateQuestionMode();
    } else {
      this.activateQuestionMode();
    }
  }

  activateQuestionMode() {
    this.isQuestionModeActive = true;
    const wrapper = this.container.querySelector('.buffer-viewer-wrapper') as HTMLElement;
    const toggleBtn = this.container.querySelector('.help-inspector-toggle') as HTMLElement;
    if (wrapper) {
      wrapper.classList.add('question-mode-active');

      // Slide down a help banner
      let banner = wrapper.querySelector('.help-inspector-banner') as HTMLElement;
      if (!banner) {
        banner = document.createElement('div');
        banner.className = 'help-inspector-banner';
        banner.innerText = 'Help Inspector Active';
        banner.setAttribute(
          'data-help',
          '<strong>Help Inspector Guide</strong><br>Hover any highlighted element in the visualizer to learn about buffer memory layouts and WebGPU concepts. Click anywhere inside or outside the visualizer to exit Question Mode.'
        );
        wrapper.insertBefore(banner, wrapper.querySelector('.visualizer-grid-columns'));
      }
    }
    if (toggleBtn) {
      toggleBtn.classList.add('active');
    }

    // Create tooltip
    this.createTooltip();

    // Bind click-anywhere to exit. We use capture: true to intercept the click before focus/mutations
    this.globalClickListener = (e: MouseEvent) => {
      if (toggleBtn && toggleBtn.contains(e.target as Node)) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      this.deactivateQuestionMode();
    };
    document.addEventListener('click', this.globalClickListener, { capture: true });
  }

  deactivateQuestionMode() {
    this.isQuestionModeActive = false;
    const wrapper = this.container.querySelector('.buffer-viewer-wrapper') as HTMLElement;
    const toggleBtn = this.container.querySelector('.help-inspector-toggle') as HTMLElement;
    if (wrapper) {
      wrapper.classList.remove('question-mode-active');
      const banner = wrapper.querySelector('.help-inspector-banner');
      if (banner) {
        banner.remove();
      }
    }
    if (toggleBtn) {
      toggleBtn.classList.remove('active');
    }

    this.removeTooltip();

    if (this.globalClickListener) {
      document.removeEventListener('click', this.globalClickListener, { capture: true });
      this.globalClickListener = null;
    }
  }

  createTooltip() {
    if (this.tooltipElement) return;
    const wrapper = this.container.querySelector('.buffer-viewer-wrapper') as HTMLElement;
    if (wrapper) {
      this.tooltipElement = document.createElement('div');
      this.tooltipElement.className = 'help-inspector-tooltip';
      wrapper.appendChild(this.tooltipElement);

      wrapper.addEventListener('mouseover', this.handleMouseOver);
      wrapper.addEventListener('mousemove', this.handleMouseMove);
      wrapper.addEventListener('mouseout', this.handleMouseOut);
    }
  }

  removeTooltip() {
    const wrapper = this.container.querySelector('.buffer-viewer-wrapper') as HTMLElement;
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
    if (wrapper) {
      wrapper.removeEventListener('mouseover', this.handleMouseOver);
      wrapper.removeEventListener('mousemove', this.handleMouseMove);
      wrapper.removeEventListener('mouseout', this.handleMouseOut);
    }
  }

  handleMouseOver = (e: MouseEvent) => {
    if (!this.isQuestionModeActive || !this.tooltipElement) return;

    // Use composedPath to find the closest element with a data-help attribute
    const path = e.composedPath();
    let helpElement: HTMLElement | null = null;
    for (const node of path) {
      if (node instanceof HTMLElement && node.hasAttribute('data-help')) {
        helpElement = node;
        break;
      }
    }

    if (helpElement) {
      const text = helpElement.getAttribute('data-help');
      if (text) {
        this.tooltipElement.innerHTML = text;
        this.tooltipElement.style.opacity = '1';
      }
    } else {
      this.tooltipElement.style.opacity = '0';
    }
  };

  handleMouseMove = (e: MouseEvent) => {
    if (!this.isQuestionModeActive || !this.tooltipElement) return;
    const wrapper = this.container.querySelector('.buffer-viewer-wrapper') as HTMLElement;
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const wrapperWidth = rect.width;
      const wrapperHeight = rect.height;

      // Dynamically measure the tooltip dimensions or fallback to sensible estimates
      const tooltipWidth = this.tooltipElement.offsetWidth || 250;
      const tooltipHeight = this.tooltipElement.offsetHeight || 120;

      let posX = x + 15;
      let posY = y + 15;

      // Switch horizontal anchoring to the left of the cursor if overflowing on the right
      if (posX + tooltipWidth > wrapperWidth - 10) {
        posX = x - tooltipWidth - 15;
      }

      // Switch vertical anchoring above the cursor if overflowing at the bottom
      if (posY + tooltipHeight > wrapperHeight - 10) {
        posY = y - tooltipHeight - 15;
      }

      // Clamp to wrapper bounds to guarantee it stays inside
      posX = Math.max(10, Math.min(posX, wrapperWidth - tooltipWidth - 10));
      posY = Math.max(10, Math.min(posY, wrapperHeight - tooltipHeight - 10));

      this.tooltipElement.style.left = `${posX}px`;
      this.tooltipElement.style.top = `${posY}px`;
    }
  };

  handleMouseOut = (e: MouseEvent) => {
    if (!this.isQuestionModeActive || !this.tooltipElement) return;
    const wrapper = this.container.querySelector('.buffer-viewer-wrapper') as HTMLElement;
    // Only hide the tooltip if the mouse leaves the visualizer wrapper entirely
    if (wrapper && (!e.relatedTarget || !wrapper.contains(e.relatedTarget as Node))) {
      this.tooltipElement.style.opacity = '0';
    }
  };
}

export default class BufferViewerBuilder implements VisualizerBuilder {
  options: BufferViewerOptions;
  device: GPUDevice | null = null;
  outputContainer: HTMLElement | null = null;

  constructor(optionsJson: string) {
    try {
      this.options = JSON.parse(optionsJson || '{}') as BufferViewerOptions;
    } catch (e) {
      this.options = {};
    }
    this.options.length = this.options.length ?? 8;
    this.options.datatype = this.options.datatype ?? 'f32';
  }

  async configure(output: HTMLElement) {
    this.outputContainer = output;

    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
      this.renderFallback(output, 'WebGPU not supported. Showing static simulation.');
      return;
    }
    this.device = await adapter.requestDevice();
    if (!this.device) {
      this.renderFallback(output, 'Unable to initialize WebGPU device. Showing static simulation.');
      return;
    }

    this.renderLayout(output);
  }

  private renderFallback(output: HTMLElement, message: string) {
    const fallback = document.createElement('div');
    fallback.className = 'visualizer-fallback';
    fallback.innerHTML = `
      <div class="fallback-banner">${message}</div>
      <div class="fallback-grid-container">
        <div class="fallback-grid">
          <h4>INPUT ARRAY</h4>
          <div class="cells-row">
            ${Array.from({ length: this.options.length! }, (_, i) => `<div class="cell fallback-input">${(i + 1.0).toFixed(1)}</div>`).join('')}
          </div>
        </div>
        <div class="fallback-grid">
          <h4>OUTPUT ARRAY</h4>
          <div class="cells-row">
            ${Array.from({ length: this.options.length! }, (_, i) => `<div class="cell fallback-output">${((i + 1.0) * 3.0).toFixed(1)}</div>`).join('')}
          </div>
        </div>
      </div>
    `;
    output.appendChild(fallback);
    this.injectStyles(output);
  }

  private renderLayout(output: HTMLElement) {
    const wrapper = document.createElement('div');
    wrapper.className = 'buffer-viewer-wrapper';

    wrapper.innerHTML = `
      <div class="visualizer-header" data-help="<strong>WebGPU Buffer Viewer</strong><br>A live visualizer that maps CPU TypeScript arrays directly to GPU <code>storage</code> buffer bindings. Computes shaders in real-time.">
        <h3>Buffer Viewer <span>(${this.options.datatype} array)</span></h3>
        <button class="help-inspector-toggle" title="Explore Buffer Viewer Concepts" aria-label="Explore Buffer Viewer Concepts" data-help="<strong>Help Inspector Guide</strong><br>Hover any highlighted element in the visualizer to learn about buffer memory layouts and WebGPU concepts. Click anywhere inside or outside the visualizer to exit Question Mode.">?</button>
      </div>
      <div class="visualizer-grid-columns">
        <div class="column-panel input-panel" data-help="<strong>Input Storage Buffer Panel</strong><br>Represents the input buffer declared as <code>binding(0)</code> in WGSL. This storage buffer is read-only inside the compute shader. Editing cells here updates GPU memory dynamically.">
          <div class="panel-title">INPUT STORAGE BUFFER</div>
          <div class="cells-container" id="input-cells-grid"></div>
          <div class="panel-hint">Hover a cell for controls; click to edit</div>
        </div>
        <div class="column-panel output-panel" data-help="<strong>Output Storage Buffer Panel</strong><br>Represents the output buffer declared as <code>binding(1)</code> in WGSL. The compute shader writes its results here, which are then copied to a staging buffer and read back to display live output values.">
          <div class="panel-title">OUTPUT STORAGE BUFFER</div>
          <div class="cells-container" id="output-cells-grid"></div>
          <div class="panel-hint">Updated live by compute shader</div>
        </div>
      </div>
    `;
    output.appendChild(wrapper);

    this.injectStyles(output);
  }

  private injectStyles(output: HTMLElement) {
    const root = output.getRootNode() as ShadowRoot | Document;
    const exists =
      'querySelector' in root
        ? root.querySelector('#buffer-viewer-styles')
        : document.getElementById('buffer-viewer-styles');
    if (exists) return;

    const styles = document.createElement('style');
    styles.id = 'buffer-viewer-styles';
    styles.textContent = `
      .buffer-viewer-wrapper {
        position: relative; /* Positioning parent for help tooltip */
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(20, 184, 166, 0.2);
        border-radius: 12px;
        padding: 16px;
        margin-top: 15px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
        color: #f8fafc;
        font-family: 'Inter', system-ui, sans-serif;
        transition: border 0.3s ease, box-shadow 0.3s ease;
      }
      .visualizer-header {
        margin: 0 0 12px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .visualizer-header h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #14b8a6;
        display: flex;
        align-items: center;
        gap: 8px;
        text-transform: uppercase;
      }
      .visualizer-header h3 span {
        font-size: 0.8rem;
        color: #94a3b8;
        text-transform: none;
      }
      .visualizer-grid-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media (max-width: 640px) {
        .visualizer-grid-columns {
          grid-template-columns: 1fr;
        }
      }
      .column-panel {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        transition: outline 0.2s ease;
      }
      .panel-title {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #94a3b8;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      .cells-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
        gap: 8px;
        margin-bottom: 10px;
        align-items: center;
      }
      .cell-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        transition: outline 0.2s ease, transform 0.25s ease, filter 0.25s ease;
      }
      .cell-controls {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        display: flex;
        align-items: center;
        gap: 2px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(20, 184, 166, 0.4);
        border-radius: 20px;
        padding: 2px 4px;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(20, 184, 166, 0.2);
      }
      .cell-wrapper:hover .cell-controls {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      }
      .control-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 0.6rem;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 15px;
        height: 15px;
        transition: all 0.15s ease;
      }
      .control-btn:hover:not(:disabled) {
        color: #14b8a6;
        background: rgba(20, 184, 166, 0.15);
      }
      .control-btn.delete-cell {
        font-size: 0.75rem;
      }
      .control-btn.delete-cell:hover:not(:disabled) {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.15);
      }
      .control-btn:disabled {
        color: #475569;
        cursor: not-allowed;
        opacity: 0.25;
      }
      .add-cell-btn {
        height: 30px;
        background: rgba(20, 184, 166, 0.04);
        border: 1px dashed rgba(20, 184, 166, 0.3);
        color: #14b8a6;
        font-size: 0.95rem;
        font-weight: 500;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 100%;
        padding: 0;
      }
      .add-cell-btn:hover {
        background: rgba(20, 184, 166, 0.12);
        border-color: #14b8a6;
        box-shadow: 0 0 12px rgba(20, 184, 166, 0.15);
        transform: scale(1.02);
      }
      .add-cell-btn:active {
        transform: scale(0.98);
      }

      /* Help Toggle Styles */
      .help-inspector-toggle {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid rgba(20, 184, 166, 0.4);
        background: rgba(20, 184, 166, 0.05);
        color: #14b8a6;
        cursor: pointer;
        font-weight: bold;
        font-size: 0.85rem;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .help-inspector-toggle:hover {
        background: rgba(20, 184, 166, 0.2);
        box-shadow: 0 0 10px rgba(20, 184, 166, 0.4);
        transform: scale(1.08);
      }
      .help-inspector-toggle.active {
        background: #14b8a6;
        color: #0f172a;
        box-shadow: 0 0 15px rgba(20, 184, 166, 0.6);
        border-color: #14b8a6;
      }

      /* Question Mode Overlay Banner & Active States */
      .question-mode-active {
        cursor: help !important;
        border-color: rgba(20, 184, 166, 0.6) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(20, 184, 166, 0.25) !important;
      }
      .question-mode-active input, 
      .question-mode-active button, 
      .question-mode-active .cell-wrapper,
      .question-mode-active .column-panel {
        cursor: help !important;
      }
      .question-mode-active .cell-controls {
        opacity: 0 !important;
        pointer-events: none !important;
      }
      .question-mode-active [data-help]:hover {
        outline: 1.5px dashed #14b8a6 !important;
        outline-offset: 3px;
        border-radius: 6px;
      }
      
      .help-inspector-banner {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translate(-50%, 0);
        background: rgba(20, 184, 166, 0.15);
        border: 1px solid rgba(20, 184, 166, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #2dd4bf;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-align: center;
        margin: 0;
        width: fit-content;
        animation: slide-down 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        cursor: help;
        transition: all 0.2s ease;
        z-index: 10;
      }
      .help-inspector-banner:hover {
        background: rgba(20, 184, 166, 0.25);
        box-shadow: 0 0 12px rgba(20, 184, 166, 0.35);
      }
      @keyframes slide-down {
        from {
          opacity: 0;
          transform: translate(-50%, -10px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }

      /* Help Tooltip Box */
      .help-inspector-tooltip {
        position: absolute;
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(20, 184, 166, 0.5);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(20, 184, 166, 0.1);
        border-radius: 8px;
        padding: 8px 12px;
        color: #f8fafc;
        font-size: 0.725rem;
        max-width: 250px;
        width: max-content;
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
        line-height: 1.4;
        box-sizing: border-box;
      }
      .help-inspector-tooltip strong {
        color: #14b8a6;
        display: block;
        margin-bottom: 4px;
        font-size: 0.775rem;
        letter-spacing: 0.02em;
        border-bottom: 1px solid rgba(20, 184, 166, 0.2);
        padding-bottom: 4px;
      }
      .help-inspector-tooltip code {
        font-family: 'Fira Code', monospace;
        background: rgba(20, 184, 166, 0.15);
        color: #2dd4bf;
        padding: 1px 4px;
        border-radius: 3px;
        font-size: 0.75rem;
      }

      /* Deallocation Animations */
      .buffer-deallocating {
        animation: dissolve-fade 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      /* Animate nested input cells during buffer deallocation (red destruction glow) */
      .buffer-deallocating .input-cell, .output-cell.buffer-deallocating {
        animation: cell-dissolve-glow 0.4s cubic-bezier(0.4, 0, 1, 1) forwards !important;
      }
      .buffer-deallocating-all {
        animation: dissolve-fade-all 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      /* Animate nested input cells during general reallocation (amber updating glow) */
      .buffer-deallocating-all .input-cell, .output-cell.buffer-deallocating-all {
        animation: cell-realloc-glow 0.4s cubic-bezier(0.4, 0, 1, 1) forwards !important;
      }
      @keyframes dissolve-fade {
        0% {
          opacity: 1;
          transform: scale(1);
          filter: blur(0);
        }
        30% {
          opacity: 1;
          transform: scale(1.02);
          filter: blur(0);
        }
        100% {
          opacity: 0;
          transform: scale(0.8) translateY(10px);
          filter: blur(4px);
        }
      }
      @keyframes cell-dissolve-glow {
        0% {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          box-shadow: none;
          transform: scale(1);
        }
        20%, 65% {
          background: rgba(239, 68, 68, 0.95);
          border-color: #ef4444;
          color: #ffffff;
          box-shadow: 0 0 25px #ef4444, inset 0 0 10px #ef4444;
          transform: scale(1.08);
        }
        100% {
          background: rgba(239, 68, 68, 0);
          border-color: rgba(239, 68, 68, 0);
          color: rgba(255, 255, 255, 0);
          box-shadow: 0 0 0px rgba(239, 68, 68, 0);
          transform: scale(0.8);
        }
      }
      @keyframes dissolve-fade-all {
        0% {
          transform: scale(1);
        }
        40% {
          transform: scale(1.03);
        }
        100% {
          transform: scale(1);
        }
      }
      @keyframes cell-realloc-glow {
        0% {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          box-shadow: none;
          transform: scale(1);
        }
        20%, 65% {
          background: rgba(245, 158, 11, 0.85);
          border-color: #f59e0b;
          color: #ffffff;
          box-shadow: 0 0 25px #f59e0b, inset 0 0 10px #f59e0b;
          transform: scale(1.06);
        }
        100% {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          box-shadow: none;
          transform: scale(1);
        }
      }
 
      /* Allocation Animations */
      .cell-wrapper.animate-add, .output-cell.animate-add {
        animation: allocate-pulse 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      @keyframes allocate-pulse {
        from {
          opacity: 0;
          transform: scale(0.8);
          box-shadow: 0 0 20px rgba(20, 184, 166, 0.8);
          background: rgba(20, 184, 166, 0.3);
          border-color: #14b8a6;
        }
        50% {
          opacity: 0.8;
          transform: scale(1.08);
          box-shadow: 0 0 25px rgba(20, 184, 166, 0.9);
          background: rgba(20, 184, 166, 0.4);
          border-color: #14b8a6;
        }
        to {
          opacity: 1;
          transform: scale(1);
          box-shadow: none;
        }
      }
 
      .visualizer-cell {
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Fira Code', monospace;
        font-size: 0.725rem;
        font-weight: 500;
        border-radius: 6px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
      }
      .input-cell {
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #e2e8f0;
        text-align: center;
        width: 100%;
        padding: 0;
      }
      .input-cell:focus {
        outline: none;
        border-color: #14b8a6;
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.25);
        background: rgba(15, 23, 42, 0.9);
      }
      .input-cell:hover {
        border-color: rgba(20, 184, 166, 0.4);
      }
      .output-cell {
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(20, 184, 166, 0.1);
        color: #14b8a6;
        transition: outline 0.2s ease, transform 0.25s ease, filter 0.25s ease, background 0.25s ease;
      }
      .panel-hint {
        font-size: 0.7rem;
        color: #64748b;
        text-align: center;
        margin-top: auto;
        padding-top: 8px;
      }
      .mutated-glow {
        background: rgba(20, 184, 166, 0.3) !important;
        border-color: #14b8a6 !important;
        color: #fff !important;
        box-shadow: 0 0 12px rgba(20, 184, 166, 0.6);
        transform: scale(1.05);
      }
      
      /* Fallback Styles */
      .visualizer-fallback {
        background: #0f172a;
        border: 1px solid #dc2626;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
      }
      .fallback-banner {
        color: #ef4444;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .fallback-grid-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      .fallback-grid h4 {
        margin: 0 0 8px 0;
        font-size: 0.75rem;
        color: #94a3b8;
      }
      .cells-row {
        display: flex;
        gap: 6px;
        overflow-x: auto;
      }
      .cell {
        min-width: 45px;
        height: 36px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-size: 0.8rem;
      }
      .fallback-input {
        background: rgba(30, 41, 59, 0.5);
        color: #cbd5e1;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .fallback-output {
        background: rgba(20, 184, 166, 0.1);
        color: #14b8a6;
        border: 1px solid rgba(20, 184, 166, 0.2);
      }
    `;
    const target = 'appendChild' in root ? root : document.head;
    target.appendChild(styles);
  }

  async build(shader: string): Promise<Visualizer> {
    if (!this.device) {
      throw new VisualizerError('WebGPU device not initialized');
    }

    const length = this.options.length!;
    const bytesPerElement = 4;
    const bufferSize = length * bytesPerElement;

    const inputBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const outputBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const readbackBuffer = this.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const shaderModule = this.device.createShaderModule({
      code: shader,
    });

    const compilationInfo = await shaderModule.getCompilationInfo();
    if (compilationInfo.messages.some((m) => m.type === 'error')) {
      throw new CompilationFailure(
        compilationInfo.messages.map((m) => ({
          line: m.lineNum,
          column: m.linePos,
          length: m.length,
          msg: m.message,
          kind: m.type,
        }))
      );
    }

    const pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main',
      },
    });

    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: inputBuffer },
        },
        {
          binding: 1,
          resource: { buffer: outputBuffer },
        },
      ],
    });

    return new BufferViewer(
      this.device,
      this.outputContainer!,
      length,
      this.options.datatype!,
      pipeline,
      inputBuffer,
      outputBuffer,
      readbackBuffer,
      bindGroup
    );
  }
}
