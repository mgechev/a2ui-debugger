import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { Catalog, DEFAULT_CATALOG, Theme as ThemeToken } from '@a2ui/angular';
import { DEFAULT_THEME } from './app/default-theme';
import { importProvidersFrom } from '@angular/core';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: Catalog, useValue: DEFAULT_CATALOG },
    { provide: ThemeToken, useValue: DEFAULT_THEME },
    importProvidersFrom(MonacoEditorModule.forRoot())
  ]
}).catch(err => console.error(err));
