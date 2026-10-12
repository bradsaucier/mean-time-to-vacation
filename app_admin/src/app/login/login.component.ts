import { Component, inject, signal } from '@angular/core';

import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { AuthenticationService } from '../services/authentication.service';

import { User } from '../models/user';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authenticationService = inject(AuthenticationService);
  readonly formError = signal('');
  readonly submitting = signal(false);
  readonly credentials = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  public onLoginSubmit(): void {
    this.formError.set('');
    if (this.credentials.invalid) {
      this.credentials.markAllAsTouched();
      this.formError.set('Email and password are required, please try again');
      return;
    }
    this.doLogin();
  }

  private doLogin(): void {
    const { email, password } = this.credentials.getRawValue();
    const user = { name: '', email: email.trim() } as User;
    this.submitting.set(true);
    this.authenticationService.login(user, password).subscribe({
      next: () => {
        this.submitting.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/');
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.formError.set(
          error.status === 0
            ? 'Cannot reach the trip server. Check that Express is running, then try again.'
            : error.status === 401
              ? 'Incorrect email or password.'
              : error.error?.message || 'Login failed. Try again.',
        );
      },
    });
  }
}
