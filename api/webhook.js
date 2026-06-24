const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.sendStatus(200);
  if (req.method !== 'POST') return;
  const { type, data } = req.body;
  if (type !== 'payment') return;

  const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  try {
    const payment = new Payment(mp);
    const info = await payment.get({ id: data.id });
    if (info.status !== 'approved') return;
    await supabase.from('palpites')
      .update({ status: 'confirmado', payment_id: String(info.id) })
      .eq('id', info.external_reference);
    console.log(`✅ Palpite ${info.external_reference} confirmado`);
  } catch (err) {
    console.error('Webhook erro:', err);
  }
};
