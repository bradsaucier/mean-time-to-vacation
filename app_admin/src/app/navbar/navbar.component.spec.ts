import { TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { describe, it, beforeEach, expect } from 'vitest';

import { NavbarComponent } from './navbar.component';

import { AuthenticationService } from '../services/authentication.service';

import { validMockToken } from '../testing/mock-auth';

describe('Navbar login state', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [NavbarComponent], providers: [provideRouter([])] });
  });
  it('toggles between Log In and Log Out', async () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Log In');
    TestBed.inject(AuthenticationService).saveToken(validMockToken());
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Log Out');
    expect(fixture.nativeElement.textContent).toContain('Test Admin');
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Log In');
    expect(localStorage.getItem('travlr-token')).toBeNull();
  });
});
