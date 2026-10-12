import { Component, inject } from '@angular/core';

import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private readonly authenticationService = inject(AuthenticationService);
  private readonly router = inject(Router);

  public isLoggedIn(): boolean {
    return this.authenticationService.isLoggedIn();
  }

  public userName(): string {
    return this.authenticationService.getCurrentUser().name;
  }

  public onLogout(): void {
    this.authenticationService.logout();
    void this.router.navigate(['/']);
  }
}
