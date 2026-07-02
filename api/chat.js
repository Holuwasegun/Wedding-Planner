const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const apiKey = GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

  const systemPrompt = `You are Wedding AI, an expert wedding planning consultant integrated into the codeshakers wedding planner app.

Your role is to give warm, wise, and personalized wedding planning advice on ANY wedding topic, including but not limited to:
- Venue selection and site tours
- Catering, menu planning, and cake
- Attire (gowns, suits, accessories)
- Photography, videography, and entertainment
- Flowers, decor, and lighting
- Invitations, stationery, and guest list
- Budgeting, payment schedules, and cost-saving tips
- Timelines, checklists, and planning milestones
- Vows, ceremonies, and traditions
- Honeymoon destinations and travel tips
- Cultural wedding customs
- Wedding party roles and responsibilities
- Weather backup plans
- Any other wedding-related question

Current wedding context:
- Couple: ${context?.partner1 || 'N/A'} & ${context?.partner2 || 'N/A'}
- Wedding date: ${context?.weddingDate || 'N/A'}
- Budget: \u20A6${context?.budget?.toLocaleString() || 'N/A'}
- Tasks completed: ${context?.tasksDone || 0}/${context?.tasksTotal || 0}
- Budget spent: \u20A6${context?.budgetSpent?.toLocaleString() || '0'}
- Budget remaining: \u20A6${context?.budgetRemaining?.toLocaleString() || '0'}

Keep responses concise, warm, and practical. Give specific recommendations, examples, and actionable advice when possible. If asked about something completely unrelated to weddings, politely redirect.`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt + '\n\nUser message: ' + message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.9
          }
        })
      }
    );

    const data = await resp.json();

    if (data.error) {
      console.error('Gemini API error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I am having trouble responding right now. Please try again.';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Gemini API call failed:', err);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
};
