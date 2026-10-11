import { Component, inject, signal } from '@angular/core';

import { NonNullableFormBuilder } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { buildTripForm, toTripInput } from '../models/trip-form';

import { TripFormComponent } from '../trip-form/trip-form.component';

import { describeHttpError, TripDataService } from '../services/trip-data.service';

import { TripNoticeService } from '../services/trip-notice.service';

import { TripInput } from '../models/trip';

@Component({
  selector: 'app-add-trip',
  imports: [TripFormComponent, RouterLink],
  templateUrl: './add-trip.component.html',
})
export class AddTripComponent {
  protected readonly data = inject(TripDataService);
  protected readonly router = inject(Router);
  protected readonly notices = inject(TripNoticeService);
  protected action = 'added';
  readonly form = buildTripForm(inject(NonNullableFormBuilder));
  readonly saving = signal(false);
  readonly attempted = signal(false);
  readonly message = signal('');
  submit() {
    this.attempted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusErrors();
      return;
    }
    if (this.saving()) return;
    this.saving.set(true);
    this.message.set('');
    this.saveTrip(toTripInput(this.form)).subscribe({
      next: (trip) => {
        this.notices.show(trip.code, trip.name, this.action);
        void this.router.navigate(['/']);
      },
      error: (error) => this.handleError(error),
    });
  }
  handleError(error: HttpErrorResponse) {
    for (const [field, message] of Object.entries(error.error?.errors || {})) {
      const control = this.form.get(field);
      if (control) control.setErrors({ server: message });
    }
    this.message.set(describeHttpError(error));
    this.saving.set(false);
    this.focusErrors();
  }
  protected saveTrip(trip: TripInput) {
    return this.data.addTrip(trip);
  }
  focusErrors() {
    setTimeout(() => document.getElementById('form-error-summary')?.focus());
  }
}
