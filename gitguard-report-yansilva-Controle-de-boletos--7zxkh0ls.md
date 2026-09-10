# Relatório de Segurança — yansilva/Controle-de-boletos-

**Scan:** `cmtvna2rp01sr14pf7zxkh0ls` · MANUAL · branch `main` · commit `07d58613664c`
**Status:** COMPLETED · **Executado em:** 2026-09-10T14:53:42.299Z · **Concluído em:** 2026-09-10T14:55:55.940Z
**Relatório gerado em:** 2026-09-10T21:47:21.782Z por GitGuard

## Instruções para a IA que for corrigir isto

- Repositório alvo: yansilva/Controle-de-boletos-, branch "main", commit 07d58613664c52188006a8992e6dd30b8332c923. Aplique as correções diretamente nesse checkout.
- Em "dependencyUpgrades", cada entrada agrupa TODOS os CVEs de um mesmo pacote — faça UM upgrade por pacote (para "recommendedVersion" ou mais recente), não uma correção por CVE.
- Em "secrets", nunca tente adivinhar ou reconstruir o valor original do segredo (ele foi propositalmente redigido) — apenas remova/rotacione conforme "remediation".
- Depois de aplicar as correções, rode os testes existentes do projeto e, se disponível, o linter/build antes de considerar concluído.

## Resumo

- **Total de findings:** 9
- **Por severidade:** HIGH: 3 · MEDIUM: 3 · LOW: 3
- **Por scanner:** TRIVY: 7 · SEMGREP: 2

## Dependências para atualizar

### 📦 `react-router` (6 CVEs) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `7.18.3` para `8.3.0` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | — | React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response | 8.3.0 |
| HIGH | — | React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response | 8.3.0 |
| HIGH | CVE-2026-55685 | React Router: Unauthenticated Denial of Service via Inefficient Route Matching | 7.18.0 |
| MEDIUM | CVE-2026-53667 | React Router: RSCErrorHandler Missing Protocol Validation (XSS) | 7.18.0 |
| MEDIUM | CVE-2026-53666 | React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration | 7.18.0 |
| MEDIUM | CVE-2026-53669 | React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass) | 7.18.0 |

### 📦 `body-parser` (1 CVE) — severidade máxima: LOW

**Ação recomendada:** atualizar de `1.20.5` para `1.20.6, 2.3.0` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| LOW | CVE-2026-12590 | body-parser: body-parser: Denial of Service via invalid limit option | 1.20.6, 2.3.0 |

## Outros findings

| Severidade | Scanner | Categoria | Título | Local |
|---|---|---|---|---|
| LOW | SEMGREP | SAST | Semgrep Finding: rules.javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage | /scan/backend/server.js:10 |
| LOW | SEMGREP | SAST | Semgrep Finding: rules.javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage | /scan/backend/server.js:8 |
