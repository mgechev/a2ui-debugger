import { Injectable, computed, signal } from '@angular/core';
import { Data, Types } from '@a2ui/lit/0.8';

export interface LogEntry {
  timestamp: Date;
  message: Types.ServerToClientMessage;
}

@Injectable({
  providedIn: 'root'
})
export class DebuggerService {
  private processor = new Data.A2uiMessageProcessor();

  readonly history = signal<LogEntry[]>([]);
  readonly currentIndex = signal<number>(-1);
  readonly currentVersion = signal<string>('0.8');

  // Compute messages based on current index for the log viewer
  readonly messages = computed(() => {
    const idx = this.currentIndex();
    const hist = this.history();
    if (idx < 0) return [];
    return hist.slice(0, idx + 1);
  });

  readonly surfaces = computed(() => this.processor.getSurfaces());

  constructor() { }

  processMessage(message: Types.ServerToClientMessage) {
    const entry = { timestamp: new Date(), message };

    // If we are in the past, truncate history before adding new message
    // strict time travel: branching not supported, we overwrite future
    const currentIdx = this.currentIndex();
    const currentHist = this.history();

    let newHistory = currentHist;
    if (currentIdx < currentHist.length - 1) {
      newHistory = currentHist.slice(0, currentIdx + 1);
    }

    newHistory = [...newHistory, entry];
    this.history.set(newHistory);
    this.currentIndex.set(newHistory.length - 1);

    // Apply strictly this message to the processor (incremental update)
    this.processor.processMessages([message]);
    this.triggerUpdate.update(v => v + 1);
  }

  jumpTo(index: number) {
    const hist = this.history();
    if (index < -1 || index >= hist.length) return;

    // Reset processor state
    this.processor.clearSurfaces();

    // Replay up to the target index
    // Optimization: In a real app we might use snapshots, but for now replay from 0 is fine
    for (let i = 0; i <= index; i++) {
      this.processor.processMessages([hist[i].message]);
    }

    this.currentIndex.set(index);
    this.triggerUpdate.update(v => v + 1);
  }

  // A signal to manually trigger re-computation of surfaces since the processor mutates internal state
  private triggerUpdate = signal(0);

  // Expose surfaces with dependency on triggerUpdate
  readonly surfacesMap = computed(() => {
    this.triggerUpdate(); // register dependency
    return new Map(this.processor.getSurfaces());
  });

  reset() {
    this.processor.clearSurfaces();
    this.history.set([]);
    this.currentIndex.set(-1);
    this.triggerUpdate.update(v => v + 1);
  }

  loadHistory(history: Types.ServerToClientMessage[]) {
    this.reset();
    // Batch process? For now simply iterating is safer to reuse logic
    for (const msg of history) {
      this.processMessage(msg);
    }
  }

  getProcessor() {
    return this.processor;
  }
}
