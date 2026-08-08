import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'cs-not-found-page',
  imports: [RouterLink, TranslateModule, ButtonModule],
  template: `
    <div class="cs-page p-4 md:p-6">
      <div class="mx-auto max-w-2xl">
        <div
          class="cs-glass rounded-2xl p-6 md:p-8 shadow-sm border border-[var(--surface-border)]"
          >
          <div class="flex items-start gap-4">
            <div class="cs-icon-wrap shrink-0">
              <i class="pi pi-search text-2xl"></i>
            </div>
    
            <div class="min-w-0">
              <div class="cs-error-code">404</div>
    
              <h1 class="text-xl md:text-2xl font-semibold m-0">
                {{ 'notFound.title' | translate }}
              </h1>
    
              <p class="mt-2 text-sm md:text-base opacity-80 leading-relaxed">
                {{ 'notFound.message' | translate }}
              </p>
    
              @if (attemptedUrl()) {
                <div class="cs-attempted-url mt-4">
                  <span class="font-medium">{{ 'notFound.attemptedUrl' | translate }}:</span>
                  <code>{{ attemptedUrl() }}</code>
                </div>
              }
    
              <div class="mt-5 flex flex-wrap gap-2">
                <button
                  pButton
                  type="button"
                  class="p-button"
                  icon="pi pi-arrow-left"
                  [label]="'common.back' | translate"
                  (click)="goBack()"
                ></button>
    
                <a
                  pButton
                  class="p-button-outlined"
                  icon="pi pi-home"
                  [label]="'notFound.goHome' | translate"
                  [routerLink]="['/dashboard']"
                  >
                </a>
              </div>
            </div>
          </div>
        </div>
    
        <div class="mt-4 text-xs opacity-50">
          {{ 'notFound.hint' | translate }}
        </div>
      </div>
    </div>
    `,
  styles: [
    `
      .cs-page {
        min-height: calc(100vh - 7rem);
        display: grid;
        place-items: center;
      }

      .cs-glass {
        background: var(--surface-card);
        backdrop-filter: blur(10px);
      }

      .cs-icon-wrap {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--surface-0) 85%, transparent);
        border: 1px solid var(--surface-border);
      }

      .cs-error-code {
        width: fit-content;
        margin-bottom: 0.75rem;
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: var(--primary-color);
        background: color-mix(in srgb, var(--primary-color) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--primary-color) 28%, transparent);
      }

      .cs-attempted-url {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
        max-width: 100%;
        font-size: 0.82rem;
        opacity: 0.72;
      }

      .cs-attempted-url code {
        max-width: 100%;
        overflow-wrap: anywhere;
        padding: 0.15rem 0.45rem;
        border-radius: 0.5rem;
        background: color-mix(in srgb, var(--surface-0) 75%, transparent);
        border: 1px solid var(--surface-border);
      }
    `,
  ],
})
export class NotFoundPage {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly attemptedUrl = computed(() => this.router.url);

  goBack(): void {
    if (history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigateByUrl('/dashboard');
  }
}
