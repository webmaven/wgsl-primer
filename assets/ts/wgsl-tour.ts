/**
 * Copyright 2023 The Tour of WGSL Authors
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

import VisualizerBuilder, { CompilationFailure, VisualizerError, Visualizer } from './visualizer';
import WGSLDocs from './wgsl-docs';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { hoverTooltip, keymap, activateHover } from '@codemirror/view';
import { wgsl } from '@iizukak/codemirror-lang-wgsl';
import { syntaxTree } from '@codemirror/language';
import { lintGutter, setDiagnostics, Diagnostic } from '@codemirror/lint';

export class WGSLTour extends HTMLElement {
  visualization: Visualizer | undefined = undefined;
  visualizationBuilder: VisualizerBuilder | undefined = undefined;
  bootstrap: string = '';
  editor!: EditorView;
  output!: HTMLElement;
  statusIndicator!: HTMLElement;
  frame_number: number = 0;
  key_timer: ReturnType<typeof setTimeout> | undefined = undefined;
  autorun: boolean = true;

  constructor() {
    super();
  }

  connectedCallback() {
    const savedAutorun = localStorage.getItem('wgsl-tour-autorun');
    if (savedAutorun !== null) {
      this.autorun = savedAutorun === 'true';
    }

    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        font-family: var(--md-text-font-family, inherit);
      }
      h2 {
        font-family: var(--md-text-font-family, inherit);
        font-size: 1.05rem;
        margin-top: 4px;
        margin-bottom: 8px;
        color: var(--md-default-fg-color, #0f172a);
        font-weight: 600;
        flex: none;
      }
      canvas,
      #wgsl-tour-output-canvas {
        width: 100%;
        max-width: 640px;
        aspect-ratio: 4 / 3;
        height: auto !important;
        margin-top: 10px;
        display: block;
      }
      #wgsl-tour-output-text {
        width: 100%;
        max-width: 640px;
        margin-top: 10px;
        display: block;
        font-size: var(--md-code-font-size, 0.85em);
      }
      .editor-container.short-code .cm-editor {
        height: auto !important;
      }
      #canvas {
        display: flex;
        justify-content: center;
        align-items: start;
      }
      .cm-editor {
        border: 1px solid var(--md-default-fg-color--lite, #e2e8f0);
        height: 350px;
        border-radius: 4px;
        font-size: var(--md-code-font-size, 0.85em);
      }
      .wgsl-tooltip {
        border-radius: 5px;
        margin: 0;
        margin-left: 2px;
        padding: 4px;
        border: 1px solid #14b8a6;
        overflow: auto;
        background-color: var(--md-code-bg-color, #f8fafc);
        color: var(--md-code-fg-color, #0f172a);
      }
      .controls-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
        margin-bottom: 6px;
        padding: 4px 8px;
        background-color: var(--md-code-bg-color, #f8fafc);
        border: 1px solid var(--md-default-fg-color--lite, #e2e8f0);
        border-radius: 6px;
      }
      .run-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background-color: #64748b;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        padding: 4px 12px;
        font-family: var(--md-text-font-family, inherit);
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(100, 116, 139, 0.25);
      }
      .run-button:hover {
        background-color: #475569;
        box-shadow: 0 4px 12px rgba(100, 116, 139, 0.4);
        transform: translateY(-1px);
      }
      .run-button:active {
        transform: translateY(1px);
        box-shadow: 0 1px 2px rgba(100, 116, 139, 0.2);
      }
      .run-button.paused {
        background-color: #0ea5e9;
        box-shadow: 0 2px 4px rgba(14, 165, 233, 0.25);
      }
      .run-button.paused:hover {
        background-color: #0284c7;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
      }
      .run-button.paused:active {
        transform: translateY(1px);
        box-shadow: 0 1px 2px rgba(14, 165, 233, 0.2);
      }
      .run-icon {
        width: 14px;
        height: 14px;
        fill: currentColor;
        transition: transform 0.2s ease;
      }
      .run-button:hover .run-icon {
        transform: scale(1.1);
      }
      .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--md-text-font-family, inherit);
        font-size: 0.8em;
        font-weight: 500;
        color: var(--md-default-fg-color--light, #64748b);
        user-select: none;
      }
      .status-dot {
        position: relative;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #64748b;
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
      }
      .status-dot.ready {
        background-color: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
      }
      .status-dot.compiling {
        background-color: #3b82f6;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        animation: status-pulse 1s infinite alternate;
      }
      .status-dot.success {
        background-color: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
      }
      .status-dot.error {
        background-color: #ef4444;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
      }
      .status-dot.paused {
        background-color: #f59e0b;
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
      }
      @keyframes status-pulse {
        from {
          opacity: 0.4;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1.1);
        }
      }

      #output::-webkit-scrollbar,
      #wgsl-tour-output-text::-webkit-scrollbar,
      .array-visualizer-wrapper::-webkit-scrollbar,
      .workgroup-visualizer-wrapper::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      #output::-webkit-scrollbar-track,
      #wgsl-tour-output-text::-webkit-scrollbar-track,
      .array-visualizer-wrapper::-webkit-scrollbar-track,
      .workgroup-visualizer-wrapper::-webkit-scrollbar-track {
        background: transparent;
      }
      #output::-webkit-scrollbar-thumb,
      #wgsl-tour-output-text::-webkit-scrollbar-thumb,
      .array-visualizer-wrapper::-webkit-scrollbar-thumb,
      .workgroup-visualizer-wrapper::-webkit-scrollbar-thumb {
        background-color: var(--md-default-fg-color--lightest, #cbd5e1);
        border-radius: 3px;
      }

      .expando-button {
        display: none;
      }

      @media (min-width: 1200px) {
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
          gap: 0;
        }
        .editor-container {
          flex: 1 1 0%;
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          min-height: 0;
        }
        :host(.has-output) .editor-container {
          flex: 1 1 0%;
        }
        :host(.has-output) .editor-container.expanded {
          flex: 0 1 auto !important;
          height: auto !important;
          min-height: 50% !important;
          max-height: calc(100% - 180px) !important;
        }
        :host(.has-output) .editor-container.short-code {
          flex: 0 0 auto !important;
          height: auto !important;
        }
        :host(.has-output) .editor-container.short-code .cm-editor {
          height: auto !important;
        }
        :host(.has-output) .editor-container.short-code .expando-button {
          display: none !important;
        }
        .cm-editor {
          height: 100% !important;
          flex: 1 1 auto;
          min-height: 0;
        }
        :host(.has-output) .editor-container.expanded .cm-editor {
          height: 100% !important;
        }
        .controls-container {
          height: 46px;
          box-sizing: border-box;
          margin-top: 4px !important;
          margin-bottom: 4px !important;
          flex: none;
        }
        #output {
          display: none !important;
        }
        :host(.has-output) #output {
          display: flex !important;
          flex: 1 1 0%;
          height: auto !important;
          min-height: 0;
          flex-direction: column;
          align-items: stretch;
          justify-content: start;
          width: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        #canvas {
          height: 100%;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 0;
          margin-top: 0;
        }
        canvas,
        #wgsl-tour-output-canvas {
          width: auto !important;
          height: auto !important;
          max-width: 100% !important;
          max-height: 100% !important;
          aspect-ratio: 4 / 3 !important;
          margin-top: 0 !important;
          object-fit: contain;
        }
        #wgsl-tour-output-text {
          width: 100% !important;
          flex: 1 1 0%;
          min-height: 0;
          height: auto !important;
          margin-top: 0 !important;
          overflow: auto;
          box-sizing: border-box;
        }
        .array-visualizer-wrapper,
        .workgroup-visualizer-wrapper {
          width: 100%;
          box-sizing: border-box;
          margin-top: 0 !important;
          flex-shrink: 0 !important;
        }
        .expando-button {
          display: none;
        }
        :host(.has-output) .expando-button {
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 36px;
          height: 20px;
          background-color: var(--md-code-bg-color, #f8fafc);
          border: 1px solid var(--md-default-fg-color--lite, #e2e8f0);
          border-radius: 10px;
          cursor: pointer;
          z-index: 100;
          font-size: 10px;
          line-height: 1;
          color: var(--md-default-fg-color--light, #64748b);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .expando-button:hover {
          background-color: var(--md-default-fg-color--lightest, #e2e8f0);
          color: var(--md-default-fg-color, #0f172a);
          transform: translateX(-50%) scale(1.1);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .expando-button:active {
          transform: translateX(-50%) scale(0.95);
        }
      }
    `;
    shadow.appendChild(style);

    const editorContainer = document.createElement('div');
    editorContainer.className = 'editor-container';
    shadow.appendChild(editorContainer);

    const expandoButton = document.createElement('button');
    expandoButton.className = 'expando-button';
    expandoButton.setAttribute('aria-label', 'Expand editor');
    expandoButton.setAttribute('title', 'Expand editor to full height');
    expandoButton.textContent = '▾';
    editorContainer.appendChild(expandoButton);

    expandoButton.addEventListener('click', () => {
      const isExpanded = editorContainer.classList.toggle('expanded');
      expandoButton.textContent = isExpanded ? '▴' : '▾';
      const tooltip = isExpanded
        ? 'Collapse editor to split height'
        : 'Expand editor to full height';
      expandoButton.setAttribute('title', tooltip);
      expandoButton.setAttribute('aria-label', tooltip);
      this.editor.requestMeasure();
    });

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    const runButton = document.createElement('button');
    runButton.className = 'run-button';

    const updateButton = () => {
      localStorage.setItem('wgsl-tour-autorun', String(this.autorun));
      if (this.autorun) {
        runButton.innerHTML = `
          <svg class="run-icon" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
          <span>Pause</span>
        `;
        runButton.classList.remove('paused');
        runButton.setAttribute('title', 'Pause live updates');
      } else {
        runButton.innerHTML = `
          <svg class="run-icon" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21"></polygon>
          </svg>
          <span>Run</span>
        `;
        runButton.classList.add('paused');
        runButton.setAttribute('title', 'Run example and enable live updates');
      }
    };
    updateButton();

    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'status-indicator';
    statusIndicator.innerHTML =
      '<span class="status-dot ready"></span><span class="status-label">Ready</span>';
    this.statusIndicator = statusIndicator;

    controlsContainer.appendChild(runButton);
    controlsContainer.appendChild(statusIndicator);
    shadow.appendChild(controlsContainer);

    this.output = document.createElement('div');
    this.output.setAttribute('id', 'output');
    shadow.appendChild(this.output);

    const pre = this.querySelector('#tour-content');
    const code = (pre ? pre.textContent : this.textContent) || '';

    const rebuild = () => {
      this.frame_number = 0;
      if (this.visualizationBuilder) {
        this.buildVisualization();
      }
    };

    runButton.addEventListener('click', () => {
      if (this.autorun) {
        this.autorun = false;
        if (this.key_timer !== undefined) {
          clearTimeout(this.key_timer);
          this.key_timer = undefined;
        }
        updateButton();
        this.updateStatus('paused', 'Paused');
      } else {
        rebuild();
        this.autorun = true;
        updateButton();
      }
    });

    const docsTooltip = hoverTooltip((view, pos, side) => {
      const tree = syntaxTree(view.state);
      const token = tree.resolveInner(pos, side);
      const text = view.state.sliceDoc(token.from, token.to);
      const docs = WGSLDocs.getDocsFor(text, token.name);
      if (!docs) return null;
      return {
        pos: token.from,
        end: token.to,
        above: true,
        create() {
          const dom = document.createElement('div');
          dom.className = 'wgsl-tooltip';
          dom.innerHTML = `<pre>${docs}</pre>`;
          return { dom };
        },
      };
    });

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        if (this.key_timer !== undefined) {
          clearTimeout(this.key_timer);
          this.key_timer = undefined;
        }
        if (this.autorun) {
          this.key_timer = setTimeout(rebuild, 1000);
        } else {
          this.updateStatus('paused', 'Paused');
        }

        // Dynamically toggle short-code class based on current line count
        const currentLines = update.state.doc.lines;
        if (currentLines <= 10) {
          editorContainer.classList.add('short-code');
        } else {
          editorContainer.classList.remove('short-code');
        }
      }
    });

    const docsKeymap = keymap.of([
      {
        key: 'Ctrl-o',
        run: (view) => {
          const pos = view.state.selection.main.head;
          activateHover(view, pos, 1);
          return true;
        },
      },
      {
        key: 'Cmd-o',
        run: (view) => {
          const pos = view.state.selection.main.head;
          activateHover(view, pos, 1);
          return true;
        },
      },
    ]);

    this.editor = new EditorView({
      doc: code,
      extensions: [basicSetup, wgsl(), lintGutter(), docsTooltip, updateListener, docsKeymap],
      parent: editorContainer,
    });

    // Initial short-code class assignment based on line count
    if (this.editor.state.doc.lines <= 10) {
      editorContainer.classList.add('short-code');
    }
  }

  setBootstrap(src: string) {
    this.bootstrap = src;
  }

  async setVisualizationBuilder(val: VisualizerBuilder) {
    this.visualizationBuilder = val;
    try {
      if (!navigator.gpu) {
        throw new VisualizerError('WebGPU is not supported in this browser');
      }
      await this.visualizationBuilder.configure(this.output);
    } catch (e: any) {
      this.onPipelineFailure({ message: e.message || e.toString() } as VisualizerError);
      return false;
    }

    if (this.output.children.length > 0) {
      this.classList.add('has-output');
    } else {
      this.classList.remove('has-output');
    }

    this.buildVisualization();
    return true;
  }

  updateStatus(state: 'compiling' | 'success' | 'error' | 'ready' | 'paused', text: string) {
    if (!this.statusIndicator) return;
    const dot = this.statusIndicator.querySelector('.status-dot');
    const label = this.statusIndicator.querySelector('.status-label');
    if (dot && label) {
      dot.className = `status-dot ${state}`;
      label.textContent = text;
    }
  }

  buildVisualization() {
    if (!this.visualizationBuilder) return;

    this.editor.dispatch(setDiagnostics(this.editor.state, []));
    this.visualization = undefined;
    this.updateStatus('compiling', 'Compiling...');

    this.visualizationBuilder
      .build(this.editor.state.doc.toString() + this.bootstrap)
      .then((visualization) => {
        this.visualization = visualization;
        if (this.autorun) {
          this.updateStatus('success', 'Live');
        } else {
          this.updateStatus('paused', 'Paused');
        }
        requestAnimationFrame(() => this.frame());
      })
      .catch((err: any) => {
        if (err.hasOwnProperty('diagnostics')) {
          this.updateStatus('error', 'Compilation Error');
          this.onCompilationFailure(err as CompilationFailure);
        } else if (err.hasOwnProperty('visualizer_error') || err.message) {
          this.updateStatus('error', 'Pipeline Error');
          this.onPipelineFailure(err as VisualizerError);
        } else {
          this.updateStatus('error', 'Error');
          console.log(err);
        }
      });
  }

  frame() {
    if (this.visualization === undefined) return;

    this.frame_number++;
    this.visualization.execute(this.frame_number);

    if (this.visualization.executeFrequency === 'repeat') {
      requestAnimationFrame(() => this.frame());
    }
  }

  onCompilationFailure(failure: CompilationFailure) {
    const diagnostics: Diagnostic[] = failure.diagnostics.map((diag) => {
      const lineInfo = this.editor.state.doc.line(diag.line);
      const from = lineInfo.from + Math.max(0, diag.column - 1);
      const to = Math.min(from + (diag.length || 1), lineInfo.to);
      return {
        from,
        to,
        severity: diag.kind === 'error' ? 'error' : 'warning',
        message: diag.msg,
      };
    });
    this.editor.dispatch(setDiagnostics(this.editor.state, diagnostics));
  }

  onPipelineFailure(failure: VisualizerError) {
    const diag: Diagnostic = {
      from: 0,
      to: 0,
      severity: 'error',
      message: failure.message,
    };
    this.editor.dispatch(setDiagnostics(this.editor.state, [diag]));
  }
}
customElements.define('wgsl-tour', WGSLTour);
