# Bolão Flow State — Deploy Guide

## 1. SUPABASE — Criar a tabela

1. Acessa https://supabase.com → seu projeto
2. Clica em **SQL Editor** no menu lateral
3. Cola o conteúdo do arquivo `supabase_setup.sql` e clica em **Run**

---

## 2. GITHUB — Subir o código

1. Cria um repositório novo em https://github.com/new
   - Nome: `bolao-flowstate`
   - Privado ou público, tanto faz
2. Faz o upload de todos os arquivos desta pasta

---

## 3. VERCEL — Deploy + Variáveis de Ambiente

1. Acessa https://vercel.com → **Add New Project**
2. Importa o repositório `bolao-flowstate` do GitHub
3. Em **Environment Variables**, adiciona:

| Nome | Valor |
|------|-------|
| `MP_ACCESS_TOKEN` | `APP_USR-2009410542601277-062322-58d6e16bc4fde6012fb8cd7939986f56-3492782924` |
| `SUPABASE_URL` | `https://zseadbvzwoqnhekhnkdw.supabase.co` |
| `SUPABASE_KEY` | `sb_publishable_wi4S7xMBiVUafnapu3L3CA_c77tOaJd` |
| `BASE_URL` | `https://bolao-flowstate.vercel.app` (URL que a Vercel vai gerar) |
| `ADMIN_PASS` | `flowstate2026` |

4. Clica em **Deploy**
5. Após o deploy, copia a URL gerada e atualiza `BASE_URL` nas variáveis

---

## 4. WEBHOOK — Registrar no Mercado Pago

1. Acessa https://www.mercadopago.com.br/developers
2. Vai em **Suas integrações → Webhooks**
3. Adiciona a URL: `https://bolao-flowstate.vercel.app/api/webhook`
4. Evento: `payment`
5. Salva

---

## Pronto! Fluxo automático:

1. Pessoa escolhe placar + valor → clica em "Pagar"
2. Vai pro checkout Mercado Pago → paga o PIX
3. MP dispara webhook → backend confirma palpite no Supabase
4. Palpite aparece na lista pública automaticamente ✅

---

## Admin

- Acessa o site → rola até o final → clica "⚙ Painel Admin"
- Senha: `flowstate2026`
- Após o jogo: lança o resultado → sistema calcula quem acertou
