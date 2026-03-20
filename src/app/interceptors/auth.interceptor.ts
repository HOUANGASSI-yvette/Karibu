import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const http = inject(HttpClient);
  
  let authReq = req;
  const token = authService.getAccessToken();
  
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !authReq.url.includes('auth/login') && !authReq.url.includes('auth/refresh')) {
        return handle401Error(authReq, next, authService, http);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, http: HttpClient): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();
    if (refreshToken) {
      return http.post<any>('http://localhost:8000/api/auth/refresh/', { refresh: refreshToken }).pipe(
        switchMap((res: any) => {
          isRefreshing = false;
          authService.setTokens({ access: res.access, refresh: refreshToken });
          refreshTokenSubject.next(res.access);
          return next(req.clone({
            setHeaders: {
              Authorization: `Bearer ${res.access}`
            }
          }));
        }),
        catchError((err) => {
          isRefreshing = false;
          authService.clearTokens();
          // Optionally redirect using Router
          return throwError(() => err);
        })
      );
    }
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(jwt => {
      return next(req.clone({
        setHeaders: {
          Authorization: `Bearer ${jwt}`
        }
      }));
    })
  );
}
