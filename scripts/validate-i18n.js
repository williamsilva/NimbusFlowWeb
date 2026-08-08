#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

let MessageFormat;
try {
  const mfMod = require('@messageformat/core');
  // @messageformat/core expõe o construtor no default (ou em MessageFormat)
  MessageFormat = mfMod.default ?? mfMod.MessageFormat ?? mfMod;
  if (typeof MessageFormat !== 'function') throw new Error('Invalid MessageFormat export');
} catch (e) {
  console.error('❌ Dependência faltando: @messageformat/core');
  console.error('   Rode: npm i -D @messageformat/core');
  process.exit(1);
}

const BASE_LANG = 'pt-BR';
const LANGS = ['en', 'es'];

const ROOT_PUBLIC = path.resolve(__dirname, '../src/assets');

// pastas a validar
const TARGETS = [
  { name: 'primeng', dir: path.join(ROOT_PUBLIC, 'i18n/primeng'), icu: false }, // PrimeNG: não exige ICU
  { name: 'i18n', dir: path.join(ROOT_PUBLIC, 'i18n'), icu: true }, // App: ICU sim
];

// onde salvar relatórios
const REPORT_DIR = path.resolve(__dirname, '../src/assets/reports');
const REPORT_JSON = path.join(REPORT_DIR, 'i18n-report.json');
const REPORT_HTML = path.join(REPORT_DIR, 'i18n-report.html');

// ----- helpers -----
function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isEmptyValue(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  return false;
}

function flatten(obj, prefix = '') {
  /** retorna { path -> { type, value } } */
  const out = {};
  const keys = Object.keys(obj || {});
  for (const k of keys) {
    const p = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];

    if (isPlainObject(v)) {
      Object.assign(out, flatten(v, p));
    } else if (Array.isArray(v)) {
      out[p] = { type: 'array', value: v };
    } else {
      out[p] = { type: typeof v, value: v };
    }
  }
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function compileIcuIfNeeded(text, locale, keyPath) {
  // Apenas tenta compilar se parecer ICU (plural/select) OU se tiver `{` (pra pegar erros cedo)
  // (Evita falso positivo em strings simples sem chaves)
  const looksLikeIcu =
    typeof text === 'string' &&
    text.includes('{') &&
    (text.includes(', plural,') || text.includes(', select,') || text.includes('#'));

  if (!looksLikeIcu) return null;

  try {
    const mf = new MessageFormat(locale);
    // messageformat compila uma mensagem "raiz"
    mf.compile(text);
    return null;
  } catch (err) {
    return {
      key: keyPath,
      error: String(err && err.message ? err.message : err),
      sample: text,
    };
  }
}

