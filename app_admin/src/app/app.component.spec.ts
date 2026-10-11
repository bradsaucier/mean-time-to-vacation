import { TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

import { describe, it, expect } from 'vitest';

describe('App shell', () => {
  it('provides navigation and a skip link', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.skip-link').getAttribute('href')).toBe('#main');
    expect(fixture.nativeElement.textContent).toContain('Trip manifest');
  });
});

describe('Skip navigation', () => {
  it('prevents document navigation and focuses the main content', async () => {
    TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('.skip-link').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('main'));
  });
});
