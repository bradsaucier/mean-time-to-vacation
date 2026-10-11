import { Routes } from '@angular/router';

import { TripListingComponent } from './trip-listing/trip-listing.component';

import { AddTripComponent } from './add-trip/add-trip.component';

import { EditTripComponent } from './edit-trip/edit-trip.component';

export const routes: Routes = [
  { path: '', component: TripListingComponent, title: 'Trip manifest | Travlr Admin' },
  { path: 'add-trip', component: AddTripComponent, title: 'Add trip | Travlr Admin' },
  { path: 'edit-trip/:tripCode', component: EditTripComponent, title: 'Edit trip | Travlr Admin' },
  { path: '**', redirectTo: '' },
];
