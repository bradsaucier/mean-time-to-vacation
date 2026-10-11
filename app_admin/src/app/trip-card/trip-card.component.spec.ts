import { TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { describe, it, expect, vi } from 'vitest';

import { TripCardComponent } from './trip-card.component';

import { MOCK_TRIP } from '../testing/mock-trips';

describe('Trip card', () => {
  it('renders mock data and confirms deletion explicitly', async () => {
    TestBed.configureTestingModule({
      imports: [TripCardComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(TripCardComponent);
    fixture.componentRef.setInput('trip', MOCK_TRIP);
    await fixture.whenStable();
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Kayak Bay Shallows');
    expect(el.textContent).toContain('$749.00');
    expect(el.textContent).toContain('Sep 12, 2027');
    expect(el.querySelector('img').alt).toBe(MOCK_TRIP.imageAlt);
    expect(el.querySelector('a').getAttribute('href')).toBe('/edit-trip/KAYK270912');
    const emitted = vi.fn();
    fixture.componentInstance.deleteConfirmed.subscribe(emitted);
    el.querySelector('.delete-link').click();
    await fixture.whenStable();
    el.querySelector('.btn-outline-secondary').click();
    await fixture.whenStable();
    expect(emitted).not.toHaveBeenCalled();
    el.querySelector('.delete-link').click();
    await fixture.whenStable();
    el.querySelector('.btn-danger').click();
    expect(emitted).toHaveBeenCalledWith(MOCK_TRIP.code);
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    expect(el.querySelector('.btn-danger').disabled).toBe(true);
  });
});
