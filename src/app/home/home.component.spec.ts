import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../core/auth/auth.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const authServiceMock = {
    loadMe: () =>
      of({
        authenticated: true,
        iss: 'http://localhost:9090',
        userId: '42',
        username: 'gestor.teste',
        name: 'Gestor Teste',
        groups: ['GESTOR_OBRAS'],
        permissions: ['OBRAS_VIEW'],
        expiresAt: null,
      }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      // RouterLink dos "quick links" precisa de um Router configurado no TestBed.
      providers: [{ provide: AuthService, useValue: authServiceMock }, provideRouter([])],
    }).compileComponents();
  });

  it('should render the authenticated user name, groups and permissions', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Gestor Teste');
    expect(compiled.textContent).toContain('GESTOR_OBRAS');
    expect(compiled.textContent).toContain('OBRAS_VIEW');
  });
});
