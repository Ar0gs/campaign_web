// ── AROGS CAMPAIGN — server.js ──
// Node.js backend: handles push subscriptions, scheduled notifications
// Deploy to Railway, Render, Fly.io, or any Node host

const express = require('express');
const webpush = require('web-push');
const cron = require('node-cron');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Load .env file only in local development (ignored on Render/Railway where vars are set in dashboard)
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch(e) {}
}

// ── VALIDATE REQUIRED ENV VARS ──
const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'CONTACT_EMAIL'
];

const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missing.forEach(v => console.error(`   • ${v}`));
  console.error('\n👉 On Render: go to your service → Environment → Add the variables above.');
  console.error('👉 Locally: copy .env.example to .env and fill in the values.\n');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST']
}));

// ── SUPABASE ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── VAPID SETUP ──
// Generate keys once with: npm run generate-vapid
webpush.setVapidDetails(
  'mailto:' + process.env.CONTACT_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── ROUTES ──

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'IMPACT Movement Server Running', time: new Date().toISOString() });
});

// Return public VAPID key to frontend
app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Save new push subscription
app.post('/subscribe', async (req, res) => {
  const { subscription, email, phone } = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    // Upsert supporter record with push subscription
    const { data, error } = await supabase
      .from('supporters')
      .upsert(
        {
          email: email || null,
          phone: phone || null,
          push_subscription: JSON.stringify(subscription),
          notifications_enabled: true,
          joined_at: new Date().toISOString()
        },
        { onConflict: 'email', ignoreDuplicates: false }
      );

    if (error) throw error;

    // Send immediate welcome push
    await sendPushToOne(subscription, {
      title: '🌟 Welcome to the IMPACT Movement!',
      body: 'Arogs thanks you for joining. Together, we Rise With IMPACT!',
      url: process.env.FRONTEND_URL || '/'
    });

    res.json({ success: true, message: 'Subscription saved' });
  } catch (err) {
    console.error('[Subscribe] Error:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Manual trigger for testing notifications
app.post('/send-test', async (req, res) => {
  const { secret, message } = req.body;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const count = await broadcastNotification({
    title: 'Arogs — IMPACT Movement',
    body: message || 'Test notification from the IMPACT Movement!',
    url: process.env.FRONTEND_URL || '/'
  });

  res.json({ success: true, sent: count });
});

// ── SEND TO ONE SUBSCRIPTION ──
async function sendPushToOne(subscription, payload) {
  try {
    const sub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired — mark as inactive
      return 'expired';
    }
    console.error('[Push] Send error:', err.message);
    return false;
  }
}

// ── BROADCAST TO ALL SUBSCRIBERS ──
async function broadcastNotification(payload) {
  const { data: supporters, error } = await supabase
    .from('supporters')
    .select('id, push_subscription')
    .eq('notifications_enabled', true)
    .not('push_subscription', 'is', null);

  if (error) {
    console.error('[Broadcast] Fetch error:', error);
    return 0;
  }

  let sent = 0;
  const expiredIds = [];

  for (const supporter of supporters) {
    if (!supporter.push_subscription) continue;
    const result = await sendPushToOne(supporter.push_subscription, payload);
    if (result === true) sent++;
    else if (result === 'expired') expiredIds.push(supporter.id);
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase
      .from('supporters')
      .update({ notifications_enabled: false, push_subscription: null })
      .in('id', expiredIds);
    console.log(`[Broadcast] Cleaned ${expiredIds.length} expired subscriptions`);
  }

  console.log(`[Broadcast] Sent ${sent}/${supporters.length} notifications`);
  return sent;
}

// ── SCHEDULED NOTIFICATIONS (Nigeria Time = UTC+1) ──

// 8:00 AM WAT (7:00 AM UTC)
cron.schedule('0 7 * * *', async () => {
  console.log('[Cron] Sending 8AM morning notification...');
  await broadcastNotification({
    title: '☀️ Good Morning from Arogs!',
    body: 'Arogs wishes you a good day today, remember to make IMPACT',
    icon: '/icon-192.png',
    url: process.env.FRONTEND_URL || '/'
  });
}, { timezone: 'UTC' });

// 9:00 PM WAT (8:00 PM UTC)
cron.schedule('0 20 * * *', async () => {
  console.log('[Cron] Sending 9PM evening notification...');
  await broadcastNotification({
    title: '🌙 Evening Check-in — Arogs',
    body: 'Hello, How much IMPACT did you make today? Arogs says Hi!',
    icon: '/icon-192.png',
    url: process.env.FRONTEND_URL || '/'
  });
}, { timezone: 'UTC' });

// ── START SERVER ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   AROGS IMPACT — Server Running      ║
  ║   Port: ${PORT}                          ║
  ║   Rise With IMPACT 🌟                ║
  ╚══════════════════════════════════════╝
  `);
});
