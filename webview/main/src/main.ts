import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import {
  browserTracingIntegration,
  init,
  replayIntegration,
} from '@sentry/angular';
if (!ngDevMode) {
  init({
    dsn: 'https://f51634eeed9a4f78a291132069f3c396@debug.shenghuabi.top/2',
    integrations: [browserTracingIntegration(), replayIntegration()],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    maxBreadcrumbs: 0,
  });
}
window.vscode = acquireVsCodeApi();
// window.EXCALIDRAW_ASSET_PATH = '/assets/excalidraw';
bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
