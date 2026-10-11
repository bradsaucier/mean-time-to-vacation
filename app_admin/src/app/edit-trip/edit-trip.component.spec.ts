import { TestBed } from '@angular/core/testing';

import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { of, throwError } from 'rxjs';

import { describe, it, beforeEach, expect, vi } from 'vitest';

import { EditTripComponent } from './edit-trip.component';

import { TripDataService } from '../services/trip-data.service';

import { MOCK_TRIP } from '../testing/mock-trips';

describe('Edit trip', () => {
  const data = { getTrip: vi.fn(), updateTrip: vi.fn() };
  beforeEach(() => {
    data.getTrip.mockReset();
    data.updateTrip.mockReset();
    TestBed.configureTestingModule({
      imports: [EditTripComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['tripCode', MOCK_TRIP.code]]) } },
        },
        { provide: TripDataService, useValue: data },
      ],
    });
  });
  it('loads an object, preserves its date and locks the code', async () => {
    data.getTrip.mockReturnValue(of(MOCK_TRIP));
    data.updateTrip.mockReturnValue(of({ ...MOCK_TRIP, name: 'Revised' }));
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EditTripComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#start').value).toBe('2027-09-12');
    expect(fixture.nativeElement.querySelector('#code').disabled).toBe(true);
    fixture.componentInstance.form.controls.name.setValue('Revised');
    fixture.componentInstance.submit();
    expect(data.updateTrip.mock.calls[0][0]).toBe(MOCK_TRIP.code);
    expect(data.updateTrip.mock.calls[0][1].name).toBe('Revised');
    expect(data.updateTrip.mock.calls[0][1].start).toBe('2027-09-12T12:00:00.000Z');
  });
  it('reports a missing trip', async () => {
    data.getTrip.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 404, error: { message: 'Trip was not found.' } }),
      ),
    );
    const fixture = TestBed.createComponent(EditTripComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Trip was not found');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});

describe('Edit save failure', () => {
  it('retains entered values and allows retry', async () => {
    TestBed.configureTestingModule({
      imports: [EditTripComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['tripCode', MOCK_TRIP.code]]) } },
        },
        {
          provide: TripDataService,
          useValue: {
            getTrip: () => of(MOCK_TRIP),
            updateTrip: () =>
              throwError(
                () =>
                  new HttpErrorResponse({
                    status: 500,
                    error: { message: 'Unable to save the trip.' },
                  }),
              ),
          },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EditTripComponent);
    await fixture.whenStable();
    fixture.componentInstance.form.controls.name.setValue('Unsaved revised name');
    fixture.componentInstance.submit();
    await fixture.whenStable();
    expect(fixture.componentInstance.form.controls.name.value).toBe('Unsaved revised name');
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Unable to save the trip.');
    expect(navigate).not.toHaveBeenCalled();
  });
});
