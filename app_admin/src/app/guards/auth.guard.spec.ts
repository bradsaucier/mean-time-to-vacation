import { TestBed } from "@angular/core/testing";

import {
  provideRouter,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { authGuard } from "./auth.guard";

import { AuthenticationService } from "../services/authentication.service";

const logout = vi.fn();

const run = (loggedIn: boolean) => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthenticationService, useValue: { isLoggedIn: () => loggedIn, logout } },
    ],
  });
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url: "/add-trip" } as RouterStateSnapshot),
  );
};

describe("authGuard", () => {
  beforeEach(() => logout.mockClear());
  it("allows a logged-in admin", () => expect(run(true)).toBe(true));
  it("redirects a logged-out visitor to /login with returnUrl", () => {
    const result = run(false) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe("/login?returnUrl=%2Fadd-trip");
    expect(logout).toHaveBeenCalledOnce();
  });
});
