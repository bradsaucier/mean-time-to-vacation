import { Routes } from '@angular/router';

import { TripListingComponent } from './trip-listing/trip-listing.component';

import { AddTripComponent } from './add-trip/add-trip.component';

import { EditTripComponent } from './edit-trip/edit-trip.component';

import { LoginComponent } from './login/login.component';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: TripListingComponent, title: 'Trip manifest | Travlr Admin' },
  { path: 'login', component: LoginComponent, title: 'Log in | Travlr Admin' },
  {
    path: 'add-trip',
    component: AddTripComponent,
    canActivate: [authGuard],
    title: 'Add trip | Travlr Admin',
  },
  {
    path: 'edit-trip/:tripCode',
    component: EditTripComponent,
    canActivate: [authGuard],
    title: 'Edit trip | Travlr Admin',
  },
  { path: '**', redirectTo: '' },
];
