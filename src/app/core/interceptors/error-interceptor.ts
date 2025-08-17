import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorService} from '../services/error';

/**
 * HttpInterceptorFn for global error handling.
 * This interceptor intercepts all HTTP requests and delegates error handling to the ErrorService.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject the ErrorService to use its methods.
  const errorService = inject(ErrorService);

  return next(req).pipe(
    // Catch errors in the observable stream.
    catchError((error: HttpErrorResponse) => {
      // Call the centralized error handler in the ErrorService.
      errorService.handleError(error);

      // Re-throw the error to propagate it to the component or service that made the call.
      return throwError(() => error);
    })
  );
};
