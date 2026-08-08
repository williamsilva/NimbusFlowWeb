import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private lastSnapshot: RouterStateSnapshot | null = null;

  constructor(
    private readonly title: Title,
    private readonly translate: TranslateService,
  ) {
    super();

    // ✅ atualiza o title quando mudar o idioma (sem Router e sem super)
    this.translate.onLangChange.subscribe(() => {
      if (this.lastSnapshot) {
        this.updateTitle(this.lastSnapshot); // <-- chama o override
      } else {
        const appName = this.translate.instant('app.name') || 'NimbusFlow Security';
        this.title.setTitle(appName);
      }
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.lastSnapshot = snapshot;

    const raw = this.buildTitle(snapshot); // key da rota
    const appName = this.translate.instant('app.name') || 'NimbusFlow Security';

    if (!raw) {
      this.title.setTitle(appName);
      return;
    }

    const translated = this.translate.instant(raw);
    const pageTitle = translated && translated !== raw ? translated : raw;

    this.title.setTitle(`${appName} • ${pageTitle}`);
  }
}
