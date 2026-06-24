const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.sendStatus(200);
  const { type, data } = req.body;
  if (type !== 'payment') return res.sendStatus(200);

  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  try {
    const payment = new Payment(mp);
    const info = await payment.get({ id: data.id });
    if (info.status === 'approved') {
      await supabase.from('palpites')
        .update({ status: 'confirmado', payment_id: String(info.id) })
        .eq('id', info.external_reference);
      console.log(`✅ Palpite ${info.external_reference} confirmado`);
    }
  } catch (err) {
    console.error('Webhook erro:', err);
  }
  res.sendStatus(200);
};
