import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TripNoticeService {
  readonly notice = signal<{ code: string; name: string; action: string } | null>(null);
  show(code: string, name: string, action: string) {
    this.notice.set({ code, name, action });
  }
}
