const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  const { data, error } = await supabase
    .from('palpites')
    .select('id, nome, gols_sco, gols_bra, valor, acertou, criado_em')
    .eq('status', 'confirmado')
    .order('criado_em', { ascending: true });
  if (error) return res.status(500).json({ erro: 'Erro ao buscar palpites' });
  res.json(data);
};
