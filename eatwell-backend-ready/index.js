import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check route
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'EatWell Backend', status: 'online' });
});

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body || {};
    if (!email || !password)
      return res
        .status(400)
        .json({ ok: false, error: 'email and password required' });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: full_name || null } },
    });

    if (error)
      return res.status(400).json({ ok: false, error: error.message });

    return res.json({
      ok: true,
      message: 'Signup successful. Please verify your email.',
    });
  } catch (e) {
    console.error('[register]', e);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res
        .status(400)
        .json({ ok: false, error: 'email and password required' });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error)
      return res.status(400).json({ ok: false, error: error.message });

    const { user, session } = data;
    if (user) {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
        })
        .select()
        .single()
        .catch(() => {});
    }

    return res.json({
      ok: true,
      user: { id: user.id, email: user.email },
      access_token: session?.access_token,
    });
  } catch (e) {
    console.error('[login]', e);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
