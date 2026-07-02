const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { client_id } = req.query;

  if (!client_id) {
    return res.status(400).json({ error: 'client_id is required' });
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('wedding_plans')
        .select('data')
        .eq('client_id', client_id)
        .single();

      if (error && error.code === 'PGRST116') {
        return res.status(200).json({ data: null });
      }
      if (error) throw error;

      return res.status(200).json({ data: data?.data || null });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { wedding_data } = body;

      if (!wedding_data) {
        return res.status(400).json({ error: 'wedding_data is required' });
      }

      const { data, error } = await supabase
        .from('wedding_plans')
        .upsert(
          {
            client_id,
            data: wedding_data,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'client_id' }
        )
        .select('data')
        .single();

      if (error) throw error;

      return res.status(200).json({ data: data?.data || null, ok: true });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('wedding_plans')
        .delete()
        .eq('client_id', client_id);

      if (error) throw error;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
