import { Component, inject } from '@angular/core';
import { DebuggerService } from './debugger.service';
import { Types } from '@a2ui/lit/0.8';
import { CommonModule } from '@angular/common';
import { JsonTreeComponent } from './json-tree';

@Component({
  selector: 'app-log-viewer',
  template: `
    <div class="log-container">
      <div class="header">
        <h3>Message Log</h3>
        <button class="btn-clear" (click)="clear()">Clear</button>
      </div>
      <div class="message-list">
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
      <div class="input-area">
        <textarea #input placeholder="Paste JSON/JSONL payload here..."></textarea>
        <button class="btn-send" (click)="processInput(input.value); input.value = ''">Send</button>
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
    }
    .header {
      padding: 0 16px;
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
      font-size: 0.9rem;
      font-weight: 500;
    }
    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 0;
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
    .input-area {
      padding: 12px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--panel-bg);
    }
    textarea {
      height: 80px;
      padding: 12px;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      resize: none;
      background-color: var(--bg-color);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 12px;
      transition: border-color 0.2s;
    }
    textarea:focus {
      outline: none;
      border-color: var(--accent-color);
    }
    .btn-send {
      align-self: flex-end;
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
    .btn-send:hover {
      opacity: 0.9;
    }
    .btn-clear {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: background-color 0.2s;
    }
    .btn-clear:hover {
      background-color: var(--bg-color);
    }
  `],
  standalone: true,
  imports: [CommonModule, JsonTreeComponent]
})
export class LogViewerComponent {
  debuggerService = inject(DebuggerService);
  messages = this.debuggerService.messages;

  expandedEntries = new Set<any>();

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

  processInput(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      // First try to parse as a single JSON object or array (supports pretty-printed)
      const data = JSON.parse(trimmed);
      if (Array.isArray(data)) {
        for (const msg of data) {
          this.debuggerService.processMessage(msg);
        }
      } else {
        this.debuggerService.processMessage(data);
      }
    } catch (e) {
      // If that fails, try processing as JSONL (newline separated)
      try {
        const lines = trimmed.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line);
          this.debuggerService.processMessage(msg);
        }
      } catch (innerError) {
        console.error('Failed to parse input', innerError);
        alert('Invalid JSON input: ' + (innerError instanceof Error ? innerError.message : String(innerError)));
      }
    }
  }

  clear() {
    this.debuggerService.reset();
  }
}
