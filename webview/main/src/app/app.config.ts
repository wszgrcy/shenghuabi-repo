import {
  ApplicationConfig,
  ErrorHandler,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';

import { routes } from './app.routes';
import { PlatformLocation } from '@angular/common';
import { WebViewPlatformLocation } from '../bridge/platform-location';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { createErrorHandler, TraceService } from '@sentry/angular';
import { inject } from '@angular/core';
import { ThemeService } from '@piying-lib/angular-daisyui/service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    { provide: PlatformLocation, useClass: WebViewPlatformLocation },
    provideRouter(routes),
    provideAnimationsAsync(),
    // importProvidersFrom
    { provide: ErrorHandler, useValue: createErrorHandler() },
    { provide: TraceService, deps: [Router] },
    provideAppInitializer(() => {
      inject(TraceService);
    }),
    ThemeService,
  ],
};
