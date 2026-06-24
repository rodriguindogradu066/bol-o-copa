const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { senha, gols_sco, gols_bra } = req.body;
  if (senha !== process.env.ADMIN_PASS) return res.status(401).json({ erro: 'Senha incorreta' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { data: todos } = await supabase.from('palpites').select('*').eq('status', 'confirmado');

  for (const p of todos) {
    await supabase.from('palpites')
      .update({ acertou: p.gols_sco === gols_sco && p.gols_bra === gols_bra })
      .eq('id', p.id);
  }

  const acertadores = todos.filter(p => p.gols_sco === gols_sco && p.gols_bra === gols_bra);
  const total = todos.reduce((s, p) => s + Number(p.valor), 0);
  res.json({
    resultado: `${gols_sco}x${gols_bra}`,
    total_participantes: todos.length,
    acertadores: acertadores.length,
    fundo_total: total.toFixed(2),
    premio_por_pessoa: acertadores.length > 0 ? (total / acertadores.length).toFixed(2) : '0'
  });
};
