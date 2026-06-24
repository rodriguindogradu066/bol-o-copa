const { MercadoPagoConfig, Preference } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { nome, gols_sco, gols_bra, valor } = req.body;
  if (!nome || valor < 2 || gols_sco === undefined || gols_bra === undefined)
    return res.status(400).json({ erro: 'Dados inválidos' });

  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  try {
    const { data: palpite, error } = await supabase
      .from('palpites')
      .insert({ nome, gols_sco, gols_bra, valor, status: 'pendente' })
      .select().single();
    if (error) throw error;

    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: [{ title: `Bolão Flow State — ${nome} chuta ${gols_sco}x${gols_bra}`, quantity: 1, unit_price: Number(valor), currency_id: 'BRL' }],
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
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
};
