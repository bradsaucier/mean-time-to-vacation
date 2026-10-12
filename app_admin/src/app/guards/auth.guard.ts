import { inject } from "@angular/core";

import { CanActivateFn, Router } from "@angular/router";

import { AuthenticationService } from "../services/authentication.service";

// Sends logged-out users to the login page instead of an unusable admin form.
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthenticationService);
  if (auth.isLoggedIn()) return true;
  auth.logout();
  return inject(Router).createUrlTree(["/login"], { queryParams: { returnUrl: state.url } });
};
