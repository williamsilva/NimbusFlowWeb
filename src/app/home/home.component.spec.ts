import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { MeService } from './me.service';

describe('HomeComponent', () => {
  const meServiceMock = {
    getCurrentUser: () =>
      of({ id: 'user-1', email: 'gestor.teste@acquamania.com.br', roles: ['ROLE_GESTOR_OBRAS'] }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: MeService, useValue: meServiceMock }],
    }).compileComponents();
  });

  it('should render the authenticated user email and roles', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('gestor.teste@acquamania.com.br');
    expect(compiled.textContent).toContain('ROLE_GESTOR_OBRAS');
  });
});