// ----- validation core -----
function validateTarget(target) {
  const baseFile = path.join(target.dir, `${BASE_LANG}.json`);
  const result = {
    target: target.name,
    dir: target.dir,
    baseLang: BASE_LANG,
    langs: LANGS.slice(),
    files: {},
    summary: {
      ok: true,
      missingFiles: 0,
      missingKeys: 0,
      extraKeys: 0,
      emptyValues: 0,
      arrayLengthMismatch: 0,
      icuErrors: 0,
    },
  };

  if (!exists(baseFile)) {
    result.summary.ok = false;
    result.summary.missingFiles++;
    result.files[BASE_LANG] = { ok: false, errors: [{ type: 'missing_file', file: baseFile }] };
    return result;
  }

  const baseJson = readJson(baseFile);
  const baseFlat = flatten(baseJson);

  // guarda infos do base p/ comparar arrays e tipos
  const baseKeys = Object.keys(baseFlat).sort();

  // valida cada idioma
  for (const lang of [BASE_LANG, ...LANGS]) {
    const file = path.join(target.dir, `${lang}.json`);
    const fileEntry = {
      file,
      ok: true,
      missingKeys: [],
      extraKeys: [],
      emptyValues: [],
      arrayLengthMismatch: [],
      icuErrors: [],
    };

    if (!exists(file)) {
      fileEntry.ok = false;
      fileEntry.missingFile = true;
      fileEntry.errors = [{ type: 'missing_file', file }];
      result.summary.ok = false;
      result.summary.missingFiles++;
      result.files[lang] = fileEntry;
      continue;
    }

    const json = readJson(file);
    const flat = flatten(json);
    const keys = Object.keys(flat).sort();

    // missing / extra keys (comparando com base)
    const missing = baseKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !baseKeys.includes(k));

    if (missing.length) {
      fileEntry.ok = false;
      fileEntry.missingKeys = missing;
      result.summary.ok = false;
      result.summary.missingKeys += missing.length;
    }
    if (extra.length) {
      // extra não precisa falhar, mas reporta
      fileEntry.extraKeys = extra;
      result.summary.extraKeys += extra.length;
    }

    // empty values + arrays length
    for (const k of baseKeys) {
      if (!(k in flat)) continue; // já reportado como missing

      const baseMeta = baseFlat[k];
      const meta = flat[k];

      // valores vazios (apenas strings/null/undefined; arrays ok se tiver items)
      if (meta.type !== 'array' && isEmptyValue(meta.value)) {
        fileEntry.ok = false;
        fileEntry.emptyValues.push(k);
        result.summary.ok = false;
        result.summary.emptyValues++;
      }

      // arrays devem ter mesmo tamanho do base
      if (baseMeta.type === 'array') {
        if (meta.type !== 'array') {
          fileEntry.ok = false;
          fileEntry.arrayLengthMismatch.push({
            key: k,
            expected: Array.isArray(baseMeta.value) ? baseMeta.value.length : null,
            got: meta.type,
          });
          result.summary.ok = false;
          result.summary.arrayLengthMismatch++;
        } else {
          const expected = baseMeta.value.length;
          const got = meta.value.length;
          if (expected !== got) {
            fileEntry.ok = false;
            fileEntry.arrayLengthMismatch.push({ key: k, expected, got });
            result.summary.ok = false;
            result.summary.arrayLengthMismatch++;
          }
        }
      }

      // ICU validation (apenas no target icu:true)
      if (target.icu && typeof meta.value === 'string') {
        const locale = lang === 'pt-BR' ? 'pt' : lang === 'en' ? 'en' : 'es';
        const icuErr = compileIcuIfNeeded(meta.value, locale, k);
        if (icuErr) {
          fileEntry.ok = false;
          fileEntry.icuErrors.push(icuErr);
          result.summary.ok = false;
          result.summary.icuErrors++;
        }
      }
    }

    result.files[lang] = fileEntry;
  }

  return result;
}

