import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';

import { Router } from '@angular/router';

import { catchError, throwError } from 'rxjs';

import { AuthenticationService } from '../services/authentication.service';

import { TripDataService } from '../services/trip-data.service';

// Attaches the JWT to API calls (guide pp. 219-220) as a functional interceptor.
export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthenticationService);
  const router = inject(Router);
  const apiBase = inject(TripDataService).baseUrl;
  const isApi = request.url.startsWith(apiBase + '/');
  const isAuthAPI = request.url === apiBase + '/login' || request.url === apiBase + '/register';

  if (isApi && !isAuthAPI && auth.isLoggedIn()) {
    request = request.clone({ setHeaders: { Authorization: `Bearer ${auth.getToken()}` } });
  }
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isApi && !isAuthAPI) {
        auth.logout();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
