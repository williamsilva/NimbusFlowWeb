import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  map,
  merge,
  filter,
  Subject,
  switchMap,
  fromEvent,
  takeUntil,
  startWith,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';

import { MeStore } from './me.store';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class SessionPingService {
  private readonly router = inject(Router);
  private readonly meStore = inject(MeStore);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);

  private readonly stop$ = new Subject<void>();

  private started = false;
  private lastPingAt = 0;

  private readonly pingCooldownMs = 60_000;
  private readonly pingWhenBelowSec = 600;
  private readonly activityDebounceMs = 1200;

  private readonly excludedPrefixes = ['/forbidden', '/login', '/error'];

  start(): void {
    if (this.started) return;
    this.started = true;

    const inPrivateRoute$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects || e.url),
      startWith(this.router.url),
      map((url) => !this.excludedPrefixes.some((p) => url.startsWith(p))),
      distinctUntilChanged(),
    );

    const pageVisible$ = fromEvent(document, 'visibilitychange').pipe(
      startWith(null),
      map(() => document.visibilityState === 'visible'),
      distinctUntilChanged(),
    );

    const activity$ = merge(
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'keydown'),
      fromEvent(window, 'scroll'),
      fromEvent(window, 'touchstart'),
      fromEvent(window, 'pointerdown'),
    ).pipe(debounceTime(this.activityDebounceMs));

    activity$
      .pipe(
        takeUntil(this.stop$),

        filter(() => this.meStore.me()?.authenticated === true),

        switchMap(() =>
          merge(inPrivateRoute$, pageVisible$).pipe(startWith(true), takeUntil(this.stop$)),
        ),

        filter(() => document.visibilityState === 'visible'),

        filter(() => {
          const url = this.router.url;
          return !this.excludedPrefixes.some((p) => url.startsWith(p));
        }),

        filter(() => {
          const s = this.session.remainingSeconds();
          return s != null && s > 0 && s <= this.pingWhenBelowSec;
        }),

        filter(() => Date.now() - this.lastPingAt >= this.pingCooldownMs),

        switchMap(async () => {
          this.lastPingAt = Date.now();
          await this.auth.renewSession();
        }),
      )
      .subscribe();
  }

  stop(): void {
    this.stop$.next();
    this.started = false;
  }
}
