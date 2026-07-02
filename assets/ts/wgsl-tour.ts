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
  innerOutput!: HTMLElement;
  errorOutput!: HTMLElement;
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
        margin-bottom: 0;
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
      .buffer-viewer-wrapper::-webkit-scrollbar,
      .workgroup-visualizer-wrapper::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      #output::-webkit-scrollbar-track,
      #wgsl-tour-output-text::-webkit-scrollbar-track,
      .buffer-viewer-wrapper::-webkit-scrollbar-track,
      .workgroup-visualizer-wrapper::-webkit-scrollbar-track {
        background: transparent;
      }
      #output::-webkit-scrollbar-thumb,
      #wgsl-tour-output-text::-webkit-scrollbar-thumb,
      .buffer-viewer-wrapper::-webkit-scrollbar-thumb,
      .workgroup-visualizer-wrapper::-webkit-scrollbar-thumb {
        background-color: var(--md-default-fg-color--lightest, #cbd5e1);
        border-radius: 3px;
      }

      #inner-output,
      #error-output {
        width: 100%;
        box-sizing: border-box;
      }
      #inner-output {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: start;
        flex: 1 1 0%;
        min-height: 0;
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
        :host(.has-output) .editor-container.collapsed {
          flex: 0 0 auto !important;
          height: 110px !important;
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
        :host(.has-output) .editor-container.collapsed .cm-editor {
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
        .buffer-viewer-wrapper,
        .workgroup-visualizer-wrapper,
        .pointer-vis-wrapper {
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
      if (editorContainer.classList.contains('expanded')) {
        // From Expanded -> Collapsed
        editorContainer.classList.remove('expanded');
        editorContainer.classList.add('collapsed');
        expandoButton.textContent = '▾';
        const tooltip = 'Show editor split view';
        expandoButton.setAttribute('title', tooltip);
        expandoButton.setAttribute('aria-label', tooltip);
      } else if (editorContainer.classList.contains('collapsed')) {
        // From Collapsed -> Split
        editorContainer.classList.remove('collapsed');
        expandoButton.textContent = '▾';
        const tooltip = 'Expand editor to full height';
        expandoButton.setAttribute('title', tooltip);
        expandoButton.setAttribute('aria-label', tooltip);
      } else {
        // From Split -> Expanded
        editorContainer.classList.add('expanded');
        expandoButton.textContent = '▴';
        const tooltip = 'Collapse editor to compact height';
        expandoButton.setAttribute('title', tooltip);
        expandoButton.setAttribute('aria-label', tooltip);
      }
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

    this.innerOutput = document.createElement('div');
    this.innerOutput.setAttribute('id', 'inner-output');
    this.innerOutput.style.display = 'block';
    this.output.appendChild(this.innerOutput);

    this.errorOutput = document.createElement('div');
    this.errorOutput.setAttribute('id', 'error-output');
    this.errorOutput.style.display = 'none';
    this.output.appendChild(this.errorOutput);

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
      this.innerOutput.innerHTML = '';
      await this.visualizationBuilder.configure(this.innerOutput);
    } catch (e: any) {
      this.onPipelineFailure({ message: e.message || e.toString() } as VisualizerError);
      return false;
    }

    if (this.innerOutput.children.length > 0) {
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

        // Clean error outputs and restore inner output
        this.errorOutput.style.display = 'none';
        this.errorOutput.innerHTML = '';
        this.innerOutput.style.display = '';

        if (this.innerOutput.children.length > 0) {
          this.classList.add('has-output');
        } else {
          this.classList.remove('has-output');
        }

        requestAnimationFrame(() => this.frame());
      })
      .catch((err: any) => {
        // Hide inner visualization output and expose error diagnostics container
        this.innerOutput.style.display = 'none';
        this.errorOutput.style.display = '';
        this.classList.add('has-output');

        if (err.hasOwnProperty('diagnostics')) {
          this.updateStatus('error', 'Compilation Error');
          this.onCompilationFailure(err as CompilationFailure);
          const rendered = this.renderAliasingCollisionDiagram(err as CompilationFailure);
          if (!rendered) {
            this.renderGenericCompilationError(err as CompilationFailure);
          }
        } else if (err.hasOwnProperty('visualizer_error') || err.message) {
          this.updateStatus('error', 'Pipeline Error');
          const visualizerErr = err.hasOwnProperty('visualizer_error')
            ? (err as VisualizerError)
            : ({ message: err.message || err.toString() } as VisualizerError);
          this.onPipelineFailure(visualizerErr);
          this.renderPipelineError(visualizerErr);
        } else {
          this.updateStatus('error', 'Error');
          const msg = err && err.message ? err.message : String(err);
          const fallbackErr = { message: msg } as VisualizerError;
          this.onPipelineFailure(fallbackErr);
          this.renderPipelineError(fallbackErr);
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

  renderAliasingCollisionDiagram(failure: CompilationFailure): boolean {
    // 1. Scan for aliasing errors
    const aliasingDiag = failure.diagnostics.find((d) =>
      /alias|aliasing|overlapping|two views|same root|conflicting access/i.test(d.msg)
    );

    if (!aliasingDiag) return false;

    // 2. Try to extract variable name or function name
    let rootVar = 'root_variable';
    const varMatch = aliasingDiag.msg.match(
      /view[s]? of '([^']+)'|view[s]? of ([a-zA-Z_][a-zA-Z0-9_]*)|root identifier '([^']+)'|root ([a-zA-Z_][a-zA-Z0-9_]*)/i
    );
    if (varMatch) {
      rootVar = varMatch[1] || varMatch[2] || varMatch[3] || varMatch[4];
    }

    // 3. Render the card to this.errorOutput
    this.errorOutput.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.03); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 24px; font-family: var(--md-text-font-family, sans-serif); color: #cbd5e1; margin-top: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); max-width: 640px; margin-left: auto; margin-right: auto; box-sizing: border-box; overflow: hidden; position: relative;">
        <!-- Glowing Red background effect -->
        <div style="position: absolute; top: -100px; left: -100px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%); pointer-events: none; border-radius: 50%;"></div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid rgba(239, 68, 68, 0.15); padding-bottom: 12px;">
          <svg style="width: 24px; height: 24px; fill: #ef4444; flex-shrink: 0;" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3 style="color: #ef4444; font-weight: 700; font-size: 16px; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
            Compile-Time Aliasing Hazard Detected
          </h3>
        </div>

        <p style="font-size: 13.5px; line-height: 1.6; color: #94a3b8; margin: 0; margin-bottom: 20px;">
          The GPU compiler blocked shader creation because multiple overlapping views were passed to a function call where at least one view is used for a potential write.
        </p>

        <!-- Overlapping Path Diagram -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-around; width: 100%; font-size: 11px; font-family: monospace;">
            <div style="color: #ef4444; border: 1.5px solid rgba(239, 68, 68, 0.4); padding: 5px 10px; border-radius: 6px; background: rgba(239, 68, 68, 0.08); font-weight: 700; box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);">
              View 1: Pointer (Write)
            </div>
            <div style="color: #38bdf8; border: 1.5px solid rgba(56, 189, 248, 0.4); padding: 5px 10px; border-radius: 6px; background: rgba(56, 189, 248, 0.08); font-weight: 700;">
              View 2: Pointer/Ref (Read)
            </div>
          </div>

          <div style="height: 60px; display: flex; justify-content: center; align-items: center; position: relative; width: 100%;">
            <svg style="width: 100%; height: 100%;" viewBox="0 0 300 60">
              <defs>
                <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ef4444" />
                  <stop offset="100%" stop-color="#7f1d1d" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path d="M 75,5 L 150,55" stroke="#ef4444" stroke-width="2" stroke-dasharray="3 3" />
              <path d="M 225,5 L 150,55" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3 3" />
              
              <circle cx="150" cy="30" r="16" fill="url(#redGrad)" opacity="0.6" filter="url(#glow)">
                <animate attributeName="r" values="8;20;8" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
              </circle>
              
              <circle cx="150" cy="30" r="8" fill="#ef4444" />
              <text x="150" y="34" fill="#ffffff" font-size="12px" font-weight="900" text-anchor="middle">!</text>
            </svg>
          </div>

          <div style="border: 2px solid #ef4444; border-radius: 6px; background: rgba(239, 68, 68, 0.15); padding: 8px 16px; font-family: monospace; font-size: 13px; font-weight: 700; color: #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.3); text-align: center;">
            Shared Root Memory: ${rootVar}
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 16px; font-size: 12.5px; line-height: 1.6;">
          <strong style="color: #38bdf8; display: block; margin-bottom: 8px;">💡 Compiler Diagnostic:</strong>
          <div style="font-family: monospace; color: #ef4444; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 12px; white-space: pre-wrap; word-break: break-all;">${aliasingDiag.msg}</div>
          <strong style="color: #10b981; display: block; margin-top: 12px; margin-bottom: 8px;">🛠️ Resolving the Hazard:</strong>
          <ul style="margin: 0; padding-left: 20px; color: #94a3b8; display: flex; flex-direction: column; gap: 6px;">
            <li>Pass completely disjoint variables (separate allocations) as arguments.</li>
            <li>If modifying a single module-scope variable, do not pass its pointer parameter as an argument.</li>
            <li>Store the read value in a local thread register variable first, then perform the write operation.</li>
          </ul>
        </div>
      </div>
    `;
    return true;
  }

  renderGenericCompilationError(failure: CompilationFailure): void {
    const errorCount = failure.diagnostics.filter((d) => d.kind === 'error').length;
    const warningCount = failure.diagnostics.filter((d) => d.kind === 'warning').length;

    let statsText = '';
    if (errorCount > 0 && warningCount > 0) {
      statsText = `${errorCount} error${errorCount > 1 ? 's' : ''}, ${warningCount} warning${warningCount > 1 ? 's' : ''}`;
    } else if (errorCount > 0) {
      statsText = `${errorCount} error${errorCount > 1 ? 's' : ''}`;
    } else if (warningCount > 0) {
      statsText = `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
    } else {
      statsText = 'Compilation issue';
    }

    const diagnosticsHtml = failure.diagnostics
      .map((diag) => {
        const isError = diag.kind === 'error';
        const color = isError ? '#ef4444' : '#f59e0b';
        const bg = isError ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)';
        const border = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
        const badgeText = diag.kind.toUpperCase();

        return `
        <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid ${border}; padding-bottom: 8px; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: ${color}; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${badgeText}
              </span>
              <span style="font-family: monospace; font-size: 12px; color: #94a3b8;">
                Line ${diag.line}, Column ${diag.column}
              </span>
            </div>
          </div>
          <div style="font-family: monospace; font-size: 13px; line-height: 1.5; color: ${color}; white-space: pre-wrap; word-break: break-all;">${diag.msg}</div>
        </div>
      `;
      })
      .join('');

    this.errorOutput.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.03); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 24px; font-family: var(--md-text-font-family, sans-serif); color: #cbd5e1; margin-top: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); max-width: 640px; margin-left: auto; margin-right: auto; box-sizing: border-box; overflow: hidden; position: relative;">
        <!-- Glowing Red background effect -->
        <div style="position: absolute; top: -100px; left: -100px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%); pointer-events: none; border-radius: 50%;"></div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid rgba(239, 68, 68, 0.15); padding-bottom: 12px;">
          <svg style="width: 24px; height: 24px; fill: #ef4444; flex-shrink: 0;" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3 style="color: #ef4444; font-weight: 700; font-size: 16px; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
            Shader Compilation Failed
          </h3>
          <span style="margin-left: auto; font-size: 12px; color: #94a3b8; background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 10px; font-weight: 500;">
            ${statsText}
          </span>
        </div>

        <div style="margin-top: 16px; display: flex; flex-direction: column;">
          ${diagnosticsHtml}
        </div>
      </div>
    `;
  }

  renderPipelineError(failure: VisualizerError): void {
    this.errorOutput.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.03); border: 1.5px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 24px; font-family: var(--md-text-font-family, sans-serif); color: #cbd5e1; margin-top: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); max-width: 640px; margin-left: auto; margin-right: auto; box-sizing: border-box; overflow: hidden; position: relative;">
        <!-- Glowing Red background effect -->
        <div style="position: absolute; top: -100px; left: -100px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0) 70%); pointer-events: none; border-radius: 50%;"></div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid rgba(239, 68, 68, 0.15); padding-bottom: 12px;">
          <svg style="width: 24px; height: 24px; fill: #ef4444; flex-shrink: 0;" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h3 style="color: #ef4444; font-weight: 700; font-size: 16px; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
            WebGPU Pipeline Error
          </h3>
        </div>

        <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 16px; font-size: 12.5px; line-height: 1.6;">
          <strong style="color: #38bdf8; display: block; margin-bottom: 8px;">💡 Pipeline Diagnostic:</strong>
          <div style="font-family: monospace; color: #ef4444; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">${failure.message}</div>
        </div>
      </div>
    `;
  }
}
customElements.define('wgsl-tour', WGSLTour);
