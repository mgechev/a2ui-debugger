import { Component, computed, inject } from '@angular/core';
import { Surface } from '@a2ui/angular';
import { Types } from '@a2ui/lit/0.8';
import { DebuggerService } from './debugger.service';

@Component({
  selector: 'app-preview',
  template: `
    <div class="preview-container">
      <div class="header">
        <h3>UI Preview</h3>
      </div>
      <div class="canvas">
         @if (surfaces().length === 0) {
           <div class="empty-state">
             No surfaces to render. Send a payload to start.
           </div>
         }
         @for (surface of surfaces(); track surface.id) {
           <div class="surface-wrapper">
               <div class="surface-label">Surface: {{ surface.id }}</div>
               <a2ui-surface [surfaceId]="surface.id" [surface]="surface.data"></a2ui-surface>
           </div>
         }
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--surface-bg);
    }
    .header {
      padding: 0 16px;
      height: 40px;
      display: flex;
      align-items: center;
      background: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
    }
    h3 {
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0;
      color: var(--text-color);
    }
    .canvas {
      flex: 1;
      overflow: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .empty-state {
      color: var(--text-color);
      opacity: 0.5;
      text-align: center;
      margin-top: 60px;
      font-weight: 500;
    }
    .surface-wrapper {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 24px;
      background: var(--bg-color);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .surface-wrapper:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      border-color: var(--accent-color);
    }
    .surface-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-color);
      opacity: 0.5;
      margin-bottom: 12px;
      font-weight: 600;
    }
  `],
  standalone: true,
  imports: [Surface]
})
export class PreviewComponent {
  debuggerService = inject(DebuggerService);

  // Transform the Map into an array for *ngFor
  // We need both ID and Data
  surfaces = computed(() => {
    const map = this.debuggerService.surfacesMap();
    const result: { id: string, data: Types.Surface }[] = [];
    for (const [id, data] of map.entries()) {
      result.push({ id, data });
    }
    return result;
  });
}
