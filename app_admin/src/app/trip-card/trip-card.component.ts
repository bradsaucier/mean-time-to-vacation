import { Component, input, output, signal } from '@angular/core';

import { CurrencyPipe, DatePipe } from '@angular/common';

import { RouterLink } from '@angular/router';

import { Trip } from '../models/trip';

@Component({
  selector: 'app-trip-card',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './trip-card.component.html',
  host: { class: 'col' },
})
export class TripCardComponent {
  readonly trip = input.required<Trip>();
  readonly busy = input(false);
  readonly highlighted = input(false);
  readonly deleteConfirmed = output<string>();
  readonly confirming = signal(false);
}
