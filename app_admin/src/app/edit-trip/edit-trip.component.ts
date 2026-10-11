import { Component, inject, signal, OnInit } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { AddTripComponent } from '../add-trip/add-trip.component';

import { TripFormComponent } from '../trip-form/trip-form.component';

import { TripInput } from '../models/trip';

import { describeHttpError } from '../services/trip-data.service';

@Component({
  selector: 'app-edit-trip',
  imports: [TripFormComponent, RouterLink],
  templateUrl: './edit-trip.component.html',
})
export class EditTripComponent extends AddTripComponent implements OnInit {
  protected override action = 'updated';
  readonly code = inject(ActivatedRoute).snapshot.paramMap.get('tripCode') || '';
  readonly loading = signal(true);
  readonly loadError = signal('');
  ngOnInit() {
    this.data.getTrip(this.code).subscribe({
      next: (trip) => {
        this.form.reset({ ...trip, start: trip.start.slice(0, 10) });
        this.form.controls.code.disable();
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(describeHttpError(error));
        this.loading.set(false);
      },
    });
  }
  protected override saveTrip(trip: TripInput) {
    return this.data.updateTrip(this.code, trip);
  }
}
