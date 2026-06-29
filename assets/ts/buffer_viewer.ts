/**
 * Copyright 2026 The Tour of WGSL Authors
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/// <reference types="@webgpu/types" />

import VisualizerBuilder, { VisualizerError, CompilationFailure, Visualizer } from './visualizer';

export interface ArrayVisualizerOptions {
  length?: number;
  datatype?: 'f32' | 'i32' | 'u32';
}

export class ArrayVisualizer implements Visualizer {
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

  readonly executeFrequency = 'once';
  readonly output = 'none';

  constructor(
    device: GPUDevice,
    container: HTMLElement,
    length: number,
    datatype: 'f32' | 'i32' | 'u32',
    pipeline: GPUComputePipeline,
    inputBuffer: GPUBuffer,
    outputBuffer: GPUBuffer,
    readbackBuffer: GPUBuffer,
    bindGroup: GPUBindGroup,
    inputCells: HTMLInputElement[],
    outputCells: HTMLElement[]
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
    this.inputCells = inputCells;
    this.outputCells = outputCells;
  }

  async execute() {
    try {
      // 1. Read values from inputs and pack into TypedArray
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

      // 2. Write inputs to the input storage buffer
      this.device.queue.writeBuffer(this.inputBuffer, 0, arrayBuffer);

      // 3. Encode and submit compute commands
      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(this.pipeline);
      passEncoder.setBindGroup(0, this.bindGroup);

      // Dispatch workgroups to cover all elements (assume 1D thread layout of size 64)
      const workgroupSize = 64;
      const dispatchX = Math.ceil(this.length / workgroupSize);
      passEncoder.dispatchWorkgroups(dispatchX);
      passEncoder.end();

      // Copy outputs to mapped readback buffer
      commandEncoder.copyBufferToBuffer(
        this.outputBuffer,
        0,
        this.readbackBuffer,
        0,
        this.length * bytesPerElement
      );
      this.device.queue.submit([commandEncoder.finish()]);

      // 4. Map and read outputs
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

      // 5. Render outputs with transition highlights
      for (let i = 0; i < this.length; i++) {
        const cell = this.outputCells[i];
        const prevValue = cell.innerText;
        const newValue =
          this.datatype === 'f32' ? outputValues[i].toFixed(2) : outputValues[i].toString();

        cell.innerText = newValue;

        if (prevValue !== newValue && prevValue !== '') {
          cell.classList.add('mutated-glow');
          setTimeout(() => cell.classList.remove('mutated-glow'), 1000);
        }
      }
    } catch (e) {
      console.error('ArrayVisualizer execution error:', e);
    }
  }
}

export default class ArrayVisualizerBuilder implements VisualizerBuilder {
  options: ArrayVisualizerOptions;
  device: GPUDevice | null = null;
  outputContainer: HTMLElement | null = null;
  inputCells: HTMLInputElement[] = [];
  outputCells: HTMLElement[] = [];

  constructor(optionsJson: string) {
    try {
      this.options = JSON.parse(optionsJson || '{}') as ArrayVisualizerOptions;
    } catch (e) {
      this.options = {};
    }
    this.options.length = this.options.length ?? 8;
    this.options.datatype = this.options.datatype ?? 'f32';
  }

  async configure(output: HTMLElement) {
    this.outputContainer = output;

    // Set up WebGPU device
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
    const length = this.options.length!;

    const wrapper = document.createElement('div');
    wrapper.className = 'array-visualizer-wrapper';

    wrapper.innerHTML = `
      <div class="visualizer-header">
        <h3>Buffer Viewer <span>(${this.options.datatype} array)</span></h3>
      </div>
      <div class="visualizer-grid-columns">
        <div class="column-panel input-panel">
          <div class="panel-title">INPUT STORAGE BUFFER</div>
          <div class="cells-container" id="input-cells-grid"></div>
          <div class="panel-hint">Click a cell to edit value</div>
        </div>
        <div class="column-panel output-panel">
          <div class="panel-title">OUTPUT STORAGE BUFFER</div>
          <div class="cells-container" id="output-cells-grid"></div>
          <div class="panel-hint">Updated live by compute shader</div>
        </div>
      </div>
    `;
    output.appendChild(wrapper);

    const inputGrid = wrapper.querySelector('#input-cells-grid')!;
    const outputGrid = wrapper.querySelector('#output-cells-grid')!;

    this.inputCells = [];
    this.outputCells = [];

    for (let i = 0; i < length; i++) {
      // Create input cell
      const inputCell = document.createElement('input');
      inputCell.type = 'number';
      inputCell.step = this.options.datatype === 'f32' ? '0.1' : '1';
      inputCell.value = (i + 1).toString();
      inputCell.className = 'visualizer-cell input-cell';
      inputCell.addEventListener('input', () => {
        // Trigger visualizer refresh
        const tourElement = output.closest('wgsl-tour') as any;
        if (tourElement && typeof tourElement.buildVisualization === 'function') {
          tourElement.buildVisualization();
        }
      });
      inputGrid.appendChild(inputCell);
      this.inputCells.push(inputCell);

      // Create output cell
      const outputCell = document.createElement('div');
      outputCell.className = 'visualizer-cell output-cell';
      outputCell.innerText = '-';
      outputGrid.appendChild(outputCell);
      this.outputCells.push(outputCell);
    }

    this.injectStyles(output);
  }

  private injectStyles(output: HTMLElement) {
    const root = output.getRootNode() as ShadowRoot | Document;
    const exists =
      'querySelector' in root
        ? root.querySelector('#array-visualizer-styles')
        : document.getElementById('array-visualizer-styles');
    if (exists) return;

    const styles = document.createElement('style');
    styles.id = 'array-visualizer-styles';
    styles.textContent = `
      .array-visualizer-wrapper {
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(20, 184, 166, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin-top: 15px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
        color: #f8fafc;
        font-family: 'Inter', system-ui, sans-serif;
      }
      .visualizer-header h3 {
        margin: 0 0 15px 0;
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        color: #14b8a6;
        display: flex;
        align-items: center;
        gap: 8px;
        text-transform: uppercase;
      }
      .visualizer-header h3 span {
        font-size: 0.85rem;
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
        padding: 15px;
      }
      .panel-title {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: #94a3b8;
        margin-bottom: 12px;
        text-transform: uppercase;
      }
      .cells-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: 8px;
        margin-bottom: 10px;
      }
      .visualizer-cell {
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Fira Code', monospace;
        font-size: 0.9rem;
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
      }
      .panel-hint {
        font-size: 0.7rem;
        color: #64748b;
        text-align: center;
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

    // Allocate GPU Buffers
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

    // Check compilation info
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

    return new ArrayVisualizer(
      this.device,
      this.outputContainer!,
      length,
      this.options.datatype!,
      pipeline,
      inputBuffer,
      outputBuffer,
      readbackBuffer,
      bindGroup,
      this.inputCells,
      this.outputCells
    );
  }
}
