import { TestBed } from '@angular/core/testing';

import { provideRouter, Router } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { of, throwError } from 'rxjs';

import { describe, it, beforeEach, expect, vi } from 'vitest';

import { AddTripComponent } from './add-trip.component';

import { TripDataService } from '../services/trip-data.service';

import { MOCK_TRIP } from '../testing/mock-trips';

describe('Add trip', () => {
  const data = { addTrip: vi.fn() };
  beforeEach(() => {
    data.addTrip.mockReset();
    TestBed.configureTestingModule({
      imports: [AddTripComponent],
      providers: [provideRouter([]), { provide: TripDataService, useValue: data }],
    });
  });
  it('blocks invalid submission and displays field errors', async () => {
    const fixture = TestBed.createComponent(AddTripComponent);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('button[type=submit]').click();
    await fixture.whenStable();
    expect(data.addTrip).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#form-error-summary')).toBeTruthy();
  });
  it('normalizes a valid trip and navigates after saving', async () => {
    data.addTrip.mockReturnValue(of(MOCK_TRIP));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AddTripComponent);
    await fixture.whenStable();
    fixture.componentInstance.form.reset({
      ...MOCK_TRIP,
      code: 'kayk270912',
      perPerson: '749',
      start: '2027-09-12',
    });
    fixture.componentInstance.submit();
    expect(data.addTrip.mock.calls[0][0]).toMatchObject({
      code: 'KAYK270912',
      perPerson: '749.00',
      start: '2027-09-12T12:00:00.000Z',
    });
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
  it('attaches a duplicate error to the code field', async () => {
    data.addTrip.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { message: 'Duplicate', errors: { code: 'Choose another code.' } },
          }),
      ),
    );
    const fixture = TestBed.createComponent(AddTripComponent);
    await fixture.whenStable();
    fixture.componentInstance.form.reset({ ...MOCK_TRIP, start: '2027-09-12' });
    fixture.componentInstance.submit();
    await fixture.whenStable();
    expect(fixture.componentInstance.form.controls.code.errors?.['server']).toBe(
      'Choose another code.',
    );
    expect(fixture.componentInstance.saving()).toBe(false);
  });
});

describe('Validation summary navigation', () => {
  it('focuses the invalid field without navigating or discarding input', async () => {
    TestBed.configureTestingModule({
      imports: [AddTripComponent],
      providers: [provideRouter([]), { provide: TripDataService, useValue: {} }],
    });
    const fixture = TestBed.createComponent(AddTripComponent);
    await fixture.whenStable();
    fixture.componentInstance.form.controls.name.setValue('Unsaved trip');
    fixture.componentInstance.submit();
    await fixture.whenStable();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('#form-error-summary a').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#code'));
    expect(fixture.componentInstance.form.controls.name.value).toBe('Unsaved trip');
  });
  it('describes whitespace-only text as required', async () => {
    TestBed.configureTestingModule({
      imports: [AddTripComponent],
      providers: [provideRouter([]), { provide: TripDataService, useValue: {} }],
    });
    const fixture = TestBed.createComponent(AddTripComponent);
    await fixture.whenStable();
    fixture.componentInstance.form.controls.name.setValue('   ');
    fixture.componentInstance.submit();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#name-error').textContent).toContain(
      'This field is required.',
    );
  });
});
