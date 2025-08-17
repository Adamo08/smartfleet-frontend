import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(private toastr: ToastrService) { }

  public handleError(error: HttpErrorResponse): void {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Check if the error is a validation error object (e.g., from @Valid).
      if (error.status === 400 && error.error && typeof error.error === 'object' && !Array.isArray(error.error)) {
        const errorMessages = Object.values(error.error).map(msg => msg);
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('<br>');
        }
      }
      // Check if the error is a well-formed ErrorDto object.
      else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
      else {
        // Fallback to a generic message based on the HTTP status code.
        switch (error.status) {
          case 400:
            errorMessage = '400 Bad Request: The request was invalid.';
            break;
          case 401:
            errorMessage = '401 Unauthorized: You are not authorized. Please log in again.';
            break;
          case 404:
            errorMessage = '404 Not Found: The requested resource could not be found.';
            break;
          case 409:
            errorMessage = '409 Conflict: A conflict occurred with the current state of the resource.';
            break;
          case 500:
            errorMessage = '500 Internal Server Error: The server had an issue. Please try again later.';
            break;
          default:
            errorMessage = `Backend returned status code: ${error.status}. Message: ${error.message}`;
            break;
        }
      }
    }

    this.toastr.error(errorMessage, 'Error');
    console.error(error);
  }
}
