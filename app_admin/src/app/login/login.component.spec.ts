import { TestBed } from '@angular/core/testing';

import { provideRouter, Router } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { of, throwError } from 'rxjs';

import { describe, it, beforeEach, expect, vi } from 'vitest';

import { LoginComponent } from './login.component';

import { AuthenticationService } from '../services/authentication.service';

describe('Login form', () => {
  const auth = { login: vi.fn(), isLoggedIn: () => false };
  beforeEach(() => {
    auth.login.mockReset();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthenticationService, useValue: auth }],
    });
  });

  it('requires email and password before calling the API', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('button[type=submit]').click();
    await fixture.whenStable();
    expect(auth.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('required');
  });

  it('logs in with mock credentials and navigates to the manifest', async () => {
    auth.login.mockReturnValue(of({ token: 'mock' }));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    fixture.componentInstance.credentials.setValue({ email: 'admin@example.test', password: 'MockPassw0rd!' });
    fixture.componentInstance.onLoginSubmit();
    expect(auth.login).toHaveBeenCalledWith({ name: '', email: 'admin@example.test' }, 'MockPassw0rd!');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('shows an error for rejected credentials', async () => {
    auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    fixture.componentInstance.credentials.setValue({ email: 'admin@example.test', password: 'wrong' });
    fixture.componentInstance.onLoginSubmit();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Incorrect email or password.');
  });
});
