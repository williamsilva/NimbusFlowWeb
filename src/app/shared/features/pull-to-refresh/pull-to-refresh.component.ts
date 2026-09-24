import { Component, ElementRef, OnDestroy, OnInit, Renderer2, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing';

/**
 * Puxar-para-atualizar (pedido do usuário 2026-09-21, substitui o botão "Atualizar" no
 * mobile/PWA - ver regra `:has(.pi-refresh)` em styles.scss que esconde o botão lá). Só reage a
 * touch (touchstart/touchmove/touchend) - no desktop, sem eventos de toque, o componente fica
 * inerte sozinho, sem precisar de media query pra "desligar".
 *
 * Fica como primeiro filho de `.content` (ver layout.component.html) - é ELE que rola
 * (overflow-y:auto), então os listeners vão pro `parentElement`, não no host deste componente.
 * `:host { height: 0 }` faz o indicador (position:absolute) ancorar exatamente no topo do scroll,
 * sem ocupar espaço/empurrar o conteúdo quando parado (state 'idle').
 *
 * Dispara o refresh navegando pra própria URL com um query param único (`_ptr=timestamp`) -
 * evita mexer na config global do Router (`onSameUrlNavigation`, que afetaria toda navegação
 * pro mesmo link no app inteiro) só pra conseguir recriar a tela atual e disparar de novo
 * qualquer `ngOnInit`/load que ela já tenha, sem precisar cada tela registrar o próprio
 * `refresh()` num serviço compartilhado.
 */
@Component({
  standalone: true,
  selector: 'app-pull-to-refresh',
  templateUrl: './pull-to-refresh.component.html',
  styleUrl: './pull-to-refresh.component.css',
})
export class PullToRefreshComponent implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);

  private static readonly THRESHOLD_PX = 64;
  private static readonly MAX_PULL_PX = 96;
  private static readonly DAMPING = 0.5;
  private static readonly MIN_SPINNER_MS = 500;

  private scrollEl: HTMLElement | null = null;
  private startY = 0;
  private tracking = false;
  private readonly unlisten: (() => void)[] = [];

  readonly state = signal<PullState>('idle');
  readonly pullDistance = signal(0);

  ngOnInit(): void {
    this.scrollEl = this.el.nativeElement.parentElement;
    if (!this.scrollEl) return;

    this.unlisten.push(
      this.renderer.listen(this.scrollEl, 'touchstart', (event: TouchEvent) =>
        this.onTouchStart(event),
      ),
      this.renderer.listen(this.scrollEl, 'touchmove', (event: TouchEvent) =>
        this.onTouchMove(event),
      ),
      this.renderer.listen(this.scrollEl, 'touchend', () => this.onTouchEnd()),
      this.renderer.listen(this.scrollEl, 'touchcancel', () => this.onTouchEnd()),
    );
  }

  ngOnDestroy(): void {
    this.unlisten.forEach((fn) => fn());
  }

  private onTouchStart(event: TouchEvent): void {
    if (!this.scrollEl || this.scrollEl.scrollTop > 0 || this.state() === 'refreshing') return;

    this.tracking = true;
    this.startY = event.touches[0].clientY;
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.tracking || !this.scrollEl) return;

    // usuário já rolou pra baixo no meio do gesto - não é mais um "puxar do topo", solta.
    if (this.scrollEl.scrollTop > 0) {
      this.reset();
      return;
    }

    const deltaY = event.touches[0].clientY - this.startY;
    if (deltaY <= 0) {
      this.pullDistance.set(0);
      this.state.set('idle');
      return;
    }

    const distance = Math.min(
      deltaY * PullToRefreshComponent.DAMPING,
      PullToRefreshComponent.MAX_PULL_PX,
    );
    this.pullDistance.set(distance);
    this.state.set(distance >= PullToRefreshComponent.THRESHOLD_PX ? 'ready' : 'pulling');
  }

  private onTouchEnd(): void {
    if (!this.tracking) return;
    this.tracking = false;

    if (this.state() === 'ready') {
      void this.refresh();
    } else {
      this.reset();
    }
  }

  private reset(): void {
    this.tracking = false;
    this.pullDistance.set(0);
    this.state.set('idle');
  }

  private async refresh(): Promise<void> {
    this.state.set('refreshing');
    this.pullDistance.set(PullToRefreshComponent.THRESHOLD_PX);

    const start = Date.now();
    try {
      const [path] = this.router.url.split('?');
      await this.router.navigateByUrl(`${path}?_ptr=${Date.now()}`, { replaceUrl: true });
    } finally {
      // segura o spinner por um tempo mínimo - um refresh rápido demais parece que não fez nada.
      const elapsed = Date.now() - start;
      if (elapsed < PullToRefreshComponent.MIN_SPINNER_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, PullToRefreshComponent.MIN_SPINNER_MS - elapsed),
        );
      }
      this.reset();
    }
  }
}
