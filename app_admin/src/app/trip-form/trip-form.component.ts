import { Component, input, output } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';

import { FORM_FIELDS, TripForm } from '../models/trip-form';

import { TRIP_IMAGES, TRIP_LEVELS } from '../models/trip';

@Component({
  selector: 'app-trip-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './trip-form.component.html',
})
export class TripFormComponent {
  readonly form = input.required<TripForm>();
  readonly saving = input(false);
  readonly attempted = input(false);
  readonly message = input('');
  readonly editing = input(false);
  readonly submitted = output<void>();
  readonly groups = ['Identity', 'Schedule and price', 'Presentation', 'Fieldbook'];
  readonly fields = FORM_FIELDS;
  readonly images = TRIP_IMAGES;
  readonly levels = TRIP_LEVELS;
  focusField(key: string) {
    document.getElementById(key)?.focus();
  }
  invalid(key: keyof TripForm['controls']) {
    const control = this.form().controls[key];
    return control.invalid && (control.touched || this.attempted());
  }
  error(key: keyof TripForm['controls']) {
    const errors = this.form().controls[key].errors;
    if (errors?.['server']) return errors['server'];
    if (errors?.['required']) return 'This field is required.';
    if (errors?.['pattern'] && !this.form().controls[key].value.trim())
      return 'This field is required.';
    if (errors?.['maxlength'])
      return 'Use no more than ' + errors['maxlength'].requiredLength + ' characters.';
    if (key === 'code') return 'Use four letters followed by six digits.';
    if (key === 'perPerson') return 'Use a price from 0 to 99999.99, with up to two decimals.';
    if (key === 'start') return 'Choose a valid calendar date.';
    return 'Check this value.';
  }
}
