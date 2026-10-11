import { NonNullableFormBuilder } from '@angular/forms';

import { TestBed } from '@angular/core/testing';

import { describe, it, expect } from 'vitest';

import { buildTripForm } from './trip-form';

import { MOCK_TRIP } from '../testing/mock-trips';

describe('Trip validation', () => {
  it('rejects impossible dates and prices outside the schema', () => {
    const form = buildTripForm(TestBed.inject(NonNullableFormBuilder));
    form.reset({ ...MOCK_TRIP, start: '2027-02-30', perPerson: '100000.00' });
    expect(form.controls.start.invalid).toBe(true);
    expect(form.controls.perPerson.invalid).toBe(true);
    form.controls.start.setValue('2028-02-29');
    form.controls.perPerson.setValue('99999.99');
    expect(form.valid).toBe(true);
  });
});
