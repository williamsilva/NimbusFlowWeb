import { Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'cs-forbidden-page',
  imports: [RouterLink, ButtonModule],
  template: `
    <div class="cs-page p-4 md:p-6">
      <div class="mx-auto max-w-2xl">
        <div
          class="cs-glass rounded-2xl p-6 md:p-8 shadow-sm border border-[var(--surface-border)]"
          >
          <div class="flex items-start gap-4">
            <div class="cs-icon-wrap shrink-0">
              <i class="pi pi-lock text-2xl"></i>
            </div>
    
            <div class="min-w-0">
              <h1 class="text-xl md:text-2xl font-semibold m-0">Acesso negado</h1>
    
              <p class="mt-2 text-sm md:text-base opacity-80 leading-relaxed">
                Você não tem permissão para acessar esta página ou executar esta ação.
              </p>
    
              <div class="mt-5 flex flex-wrap gap-2">
                <button
                  pButton
                  type="button"
                  class="p-button"
                  icon="pi pi-arrow-left"
                  label="Voltar"
                  (click)="goBack()"
                ></button>
    
                <a
                  pButton
                  class="p-button-outlined"
                  icon="pi pi-home"
                  label="Ir para Home"
                  [routerLink]="['/']"
                  >
                </a>
              </div>
    
              @if (correlationId()) {
                <div class="mt-5 text-xs opacity-60">
                  <span class="font-medium">Correlation ID:</span> {{ correlationId() }}
                </div>
              }
            </div>
          </div>
        </div>
    
        <div class="mt-4 text-xs opacity-50">
          Se você acha que isso é um erro, peça ao administrador para revisar suas permissões.
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
    `,
  ],
})
export class ForbiddenPage {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  // pega correlationId se você passar via navigation state
  correlationId = computed(() => history.state?.correlationId as string | undefined);

  goBack() {
    // volta se possível; senão vai pra dashboard
    try {
      this.location.back();
    } catch {
      this.router.navigateByUrl('/');
    }
  }
}
