import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { inject } from '@angular/core';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // We can inject a loading service here to show/hide loading indicators
  return next(req).pipe(
    finalize(() => {
      // Hide loading indicator
    })
  );
};
