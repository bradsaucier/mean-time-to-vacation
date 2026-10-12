import { TestBed } from "@angular/core/testing";

import { provideHttpClient } from "@angular/common/http";

import { provideHttpClientTesting, HttpTestingController } from "@angular/common/http/testing";

import { describe, it, beforeEach, afterEach, expect } from "vitest";

import { AuthenticationService, TOKEN_KEY } from "./authentication.service";

import { BROWSER_STORAGE } from "../storage";

import { expiredMockToken, mockJwt, MOCK_USER, validMockToken } from "../testing/mock-auth";

describe("AuthenticationService with mock tokens", () => {
  let storage: Map<string, string>;
  let service: AuthenticationService;
  let http: HttpTestingController;
  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: BROWSER_STORAGE,
          useValue: {
            getItem: (k: string) => storage.get(k) ?? null,
            setItem: (k: string, v: string) => storage.set(k, v),
            removeItem: (k: string) => storage.delete(k),
          },
        },
      ],
    });
    service = TestBed.inject(AuthenticationService);
    http = TestBed.inject(HttpTestingController);
  };
  beforeEach(() => (storage = new Map()));
  afterEach(() => http.verify());

  it("is logged out with no token, a malformed token, or an expired token", () => {
    setup();
    expect(service.isLoggedIn()).toBe(false);
    service.saveToken("not-a-jwt");
    expect(service.isLoggedIn()).toBe(false);
    service.saveToken(expiredMockToken());
    expect(service.isLoggedIn()).toBe(false);
  });

  it("reads a valid token, including base64url payload characters", () => {
    storage.set(TOKEN_KEY, validMockToken());
    setup();
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentUser()).toEqual(MOCK_USER);
    const tricky = mockJwt({ name: "???>>>", email: "x", exp: Date.now() / 1000 + 60 });
    service.saveToken(tricky);
    expect(service.isLoggedIn()).toBe(true);
  });

  it("logs in through POST /api/login, stores the token, and logs out", () => {
    setup();
    const token = validMockToken();
    let done = false;
    service
      .login({ email: MOCK_USER.email, name: "" }, "MockPassw0rd!")
      .subscribe(() => (done = true));
    const req = http.expectOne("http://localhost:3000/api/login");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      name: "",
      email: MOCK_USER.email,
      password: "MockPassw0rd!",
    });
    req.flush({ token });
    expect(done).toBe(true);
    expect(storage.get(TOKEN_KEY)).toBe(token);
    expect(service.isLoggedIn()).toBe(true);
    service.logout();
    expect(storage.has(TOKEN_KEY)).toBe(false);
    expect(service.isLoggedIn()).toBe(false);
  });

  it("does not store anything when login is rejected", () => {
    setup();
    let status = 0;
    service
      .login({ email: "x@example.test", name: "" }, "bad")
      .subscribe({ error: (e) => (status = e.status) });
    http
      .expectOne("http://localhost:3000/api/login")
      .flush(
        { message: "Incorrect email or password." },
        { status: 401, statusText: "Unauthorized" },
      );
    expect(status).toBe(401);
    expect(storage.has(TOKEN_KEY)).toBe(false);
  });
});
