import { TestBed } from "@angular/core/testing";

import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";

import { provideHttpClientTesting, HttpTestingController } from "@angular/common/http/testing";

import { provideRouter, Router } from "@angular/router";

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

import { jwtInterceptor } from "./jwt.interceptor";

import { AuthenticationService } from "../services/authentication.service";

import { validMockToken } from "../testing/mock-auth";

describe("JWT interceptor", () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: AuthenticationService;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthenticationService);
  });
  afterEach(() => ctrl.verify());

  it("sends no Authorization header when logged out", () => {
    http.put("http://localhost:3000/api/trips/KAYK270912", {}).subscribe();
    expect(
      ctrl
        .expectOne("http://localhost:3000/api/trips/KAYK270912")
        .request.headers.has("Authorization"),
    ).toBe(false);
  });

  it("adds a Bearer token to API calls but not to login, register, or other hosts", () => {
    const token = validMockToken();
    auth.saveToken(token);
    http.post("http://localhost:3000/api/trips", {}).subscribe();
    expect(
      ctrl.expectOne("http://localhost:3000/api/trips").request.headers.get("Authorization"),
    ).toBe("Bearer " + token);
    http.post("http://localhost:3000/api/login", {}).subscribe();
    expect(
      ctrl.expectOne("http://localhost:3000/api/login").request.headers.has("Authorization"),
    ).toBe(false);
    http.post("http://localhost:3000/api/register", {}).subscribe();
    expect(
      ctrl.expectOne("http://localhost:3000/api/register").request.headers.has("Authorization"),
    ).toBe(false);
    http.get("https://example.test/other").subscribe();
    expect(ctrl.expectOne("https://example.test/other").request.headers.has("Authorization")).toBe(
      false,
    );
  });

  it("logs out and routes to login when a protected call returns 401", () => {
    auth.saveToken(validMockToken());
    const navigate = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
    http.delete("http://localhost:3000/api/trips/KAYK270912").subscribe({ error: () => undefined });
    ctrl
      .expectOne("http://localhost:3000/api/trips/KAYK270912")
      .flush({ message: "Token expired." }, { status: 401, statusText: "Unauthorized" });
    expect(auth.isLoggedIn()).toBe(false);
    expect(navigate.mock.calls[0][0]).toEqual(["/login"]);
  });
});
