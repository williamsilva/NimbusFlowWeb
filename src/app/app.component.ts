import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, interval, startWith } from 'rxjs';

import { AuthService, CurrentUser } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { FooterComponent } from './layout/footer/footer.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { SessionTone, TopbarComponent } from './layout/topbar/topbar.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  currentUser: CurrentUser | null = null;
  readonly sidebarVisible = signal(true);
  readonly sessionRemainingSeconds = signal<number | null>(null);

  private sessionWatchSub?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly themeService: ThemeService,
    private readonly dialog: MatDialog,
  ) {
    this.themeService.init();
  }

  ngOnInit(): void {
    this.authService.loadMe().subscribe({
      next: (user) => {
        if (!user.authenticated) {
          this.authService.startLogin();
          return;
        }
        this.currentUser = user;
        this.watchSession(user.expiresAt);
      },
      // /bff/me responde 401 (nao um 200 com authenticated:false) quando nao ha sessao valida
      // (nunca logou, ou a sessao expirou) - sem sessao pra restaurar, so ir direto pro login.
      error: () => this.authService.startLogin(),
    });
  }

  ngOnDestroy(): void {
    this.sessionWatchSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarVisible.update((visible) => !visible);
  }

  logout(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false,
      data: {
        title: 'Encerrar sessão',
        message: 'Deseja realmente sair do NimbusFlow?',
        confirmLabel: 'Sair',
        icon: 'logout',
        danger: true,
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.sessionWatchSub?.unsubscribe();
        this.authService.logout();
      }
    });
  }

  get sessionLabel(): string | null {
    const total = this.sessionRemainingSeconds();
    if (total === null) {
      return null;
    }
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (value: number) => String(value).padStart(2, '0');
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
  }

  get sessionTone(): SessionTone {
    const total = this.sessionRemainingSeconds();
    if (total === null) {
      return 'normal';
    }
    if (total <= 60) {
      return 'danger';
    }
    if (total <= 300) {
      return 'warning';
    }
    return 'normal';
  }

  private watchSession(expiresAt: string | null): void {
    this.sessionWatchSub?.unsubscribe();

    if (!expiresAt) {
      this.sessionRemainingSeconds.set(null);
      return;
    }

    const expiryMs = new Date(expiresAt).getTime();
    this.sessionWatchSub = interval(1000)
      .pipe(startWith(0))
      .subscribe(() => {
        const remainingMs = expiryMs - Date.now();
        if (remainingMs <= 0) {
          this.sessionWatchSub?.unsubscribe();
          this.sessionRemainingSeconds.set(0);
          this.authService.startLogin();
          return;
        }
        this.sessionRemainingSeconds.set(Math.floor(remainingMs / 1000));
      });
  }
}
