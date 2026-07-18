import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const oidcSecurityServiceMock = {
    isAuthenticated$: of({ isAuthenticated: false }),
    checkAuth: () => of({ isAuthenticated: false }),
    authorize: jasmine.createSpy('authorize'),
    logoff: () => of(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: OidcSecurityService, useValue: oidcSecurityServiceMock }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'NimbusFlow' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('NimbusFlow');
  });

  it('should render the title and a login button when not authenticated', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('NimbusFlow');
    expect(compiled.textContent).toContain('Entrar');
  });
});