function buildHtmlReport(report) {
  const now = new Date().toISOString();

  function badge(ok) {
    return ok
      ? `<span style="padding:2px 8px;border-radius:999px;background:#0a7;color:#fff;font-weight:700;">OK</span>`
      : `<span style="padding:2px 8px;border-radius:999px;background:#c33;color:#fff;font-weight:700;">FAIL</span>`;
  }

  const blocks = report.targets
    .map((t) => {
      const s = t.summary;
      const headline = `
        <h2 style="margin:16px 0 8px;">${escapeHtml(t.target)} ${badge(s.ok)}</h2>
        <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:12px; color:#333;">
          <div><b>Dir:</b> ${escapeHtml(t.dir)}</div>
          <div><b>Base:</b> ${escapeHtml(t.baseLang)} | <b>Langs:</b> ${escapeHtml((t.langs ?? []).join(', '))}</div>
          <div style="margin-top:6px;">
            Missing files: <b>${s.missingFiles}</b> |
            Missing keys: <b>${s.missingKeys}</b> |
            Extra keys: <b>${s.extraKeys}</b> |
            Empty values: <b>${s.emptyValues}</b> |
            Array mismatches: <b>${s.arrayLengthMismatch}</b> |
            ICU errors: <b>${s.icuErrors}</b>
          </div>
        </div>
      `;

      const langTables = Object.entries(t.files)
        .map(([lang, f]) => {
          const rows = [];

          if (f.missingFile) {
            rows.push(
              `<tr><td colspan="2">❌ Missing file: <code>${escapeHtml(f.file)}</code></td></tr>`,
            );
          } else {
            if (f.missingKeys?.length) {
              rows.push(
                `<tr><td>Missing keys</td><td><pre>${escapeHtml(f.missingKeys.join('\n'))}</pre></td></tr>`,
              );
            }
            if (f.extraKeys?.length) {
              rows.push(
                `<tr><td>Extra keys</td><td><pre>${escapeHtml(f.extraKeys.join('\n'))}</pre></td></tr>`,
              );
            }
            if (f.emptyValues?.length) {
              rows.push(
                `<tr><td>Empty values</td><td><pre>${escapeHtml(f.emptyValues.join('\n'))}</pre></td></tr>`,
              );
            }
            if (f.arrayLengthMismatch?.length) {
              const txt = f.arrayLengthMismatch
                .map((x) => `${x.key} (expected: ${x.expected}, got: ${x.got})`)
                .join('\n');
              rows.push(`<tr><td>Array mismatch</td><td><pre>${escapeHtml(txt)}</pre></td></tr>`);
            }
            if (f.icuErrors?.length) {
              const txt = f.icuErrors
                .map((e) => `${e.key}\n  ${e.error}\n  sample: ${e.sample}`)
                .join('\n\n');
              rows.push(`<tr><td>ICU errors</td><td><pre>${escapeHtml(txt)}</pre></td></tr>`);
            }
            if (!rows.length) {
              rows.push(`<tr><td colspan="2">✅ No issues</td></tr>`);
            }
          }

          return `
            <h3 style="margin:14px 0 6px;">${escapeHtml(lang)} ${badge(!!f.ok)}</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
              <tbody>
                ${rows
                  .map((r) =>
                    r.startsWith('<tr>')
                      ? r
                      : `<tr><td style="border:1px solid #ddd;padding:8px;">${r}</td></tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          `;
        })
        .join('');

      return `<section style="padding:12px;border:1px solid #ddd;border-radius:10px;margin:12px 0;">${headline}${langTables}</section>`;
    })
    .join('');

  const overall = report.ok ? 'OK' : 'FAIL';
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>i18n validation report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;background:#fafafa;padding:18px;">
  <h1 style="margin:0 0 6px;">i18n validation report — ${overall}</h1>
  <div style="color:#555;margin-bottom:12px;">Generated at: <code>${escapeHtml(now)}</code></div>
  ${blocks}
</body>
</html>
`.trim();
}

// ----- main -----
function main() {
  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    targets: [],
  };

  for (const t of TARGETS) {
    if (!exists(t.dir)) {
      const missing = {
        target: t.name,
        dir: t.dir,
        baseLang: BASE_LANG,
        langs: LANGS.slice(),
        summary: {
          ok: false,
          missingFiles: 1,
          missingKeys: 0,
          extraKeys: 0,
          emptyValues: 0,
          arrayLengthMismatch: 0,
          icuErrors: 0,
        },
        files: {},
      };
      report.ok = false;
      report.targets.push(missing);
      continue;
    }

    const r = validateTarget(t);
    if (!r.summary.ok) report.ok = false;
    report.targets.push(r);
  }

  ensureDir(REPORT_DIR);
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(REPORT_HTML, buildHtmlReport(report), 'utf8');

  // console output
  if (report.ok) {
    console.log('✅ i18n validation OK');
  } else {
    console.error('🚨 i18n validation FAILED');
    console.error(`   JSON report: ${REPORT_JSON}`);
    console.error(`   HTML report: ${REPORT_HTML}`);
    process.exit(1);
  }

  console.log(`📄 JSON report: ${REPORT_JSON}`);
  console.log(`🖼️  HTML report: ${REPORT_HTML}`);
}

main();
