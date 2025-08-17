import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';

import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { httpErrorInterceptor } from './core/interceptors/error-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import { TokenRefreshService } from './core/services/token-refresh.service';

// Import layout components
import { MainLayout } from './shared/layouts/main-layout/main-layout';
import { AuthLayout } from './shared/layouts/auth-layout/auth-layout';
import { AdminLayout } from './shared/layouts/admin-layout/admin-layout';
import { HeaderComponent } from './shared/components/header/header';
import { Footer } from './shared/components/footer/footer';
import { Sidebar } from './shared/components/sidebar/sidebar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, httpErrorInterceptor, loadingInterceptor])
    ),
    provideAnimations(),
    provideToastr({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      enableHtml: true,
      newestOnTop: true,
      extendedTimeOut: 1000,
      toastClass: 'ngx-toastr',
      titleClass: 'ngx-toastr-title',
      messageClass: 'ngx-toastr-message'
    }),
    // Initialize the token refresh service
    TokenRefreshService,
    // Register layout components
    MainLayout,
    AuthLayout,
    AdminLayout,
    HeaderComponent,
    Footer,
    Sidebar
  ]
};
