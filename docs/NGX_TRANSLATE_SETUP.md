# ngx-translate no CardSync SPA

Este projeto foi ajustado para usar **@ngx-translate/core** com um `TranslateLoader` baseado em **dynamic import** (code-splitting),
reaproveitando as mensagens que já existem em `src/app/core/i18n/locales/*.ts`.

## Instalação

```bash
npm i @ngx-translate/core
```

> Não é necessário `@ngx-translate/http-loader` porque o loader atual carrega as mensagens via `import()`.

## Como usar

- Em templates, você pode continuar usando `i18n.tUi('topbar.brandName')` (wrapper).
- Ou, se preferir, pode usar o pipe do ngx-translate:

```html
{{ 'topbar.brandName' | translate }}
```

## Onde foi configurado

- `src/app/app.config.ts` -> `TranslateModule.forRoot(...)`
- `src/app/core/i18n/ngx-translate.loader.ts` -> `DynamicImportTranslateLoader`
- `src/app/core/i18n/i18n.service.ts` -> integra `TranslateService` + aplica traduções do PrimeNG ao trocar idioma

