import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';

import { RouterLink } from '@angular/router';

import { Trip } from '../models/trip';

import { TripCardComponent } from '../trip-card/trip-card.component';

import { describeHttpError, TripDataService } from '../services/trip-data.service';

import { TripNoticeService } from '../services/trip-notice.service';

@Component({
  selector: 'app-trip-listing',
  imports: [RouterLink, TripCardComponent],
  templateUrl: './trip-listing.component.html',
})
export class TripListingComponent implements OnInit, OnDestroy {
  private readonly data = inject(TripDataService);
  readonly notices = inject(TripNoticeService);
  readonly trips = signal<Trip[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly deleting = signal('');
  readonly query = signal('');
  readonly visible = computed(() =>
    this.trips().filter((trip) =>
      (trip.name + ' ' + trip.code + ' ' + trip.level)
        .toLowerCase()
        .includes(this.query().trim().toLowerCase()),
    ),
  );
  ngOnInit() {
    this.load();
  }
  ngOnDestroy() {
    this.notices.notice.set(null);
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.data.getTrips().subscribe({
      next: (trips) => {
        this.trips.set(trips);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(describeHttpError(error));
        this.loading.set(false);
      },
    });
  }
  remove(code: string) {
    this.deleting.set(code);
    this.error.set('');
    this.data.deleteTrip(code).subscribe({
      next: () => {
        const trip = this.trips().find((trip) => trip.code === code)!;
        this.trips.update((trips) => trips.filter((trip) => trip.code !== code));
        this.notices.show(code, trip.name, 'deleted');
        this.deleting.set('');
      },
      error: (error) => {
        this.error.set(describeHttpError(error));
        this.deleting.set('');
      },
    });
  }
}
