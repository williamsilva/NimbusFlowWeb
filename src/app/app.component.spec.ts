import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService } from './core/auth/auth.service';

describe('AppComponent', () => {
  const authServiceMock = {
    loadMe: () => of({ authenticated: false }),
    startLogin: jasmine.createSpy('startLogin'),
    logout: jasmine.createSpy('logout'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      // RouterOutlet/RouterLink no template do AppComponent precisam de um Router configurado.
      providers: [{ provide: AuthService, useValue: authServiceMock }, provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app chrome and redirect straight to login when not authenticated', () => {
    // Não há mais botão de "Entrar" na tela - usuário não autenticado (ou sessão expirada) vai
    // direto pro login do nimbusAuth (ver ngOnInit/AuthService.startLogin).
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('NimbusFlow');
    expect(authServiceMock.startLogin).toHaveBeenCalled();
  });
});
