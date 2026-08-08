# 🌍 CardSync — Locale, Moeda, Percentual e UTC (Guia Completo)

Este documento define o padrão oficial do CardSync para:

- 📅 Datas sempre em **UTC**
- 💰 Moeda dinâmica por idioma
- 🔢 Número formatado por locale
- 📊 Percentual em estilo financeiro
- 🚨 UTC Strict Mode (quebra em DEV se backend enviar ISO sem timezone)

---

# 1️⃣ Setup Inicial

## 1.1 Registrar locale no Angular

Arquivo: `main.ts`

```ts
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localePt, 'pt-BR');
registerLocaleData(localeEs, 'es-ES');
```

> `en-US` já vem registrado por padrão no Angular.

---

## 1.2 I18nService — Locale e Currency

O serviço deve conter:

```ts
getLocale(): 'pt-BR' | 'en-US' | 'es-ES' {
  const lang = this.getLang();
  return lang === 'en' ? 'en-US'
       : lang === 'es' ? 'es-ES'
       : 'pt-BR';
}

getCurrency(): 'BRL' | 'USD' | 'EUR' {
  const lang = this.getLang();
  return lang === 'en' ? 'USD'
       : lang === 'es' ? 'EUR'
       : 'BRL';
}
```

E sincronizar o HTML:

```ts
document.documentElement.lang = this.getLocale();
```

---

# 2️⃣ Datas — `csDate` (UTC obrigatório)

## 🎯 Objetivo
- Backend envia sempre ISO com timezone (`Z` ou `+00:00`)
- Front exibe sempre em **UTC**
- Atualiza automaticamente quando o idioma muda

---

## 📌 Uso

```html
{{ row.createdAt | csDate:'short' }}
```

### Formatos disponíveis

```html
{{ d | csDate:'short' }}
{{ d | csDate:'medium' }}
{{ d | csDate:'long' }}
{{ d | csDate:'fullDate' }}
{{ d | csDate:'shortDate' }}
{{ d | csDate:'shortTime' }}
```

### Forçar timezone (opcional)

```html
{{ d | csDate:'short':'UTC' }}
{{ d | csDate:'short':'America/Sao_Paulo' }}
```

---

## 📦 Import no componente standalone

```ts
import { CsDatePipe } from 'src/app/shared/pipes/cs-date.pipe';

@Component({
  standalone: true,
  imports: [CsDatePipe],
})
export class UsersListComponent {}
```

---

# 3️⃣ Número — `csNumber`

Formata números com `Intl.NumberFormat` sincronizado com locale.

---

## 📌 Uso básico

```html
{{ total | csNumber }}
```

---

## 📌 Casas decimais

```html
{{ value | csNumber:{ minimumFractionDigits: 2, maximumFractionDigits: 2 } }}
```

---

## 📌 Sem agrupamento

```html
{{ value | csNumber:{ useGrouping: false } }}
```

---

## 📦 Import

```ts
import { CsNumberPipe } from 'src/app/shared/pipes/cs-number.pipe';

imports: [CsNumberPipe]
```

---

# 4️⃣ Moeda — `csCurrency`

## 🎯 Dinâmica por idioma

| Idioma | Resultado |
|--------|-----------|
| pt-BR | R$ 1.234,56 |
| en-US | $1,234.56 |
| es-ES | 1.234,56 € |

---

## 📌 Uso automático

```html
{{ amount | csCurrency }}
```

---

## 📌 Forçar moeda

```html
{{ amount | csCurrency:'USD' }}
{{ amount | csCurrency:'EUR' }}
{{ amount | csCurrency:'BRL' }}
```

---

## 📦 Import

```ts
import { CsCurrencyPipe } from 'src/app/shared/pipes/cs-currency.pipe';

imports: [CsCurrencyPipe]
```

---

# 5️⃣ Percentual Financeiro — `csPercent`

## 🎯 Objetivo

- `0.1234` → 12,34%
- `-0.0321` → -3,21%
- Estilo contábil opcional
- Mostrar "+" opcional

---

## 📌 Uso padrão (ratio)

```html
{{ roi | csPercent }}
```

`0.12` → 12%

---

## 📌 Se backend envia 12.34 (modo percent)

```html
{{ roi | csPercent:{ mode:'percent' } }}
```

---

## 📌 Casas decimais

```html
{{ roi | csPercent:{ digits: 2 } }}
```

---

## 📌 Mostrar + nos positivos

```html
{{ roi | csPercent:{ showPlus: true } }}
```

---

## 📌 Negativo contábil (parênteses)

```html
{{ roi | csPercent:{ accountingNegative: true } }}
```

`-0.12` → `(12%)`

---

## 📦 Import

```ts
import { CsPercentPipe } from 'src/app/shared/pipes/cs-percent.pipe';

imports: [CsPercentPipe]
```

---

# 6️⃣ Uso Completo em um Componente

```ts
import { CsDatePipe } from '@/shared/pipes/cs-date.pipe';
import { CsNumberPipe } from '@/shared/pipes/cs-number.pipe';
import { CsCurrencyPipe } from '@/shared/pipes/cs-currency.pipe';
import { CsPercentPipe } from '@/shared/pipes/cs-percent.pipe';

@Component({
  standalone: true,
  imports: [
    CsDatePipe,
    CsNumberPipe,
    CsCurrencyPipe,
    CsPercentPipe,
  ],
})
export class DashboardComponent {}
```

---

## 📌 Exemplo no HTML

```html
<p>
  Criado em: {{ item.createdAt | csDate:'short' }}
</p>

<p>
  Total: {{ item.total | csCurrency }}
</p>

<p>
  Quantidade: {{ item.count | csNumber }}
</p>

<p>
  Crescimento: {{ item.growth | csPercent:{ showPlus:true } }}
</p>
```

---

# 7️⃣ UTC Strict Mode (DEV)

## 🎯 O que faz

Quebra a aplicação em DEV se backend enviar:

```
2026-02-26T10:00:00   ❌ (sem timezone)
```

Aceito:

```
2026-02-26T10:00:00Z
2026-02-26T10:00:00+00:00
```

---

## 📌 Registrar interceptor

```ts
provideHttpClient(
  withInterceptors([
    credentialsInterceptor,
    csrfInterceptor,
    errorInterceptor,
    timezoneStrictInterceptor,
  ]),
)
```

---

# 8️⃣ Padrão Oficial CardSync

✅ Backend sempre ISO com `Z` ou `+00:00`  
✅ Front sempre usa `csDate`  
✅ Valores financeiros usam `csCurrency`  
✅ Percentuais usam `csPercent`  
✅ UTC Strict Mode ativo em DEV  
✅ Locale sincronizado com `<html lang="">`

---

# 9️⃣ Troubleshooting

### ❌ Pipe não funciona
→ Verifique se foi importado no componente standalone.

### ❌ Datas não mudam idioma
→ Verifique `registerLocaleData` no `main.ts`.

### ❌ Currency não muda símbolo
→ Verifique `getCurrency()` no `I18nService`.

---

# 🔥 Resultado Arquitetural

Com isso o CardSync tem:

- Internacionalização real
- Segurança contra bug de fuso horário
- Padrão financeiro consistente
- Compatível com Angular 19 standalone
- Zero dependência de LOCALE_ID global

---

**Documento oficial — CardSync Locale & UTC Policy**
