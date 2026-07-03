/*
 * Copyright ©2026 Michael R. Bernstein. All new modifications licensed under Apache 2.0.
 * Upstream lineage ©2023 governed by original BSD 3-Clause. See README.md.
 */

/**
 * Copyright 2023 The Tour of WGSL Authors
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

/// <reference types="@webgpu/types" />

import VisualizerBuilder, { VisualizerError, CompilationFailure, Visualizer } from './visualizer';

export class NoopVisualizer implements Visualizer {
  readonly executeFrequency = 'once';

  readonly output: 'none' = 'none';

  execute() {}
}

export default class NoopVisualizerBuilder implements VisualizerBuilder {
  device: GPUDevice | null = null;

  /**
   * @inheritDoc VisualizationBuilder.configure
   */
  async configure() {
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter === null) {
      throw new VisualizerError('Unable to request webgpu adapter');
    }

    this.device = await adapter.requestDevice();
    if (this.device === null) {
      throw new VisualizerError('Unable to get WebGPU device');
    }
  }

  /**
   * @inheritDoc VisualizationBuilder.build
   */
  async build(shader: string): Promise<Visualizer> {
    if (this.device === null) {
      throw new VisualizerError('Device missing in visualizer');
    }

    this.device.pushErrorScope('validation');
    const shaderModule = this.device.createShaderModule({
      code: shader,
    });

    const compilationInfo = await shaderModule.getCompilationInfo();
    if (compilationInfo.messages.length !== 0) {
      throw new CompilationFailure(
        compilationInfo.messages.map((m: any) => ({
          line: m.lineNum,
          column: m.linePos,
          length: m.length,
          msg: m.message,
          kind: m.type,
        }))
      );
    }
    return new NoopVisualizer();
  }
}
