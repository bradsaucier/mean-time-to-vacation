import { InjectionToken } from '@angular/core';

// Injectable handle to the browser's Local Storage (guide p. 202).
export const BROWSER_STORAGE = new InjectionToken<Storage>('Browser Storage', {
  providedIn: 'root',
  factory: () => localStorage,
});
