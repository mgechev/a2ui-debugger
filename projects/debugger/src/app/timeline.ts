import { Component, inject, computed } from '@angular/core';
import { DebuggerService } from './debugger.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timeline',
  template: `
    <div class="timeline-container">
      <div class="controls">
        <button (click)="stepBack()" [disabled]="currentIndex() <= 0" title="Step Back">◀</button>
        <div class="slider-wrapper">
          <input 
            type="range" 
            [min]="-1" 
            [max]="maxIndex()" 
            [value]="currentIndex()" 
            (input)="onSliderChange($event)"
            class="timeline-slider"
          >
          <div class="label">{{ currentIndex() + 1 }} / {{ totalMessages() }}</div>
        </div>
        <button (click)="stepForward()" [disabled]="currentIndex() >= maxIndex()" title="Step Forward">▶</button>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      height: 40px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      background: var(--panel-bg);
      border-top: 1px solid var(--border-color);
      color: var(--text-color);
    }
    .controls {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 12px;
    }
    .slider-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .timeline-slider {
      flex: 1;
      cursor: pointer;
      width: 100%;
    }
    .label {
      font-size: 11px;
      font-family: monospace;
      min-width: 60px;
      text-align: right;
      color: var(--text-color);
      opacity: 0.7;
    }
    button {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-color);
      width: 28px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 10px;
    }
    button:hover:not(:disabled) {
      background-color: var(--header-bg);
    }
    button:disabled {
      opacity: 0.3;
      cursor: default;
    }
  `],
  standalone: true,
  imports: [FormsModule]
})
export class TimelineComponent {
  debuggerService = inject(DebuggerService);

  currentIndex = this.debuggerService.currentIndex;
  history = this.debuggerService.history;

  maxIndex = computed(() => this.history().length - 1);
  totalMessages = computed(() => this.history().length);

  onSliderChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.debuggerService.jumpTo(value);
  }

  stepBack() {
    this.debuggerService.jumpTo(this.currentIndex() - 1);
  }

  stepForward() {
    this.debuggerService.jumpTo(this.currentIndex() + 1);
  }
}
