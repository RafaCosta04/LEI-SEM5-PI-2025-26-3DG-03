import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom
} from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DropdownModule, SidebarModule } from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';

import { routes } from './app.routes';
import { AuthModule } from '@auth0/auth0-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      AuthModule.forRoot({
        domain: 'dev-sxooc3zbxwdqprci.us.auth0.com',
        clientId: 'ZiL9lSLVIJnHqqmOXXdegwCQTfwQQWt0',
        authorizationParams: {
          redirect_uri: window.location.origin,
          audience: 'https://lapr5-api',
        },
        cacheLocation: 'memory',
        useRefreshTokens: true
      })
    ),

    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideHttpClient(withInterceptorsFromDi()),

    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      }),
      withEnabledBlockingInitialNavigation(),
      withViewTransitions()
    ),

    importProvidersFrom(SidebarModule, DropdownModule),
    IconSetService,

    provideAnimationsAsync()
  ]
};
