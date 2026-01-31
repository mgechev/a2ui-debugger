import { Component, inject, computed } from '@angular/core';
import { DebuggerService } from './debugger.service';

import { JsonTreeComponent } from './json-tree';

@Component({
  selector: 'app-state-viewer',
  template: `
    <div class="state-container">
      <div class="header">
        <h3>Internal State</h3>
      </div>
      <div class="content">
        <app-json-tree [data]="stateObject()"></app-json-tree>
      </div>
    </div>
  `,
  styles: [`
    .state-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--panel-bg);
      color: var(--text-color);
      border-top: 1px solid var(--border-color);
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
    }
    .content {
      flex: 1;
      overflow: auto;
      padding: 16px;
      background-color: var(--panel-bg);
    }
  `],
  standalone: true,
  imports: [JsonTreeComponent]
})
export class StateViewerComponent {
  debuggerService = inject(DebuggerService);
  surfaces = this.debuggerService.surfacesMap; // Use the signal from service

  stateObject = computed(() => {
    // Convert Map to Object for JSON.stringify visualization
    const surfaces = this.surfaces();
    const obj: Record<string, any> = {};
    for (const [id, surface] of surfaces.entries()) {
      obj[id] = {
        rootComponentId: surface.rootComponentId,
        dataModel: this.mapToObject(surface.dataModel),
        componentsCount: surface.components.size,
        // We avoid dumping the full component map to keep it readable, maybe just keys or simplified structure
        componentIds: Array.from(surface.components.keys())
      };
    }
    return obj;
  });

  private mapToObject(map: Map<any, any>): any {
    const out: any = {};
    for (const [k, v] of map.entries()) {
      if (v instanceof Map) {
        out[k] = this.mapToObject(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
}
