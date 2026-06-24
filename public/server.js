require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ---- CLIENTES ----
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ---- CRIAR PREFERÊNCIA DE PAGAMENTO ----
app.post('/api/criar-pagamento', async (req, res) => {
  const { nome, gols_sco, gols_bra, valor } = req.body;

  if (!nome || valor < 5 || gols_sco === undefined || gols_bra === undefined) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  try {
    // Salva palpite como pendente
    const { data: palpite, error: dbErr } = await supabase
      .from('palpites')
      .insert({ nome, gols_sco, gols_bra, valor, status: 'pendente' })
      .select()
      .single();

    if (dbErr) throw dbErr;

    // Cria preferência no MP
    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: [{
          title: `Bolão Flow State — ${nome} chuta ${gols_sco}x${gols_bra}`,
          quantity: 1,
          unit_price: Number(valor),
          currency_id: 'BRL'
        }],
        payer: { name: nome },
        payment_methods: { excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }] },
        notification_url: `${process.env.BASE_URL}/api/webhook`,
        external_reference: palpite.id,
        back_urls: {
          success: `${process.env.BASE_URL}/?status=sucesso`,
          failure: `${process.env.BASE_URL}/?status=falha`,
          pending: `${process.env.BASE_URL}/?status=pendente`
        },
        auto_return: 'approved'
      }
    });

    res.json({ init_point: result.init_point, palpite_id: palpite.id });

  } catch (err) {
    console.error('Erro criar pagamento:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ---- WEBHOOK MERCADO PAGO ----
app.post('/api/webhook', async (req, res) => {
  res.sendStatus(200); // responde rápido pro MP

  const { type, data } = req.body;
  if (type !== 'payment') return;

  try {
    const payment = new Payment(mp);
    const info = await payment.get({ id: data.id });

    if (info.status !== 'approved') return;

    const palpiteId = info.external_reference;
    const paymentId = String(info.id);

    // Confirma palpite no banco
    await supabase
      .from('palpites')
      .update({ status: 'confirmado', payment_id: paymentId })
      .eq('id', palpiteId);

    console.log(`✅ Palpite ${palpiteId} confirmado — pagamento ${paymentId}`);
  } catch (err) {
    console.error('Erro webhook:', err);
  }
});

// ---- LISTAR PALPITES CONFIRMADOS ----
app.get('/api/palpites', async (req, res) => {
  const { data, error } = await supabase
    .from('palpites')
    .select('id, nome, gols_sco, gols_bra, valor, acertou, criado_em')
    .eq('status', 'confirmado')
    .order('criado_em', { ascending: true });

  if (error) return res.status(500).json({ erro: 'Erro ao buscar palpites' });
  res.json(data);
});

// ---- LANÇAR RESULTADO (admin) ----
app.post('/api/resultado', async (req, res) => {
  const { senha, gols_sco, gols_bra } = req.body;

  if (senha !== process.env.ADMIN_PASS) {
    return res.status(401).json({ erro: 'Senha incorreta' });
  }

  // Busca todos os palpites confirmados
  const { data: todos } = await supabase
    .from('palpites')
    .select('*')
    .eq('status', 'confirmado');

  // Atualiza acertou em cada um
  for (const p of todos) {
    await supabase
      .from('palpites')
      .update({ acertou: p.gols_sco === gols_sco && p.gols_bra === gols_bra })
      .eq('id', p.id);
  }

  const acertadores = todos.filter(p => p.gols_sco === gols_sco && p.gols_bra === gols_bra);
  const total = todos.reduce((s, p) => s + Number(p.valor), 0);
  const premio = acertadores.length > 0 ? (total / acertadores.length).toFixed(2) : 0;

  res.json({
    resultado: `${gols_sco}x${gols_bra}`,
    total_participantes: todos.length,
    acertadores: acertadores.length,
    fundo_total: total.toFixed(2),
    premio_por_pessoa: premio
  });
});

// ---- START ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
