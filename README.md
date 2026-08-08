# NimbusFlowSecuritySpa

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Deploy no Cloudflare Pages

Configuração recomendada:

- Build command: `npm run build:pages`
- Build output directory: `dist/nimbusflow-security/browser`
- Node version: `22`

Arquivos já preparados para o deploy:

- `public/_redirects` para fallback de SPA
- `public/_headers` para cache básico
- `.nvmrc` para alinhar a versão do Node

Antes de publicar em produção, confirme que o backend (NimbusFlowServer) está acessível e que a URL
real foi preenchida em `src/environments/environment.prod.ts` (hoje é um placeholder
`https://api.nimbusflow.com.br`, já que o NimbusFlowServer ainda não tem domínio de produção
documentado).
