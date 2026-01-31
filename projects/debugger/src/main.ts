import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { Catalog, DEFAULT_CATALOG, Theme as ThemeToken } from '@a2ui/angular';
import { DEFAULT_THEME } from './app/default-theme';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: Catalog, useValue: DEFAULT_CATALOG },
    { provide: ThemeToken, useValue: DEFAULT_THEME }
  ]
}).catch(err => console.error(err));
