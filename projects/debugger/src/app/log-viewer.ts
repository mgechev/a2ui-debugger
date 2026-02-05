import { Component, ElementRef, ViewChild, inject, effect, signal, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DebuggerService } from './debugger.service';
import { Types } from '@a2ui/lit/0.8';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonTreeComponent } from './json-tree';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import * as jsonc from 'jsonc-parser';

// Declare monaco global for type checking or access
declare const monaco: any;

// A2UI Schema Definition v0.8
const A2UI_SCHEMA_0_8 = {
  "title": "A2UI Message Schema (v0.8)",
  "description": "Describes a JSON payload for an A2UI (Agent to UI) message.",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "beginRendering": {
      "type": "object",
      "description": "Signals the client to begin rendering a surface.",
      "additionalProperties": false,
      "properties": {
        "surfaceId": { "type": "string" },
        "root": { "type": "string" },
        "styles": {
          "type": "object",
          "properties": {
            "font": { "type": "string" },
            "primaryColor": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" }
          }
        }
      },
      "required": ["root", "surfaceId"]
    },
    "surfaceUpdate": {
      "type": "object",
      "description": "Updates a surface with a new set of components.",
      "additionalProperties": false,
      "properties": {
        "surfaceId": { "type": "string" },
        "components": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "id": { "type": "string" },
              "weight": { "type": "number" },
              "component": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                  "Text": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                      "text": {
                        "type": "object",
                        "properties": {
                          "literalString": { "type": "string" },
                          "path": { "type": "string" }
                        }
                      },
                      "usageHint": {
                        "type": "string",
                        "enum": ["h1", "h2", "h3", "h4", "h5", "caption", "body"]
                      }
                    },
                    "required": ["text"]
                  },
                  "Button": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                      "child": { "type": "string" },
                      "action": {
                        "type": "object",
                        "properties": {
                          "name": { "type": "string" },
                          "context": { "type": "array" }
                        },
                        "required": ["name"]
                      }
                    },
                    "required": ["child", "action"]
                  },
                  "Column": {
                    "type": "object",
                    "properties": {
                      "children": {
                        "type": "object",
                        "properties": {
                          "explicitList": { "type": "array", "items": { "type": "string" } }
                        }
                      }
                    },
                    "required": ["children"]
                  },
                  "Row": {
                    "type": "object",
                    "properties": {
                      "children": {
                        "type": "object",
                        "properties": {
                          "explicitList": { "type": "array", "items": { "type": "string" } }
                        }
                      }
                    },
                    "required": ["children"]
                  },
                  "Card": {
                    "type": "object",
                    "properties": {
                      "child": { "type": "string" }
                    },
                    "required": ["child"]
                  }
                }
              }
            },
            "required": ["id", "component"]
          }
        }
      },
      "required": ["surfaceId", "components"]
    },
    "dataModelUpdate": {
      "type": "object",
      "properties": {
        "surfaceId": { "type": "string" },
        "contents": { "type": "object" }
      },
      "required": ["contents"]
    }
  }
};

// A2UI Schema Definition v0.9 (Placeholder / Future)
// For now we duplicate 0.8 but maybe add a dummy field to prove switching works
const A2UI_SCHEMA_0_9 = {
  ...A2UI_SCHEMA_0_8,
  "title": "A2UI Message Schema (v0.9 BETA)",
  "properties": {
    ...A2UI_SCHEMA_0_8.properties,
    "experimentalFeature": {
      "type": "boolean",
      "description": "A new feature available only in 0.9"
    }
  }
};

