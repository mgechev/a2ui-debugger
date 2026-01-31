import { Component } from '@angular/core';
import { LogViewerComponent } from './log-viewer';
import { PreviewComponent } from './preview';
import { StateViewerComponent } from './state-viewer';
import { TimelineComponent } from './timeline';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header class="app-header">
        <div class="logo">A2UI Debugger</div>
        <button class="theme-toggle" (click)="toggleTheme()" [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
      </header>
      <div class="content-wrapper">
        <div class="sidebar">
          <app-log-viewer></app-log-viewer>
        </div>
        <div class="main-content">
          <div class="preview-pane">
             <app-preview></app-preview>
          </div>
          <div class="state-pane">
             <app-state-viewer></app-state-viewer>
          </div>
          <app-timeline></app-timeline>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [LogViewerComponent, PreviewComponent, StateViewerComponent, TimelineComponent],
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
      background-color: var(--bg-color);
      color: var(--text-color);
    }
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
    .app-header {
      height: 50px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
    }
    .logo {
      font-weight: 600;
      font-size: 1.1rem;
    }
    .theme-toggle {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 4px 8px;
    }
    .theme-toggle:hover {
      background-color: var(--bg-color);
    }
    .content-wrapper {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .sidebar {
      width: 400px;
      height: 100%;
      overflow: hidden;
      border-right: 1px solid var(--border-color);
      background-color: var(--panel-bg);
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .preview-pane {
      flex: 2;
      overflow: hidden;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--surface-bg);
    }
    .state-pane {
      flex: 1;
      overflow: hidden;
      background-color: var(--panel-bg);
      display: flex;
      flex-direction: column;
    }
    app-timeline {
      display: block;
      width: 100%;
    }
  `]
})
export class AppComponent {
  title = 'debugger';
  isDarkMode = false;

  constructor() {
    this.initializeTheme();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.updateTheme();
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.updateTheme();
  }

  private updateTheme() {
    document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }
}
