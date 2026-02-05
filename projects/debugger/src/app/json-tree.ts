import { Component, input, forwardRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-json-tree',
  template: `
    <div class="json-tree">
      @if (isPrimitive(data())) {
        <span [class]="getType(data())">{{ formatValue(data()) }}</span>
      } @else {
        <div class="complex-node">
          <div class="toggle" (click)="toggle()">
            <span class="arrow" [class.expanded]="expanded">▶</span>
            @if (key()) { <span class="key">{{ key() }}: </span> }
            <span class="preview">{{ getPreview(data()) }}</span>
          </div>
          
          @if (expanded) {
            <div class="children">
              @for (item of getEntries(data()); track trackByItem($index, item)) {
                <div class="child-item">
                  @if (!isArray(data())) { <span class="key">{{ item.key }}: </span> }
                  <app-json-tree [data]="item.value" [key]="isArray(data()) ? '' : ''"></app-json-tree>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  // ... styles ...
  standalone: true,
  imports: [forwardRef(() => JsonTreeComponent), CommonModule]
})
export class JsonTreeComponent {
  data = input.required<any>();
  key = input('');

  expanded = false;
  private cd = inject(ChangeDetectorRef);

  toggle() {
    this.expanded = !this.expanded;
    this.cd.detectChanges();
  }

  trackByItem(index: number, item: any): string {
    return item.key;
  }

  isPrimitive(val: any): boolean {
    return val === null || typeof val !== 'object';
  }

  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  getType(val: any): string {
    if (val === null) return 'null';
    return typeof val;
  }

  formatValue(val: any): string {
    if (val === null) return 'null';
    if (typeof val === 'string') return `"${val}"`;
    return String(val);
  }

  getPreview(val: any): string {
    if (Array.isArray(val)) {
      return `Array(${val.length})`;
    }
    // Safe check if val is object
    return val && typeof val === 'object' ? `{ ... }` : String(val);
  }

  getEntries(val: any): { key: string, value: any }[] {
    if (!val || typeof val !== 'object') return [];
    if (Array.isArray(val)) {
      return val.map((v, i) => ({ key: String(i), value: v }));
    }
    return Object.entries(val).map(([k, v]) => ({ key: k, value: v }));
  }
}