@Component({
  selector: 'app-log-viewer',
  template: `
    <div class="log-container" (mouseup)="stopResize()" (mousemove)="onResize($event)" (mouseleave)="stopResize()">
      
      <!-- Top Pane: Input / Editor -->
      <div class="top-pane" [style.height.%]="editorHeightPercentage">
        <div class="header">
          <div class="title-group">
            <h3>Input</h3>
            <div class="version-selector">
              <label for="version">v</label>
              <select id="version" [ngModel]="currentVersion()" (ngModelChange)="setVersion($event)">
                <option value="0.8">0.8</option>
                <option value="0.9">0.9</option>
              </select>
            </div>
          </div>
          <div class="sse-trigger">
             <div class="sse-header" (click)="toggleSseExpanded()">
               <span class="status-dot" [class.connected]="debuggerService.isConnected()"></span>
               <span>SSE Stream</span>
               <span class="arrow">{{ isSseExpanded() ? '▼' : '▶' }}</span>
             </div>
          </div>
        </div>
        
        <div class="sse-panel" *ngIf="isSseExpanded()">
           <div class="sse-form">
              <input type="text" [(ngModel)]="sseUrl" placeholder="SSE URL" class="url-input">
              <button (click)="toggleConnection()" class="connect-btn" [class.connected]="debuggerService.isConnected()">
                {{ debuggerService.isConnected() ? 'Disconnect' : 'Connect' }}
              </button>
           </div>
        </div>
        
        <div class="input-area">
          <ngx-monaco-editor
            class="editor"
            [options]="editorOptions"
            [(ngModel)]="code"
            (onInit)="onEditorInit($event)">
          </ngx-monaco-editor>
          
          <div class="status-bar">
            <span class="status-text" [class.error]="errorMessage">{{ errorMessage }}</span>
            <div class="status-actions">
              <button class="btn-primary" (click)="processInput()">Send</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Resize Splitter -->
      <div class="splitter" (mousedown)="startResize($event)"></div>

      <!-- Bottom Pane: Message Log -->
      <div class="bottom-pane">
        <div class="header">
          <h3>Message Log</h3>
          <div class="actions">
            <button class="btn-icon" (click)="clear()" title="Clear Log">
              <svg class="icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
              Clear
            </button>
          </div>
        </div>

        <div class="message-list" #messageList>
          @for (entry of messages(); track entry) {
            <div class="message-item">
              <div class="message-summary" (click)="toggleEntry(entry)">
                <span class="timestamp">{{ entry.timestamp | date:'mediumTime' }}</span>
                <span class="type">{{ getMessageType(entry.message) }}</span>
                <span class="arrow">{{ isExpanded(entry) ? '▼' : '▶' }}</span>
              </div>
              @if (isExpanded(entry)) {
                <div class="message-detail">
                  <app-json-tree [data]="entry.message"></app-json-tree>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .log-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--panel-bg);
      color: var(--text-color);
      position: relative;
      overflow: hidden;
    }
    
    .top-pane {
      display: flex;
      flex-direction: column;
      min-height: 10%;
      max-height: 90%;
      overflow: hidden;
    }

    .bottom-pane {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      min-height: 10%;
    }

    .header {
      padding: 0 16px;
      height: 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
      border-top: 1px solid var(--border-color);
      font-size: 0.85rem;
      font-weight: 500;
      flex-shrink: 0;
    }
    .top-pane .header {
        border-top: none; 
    }
    
    .title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sse-trigger {
       margin-left: auto;
    }
    .sse-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .sse-header:hover {
      background: var(--bg-color);
    }
    
    .sse-panel {
      background: var(--bg-color);
      border-bottom: 1px solid var(--border-color);
      padding: 8px;
    }
    .sse-form {
      display: flex;
      gap: 8px;
    }
    .url-input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--panel-bg);
      color: var(--text-color);
      font-size: 11px;
    }
    .connect-btn {
      padding: 4px 12px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--accent-color);
      color: white;
      cursor: pointer;
      font-size: 11px;
      border: none;
    }
    .connect-btn.connected {
      background: #e74c3c;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ccc;
    }
    .status-dot.connected {
      background: #2ecc71;
    }
    
    .version-selector {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      opacity: 0.8;
    }
    
    .version-selector select {
      background: var(--bg-color);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 0.8rem;
    }

    .splitter {
      height: 5px;
      background-color: var(--border-color);
      cursor: row-resize;
      flex-shrink: 0;
      z-index: 10;
      transition: background-color 0.2s;
    }
    .splitter:hover {
      background-color: var(--accent-color);
    }
    
    .input-area {
      flex: 1; 
      display: flex;
      flex-direction: column;
      background: var(--panel-bg);
      min-height: 0;
    }

    .editor {
      flex: 1;
      height: 100%;
      min-height: 0;
    }

    /* Status Bar */
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--header-bg);
      border-top: 1px solid var(--border-color);
      flex-shrink: 0;
    }
    .status-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .status-text {
      font-size: 11px;
      color: var(--text-color);
      opacity: 0.8;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 50%;
    }
    .status-text.error {
      color: #ff5252;
    }

    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      background: var(--panel-bg);
    }
    
    .message-item {
      border-bottom: 1px solid var(--border-color);
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
    }
    .message-summary {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: background-color 0.2s;
    }
    .message-summary:hover {
      background-color: var(--code-bg);
    }
    .message-detail {
      padding: 8px 16px;
      background-color: var(--code-bg);
      border-top: 1px solid var(--border-color);
    }
    .arrow {
      margin-left: auto;
      font-size: 10px;
      color: var(--text-color);
      opacity: 0.6;
      padding-right: 4px;
    }
    .timestamp {
      color: var(--text-color);
      opacity: 0.6;
      margin-right: 12px;
      font-size: 11px;
    }
    .type {
      font-weight: 600;
      color: var(--accent-color);
    }

    /* Buttons */
    .btn-primary {
      padding: 6px 16px;
      cursor: pointer;
      background-color: var(--accent-color);
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      font-size: 12px;
      transition: opacity 0.2s;
    }
    .btn-primary:hover {
      opacity: 0.9;
    }
    
    .btn-icon {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-icon:hover {
      background-color: var(--bg-color);
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, JsonTreeComponent, MonacoEditorModule]
})
export class LogViewerComponent implements OnChanges {
  @Input() isDarkMode = false;
  @ViewChild('messageList') messageList!: ElementRef;
  debuggerService = inject(DebuggerService);
  messages = this.debuggerService.messages;
  currentVersion = this.debuggerService.currentVersion;

  sseUrl = 'http://localhost:8000/stream';
  isSseExpanded = signal(false);

  toggleSseExpanded() {
    this.isSseExpanded.update(v => !v);
  }

  toggleConnection() {
    if (this.debuggerService.isConnected()) {
      this.debuggerService.disconnect();
    } else {
      this.debuggerService.connect(this.sseUrl);
    }
  }

  code: string = '';
  errorMessage: string = '';
  editor: any;

  editorOptions = {
    theme: 'vs-dark',
    language: 'json',
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    fontSize: 12,
    tabSize: 2,
    automaticLayout: true
  };

  expandedEntries = new Set<any>();

  // Layout State
  editorHeightPercentage = 70;
  private isResizing = false;
  private lastHistoryLength = 0;

  constructor(private elementRef: ElementRef) {
    // Effect to react to version changes and update schema
    effect(() => {
      const ver = this.currentVersion();
      this.updateSchema(ver);
    });

    // Effect to stream messages to editor
    effect(() => {
      const history = this.debuggerService.history();

      // Handle reset (history cleared)
      if (history.length < this.lastHistoryLength) {
        this.lastHistoryLength = history.length;
        return;
      }

      // Only stream if connected and there are new messages
      if (this.debuggerService.isConnected() && history.length > this.lastHistoryLength) {
        // Append new messages to the editor content
        let currentCode = this.code.trim();
        const newEntries = history.slice(this.lastHistoryLength);

        // If empty, start an array or object? Start array for logs.
        if (!currentCode) {
          currentCode = '[\n]';
        }

        // Check if it looks like an array we can append to
        const arrayEndRegex = /\]\s*$/;
        if (arrayEndRegex.test(currentCode)) {
          // It's an array, remove the closing brace and append items
          let body = currentCode.replace(arrayEndRegex, '');
          // Add comma if not just opening bracket
          if (!body.trim().endsWith('[')) {
            body += ',\n';
          }

          const entriesStrings = newEntries.map(e => JSON.stringify(e.message, null, 2));
          this.code = body + entriesStrings.join(',\n') + '\n]';

        } else {
          // It's likely a single object or invalid. 
          // If we force array, we overwrite or wrap?
          // Let's wrap current content if it looks like a valid object, or just replace/append?
          // Simplest for "stacking up": Convert to array if not already.

          // If it was a single object, wrap it:
          if (currentCode.startsWith('{')) {
            const entriesStrings = newEntries.map(e => JSON.stringify(e.message, null, 2));
            this.code = `[\n${currentCode},\n${entriesStrings.join(',\n')}\n]`;
          } else {
            // Just replace or append? Let's just append to array
            const entriesStrings = newEntries.map(e => JSON.stringify(e.message, null, 2));
            this.code = `[\n${entriesStrings.join(',\n')}\n]`;
          }
        }

        // Auto-scroll to bottom
        if (this.editor) {
          setTimeout(() => {
            const model = this.editor.getModel();
            if (model) {
              this.editor.revealLine(model.getLineCount());
            }
          });
        }

        // Auto-scroll message list
        if (this.messageList) {
          setTimeout(() => {
            this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
          });
        }
      }

      this.lastHistoryLength = history.length;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isDarkMode']) {
      this.updateEditorTheme();
    }
  }

  updateEditorTheme() {
    if (this.editor && typeof monaco !== 'undefined') {
      monaco.editor.setTheme(this.isDarkMode ? 'vs-dark' : 'vs');
    } else {
      // Only update options if editor is not yet initialized to avoid re-init loop
      this.editorOptions = { ...this.editorOptions, theme: this.isDarkMode ? 'vs-dark' : 'vs' };
    }
  }

  onEditorInit(editor: any) {
    this.editor = editor;
    this.updateSchema(this.currentVersion());
    this.updateEditorTheme();

    // Subscribe to content changes for custom logic if needed
    editor.onDidChangeModelContent(() => {
      this.validateInput();
    });
  }

  setVersion(version: string) {
    this.currentVersion.set(version);
  }

  updateSchema(version: string) {
    if (typeof monaco === 'undefined' || !this.editor) return;

    const jsonDefaults = monaco.languages.json.jsonDefaults;
    const schema = version === '0.9' ? A2UI_SCHEMA_0_9 : A2UI_SCHEMA_0_8;

    jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: 'http://a2ui/schema.json',
        fileMatch: ['*'],
        schema: {
          oneOf: [
            schema,
            { type: 'array', items: schema }
          ]
        }
      }],
      enableSchemaRequest: false
    });

    // Force re-validation
    const model = this.editor.getModel();
    if (model) {
      // Trigger a dummy edit or re-validate if possible, 
      // usually setting diagnostics options triggers it eventually.
    }
  }

  // Resizing Logic
  startResize(event: MouseEvent) {
    this.isResizing = true;
    event.preventDefault(); // Prevent text selection
  }

  onResize(event: MouseEvent) {
    if (!this.isResizing) return;

    const container = this.elementRef.nativeElement.querySelector('.log-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const relativeY = event.clientY - containerRect.top;
    let percentage = (relativeY / containerRect.height) * 100;

    // Constrain (e.g., 10% to 90%)
    percentage = Math.max(10, Math.min(90, percentage));

    this.editorHeightPercentage = percentage;
  }

  stopResize() {
    this.isResizing = false;
  }

  validateInput() {
    if (!this.code || !this.code.trim()) {
      this.errorMessage = '';
      return;
    }

    const errors: jsonc.ParseError[] = [];
    jsonc.parseTree(this.code, errors);

    if (errors.length > 0) {
      this.errorMessage = `Syntax Error: ${this.getJsoncErrorText(errors[0].error)}`;
    } else {
      this.errorMessage = '';
    }
  }

  getJsoncErrorText(errorCode: jsonc.ParseErrorCode): string {
    switch (errorCode) {
      case 1: return 'Invalid symbol';
      case 2: return 'Invalid number format';
      case 3: return 'Property name expected';
      case 4: return 'Value expected';
      case 5: return 'Colon expected';
      case 6: return 'Comma expected';
      case 7: return 'Close brace expected';
      case 8: return 'Close bracket expected';
      case 9: return 'End of file expected';
      case 10: return 'Invalid comment token';
      case 11: return 'Unexpected end of comment';
      case 12: return 'Unexpected end of string';
      case 13: return 'Unexpected end of number';
      case 14: return 'Invalid unicode sequence';
      case 15: return 'Invalid escape character';
      case 16: return 'Invalid character';
      default: return 'Syntax error';
    }
  }

  toggleEntry(entry: any) {
    if (this.expandedEntries.has(entry)) {
      this.expandedEntries.delete(entry);
    } else {
      this.expandedEntries.add(entry);
    }
  }

  isExpanded(entry: any) {
    return this.expandedEntries.has(entry);
  }

  getMessageType(message: Types.ServerToClientMessage): string {
    if (message.surfaceUpdate) return 'Surface Update';
    if (message.dataModelUpdate) return 'Data Model Update';
    if (message.beginRendering) return 'Begin Rendering';
    if (message.deleteSurface) return 'Delete Surface';
    return 'Unknown';
  }

  processInput() {
    const trimmed = this.code.trim();
    if (!trimmed) return;

    try {
      const data = jsonc.parse(trimmed);

      if (Array.isArray(data)) {
        for (const msg of data) {
          this.debuggerService.processMessage(msg);
        }
      } else {
        this.debuggerService.processMessage(data);
      }

      this.code = '';
      this.errorMessage = '';

    } catch (e) {
      try {
        const lines = trimmed.split('\n');
        let successCount = 0;

        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          this.debuggerService.processMessage(msg);
          successCount++;
        }

        if (successCount > 0) {
          this.code = '';
          this.errorMessage = '';
        }
      } catch (innerError) {
        console.error('Failed to parse input', innerError);
        this.errorMessage = 'Processing Failed: Check syntax above or console logs';
      }
    }
  }

  clear() {
    this.debuggerService.reset();
  }
}
