> 🔒 **Localização e sugestão de correção disponíveis no PROguard.** Este relatório FREE mostra o que foi encontrado, não onde nem como corrigir.

# Relatório de Segurança — yansilva/Controle-de-boletos-

**Scan:** `cmtsxtg6q005326bujw7a5i50` · MANUAL · branch `main` · commit `5ef23255c8b8`
**Status:** COMPLETED · **Executado em:** 2026-09-08T17:22:34.146Z · **Concluído em:** 2026-09-08T17:24:46.640Z
**Relatório gerado em:** 2026-09-08T17:25:20.890Z por GitGuard

## Instruções para a IA que for corrigir isto

- Repositório alvo: yansilva/Controle-de-boletos-, branch "main", commit 5ef23255c8b8814867dc4399c15f76d268c1a790. Aplique as correções diretamente nesse checkout.
- Em "dependencyUpgrades", cada entrada agrupa TODOS os CVEs de um mesmo pacote — faça UM upgrade por pacote (para "recommendedVersion" ou mais recente), não uma correção por CVE.
- Em "secrets", nunca tente adivinhar ou reconstruir o valor original do segredo (ele foi propositalmente redigido) — apenas remova/rotacione conforme "remediation".
- Depois de aplicar as correções, rode os testes existentes do projeto e, se disponível, o linter/build antes de considerar concluído.

## Resumo

- **Total de findings:** 7
- **Por severidade:** HIGH: 2 · MEDIUM: 3 · LOW: 2
- **Por scanner:** TRIVY: 6 · SEMGREP: 1

## Dependências para atualizar

### 📦 `react-router` (5 CVEs) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `7.15.1` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-55685 | React Router: Unauthenticated Denial of Service via Inefficient Route Matching | — |
| HIGH | — | React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response | — |
| MEDIUM | CVE-2026-53669 | React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass) | — |
| MEDIUM | CVE-2026-53667 | React Router: RSCErrorHandler Missing Protocol Validation (XSS) | — |
| MEDIUM | CVE-2026-53666 | React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration | — |

### 📦 `body-parser` (1 CVE) — severidade máxima: LOW

**Ação recomendada:** atualizar de `1.20.5` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| LOW | CVE-2026-12590 | body-parser: body-parser: Denial of Service via invalid limit option | — |

## Outros findings

| Severidade | Scanner | Categoria | Título | Local |
|---|---|---|---|---|
| LOW | SEMGREP | SAST | Semgrep Finding: rules.javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage | — |
