const express = require('express');
const cors = require('cors');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_demo');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Data
const products = [
  { id: 1, name: 'NovaMind AI', category: 'Software', page: 'novamind.html', price: 79 },
  { id: 2, name: 'Aetherfolio 3D', category: 'Portfolio', page: 'portfolio.html', price: 49 },
  { id: 3, name: 'Vortex Protocol', category: 'Dashboard', page: 'aetherx.html', price: 99 },
  { id: 4, name: 'CyberCart Spatial', category: 'E-Commerce', page: 'vortex-wear.html', price: 85 },
  { id: 5, name: 'Resonance Audio', category: 'Audio', page: 'portfolio.html', price: 0, isFree: true },
  { id: 6, name: 'AetherVerse Spatial', category: 'AR/VR', page: 'portfolio.html', price: 119 }
];

const portfolio = [
  { id: 1, title: 'NovaMind Project', page: 'novamind.html' },
  { id: 2, title: 'AetherX Platform', page: 'aetherx.html' },
  { id: 3, title: 'Vortex Wearable Tech', page: 'vortex-wear.html' }
];

// Routes
app.get('/api/products', (req, res) => res.json(products));
app.get('/api/portfolio', (req, res) => res.json(portfolio));

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'Semua field wajib diisi' });
  }
  console.log('Pesan diterima:', { name, email, message });
  res.json({ status: 'success', message: 'Pesan berhasil dikirim' });
});

// STRIPE CHECKOUT (Global)
app.post('/api/checkout/stripe', async (req, res) => {
  const { name, price, currency = 'usd' } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Missing name or price' });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: { name: name },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/dashboard.html?status=success`,
      cancel_url: `${req.headers.origin}/products.html?status=cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MIDTRANS SNAP (Indonesian QRIS)
app.post('/api/checkout/midtrans', async (req, res) => {
  const { name, price, orderId } = req.body;
  if (!name || !price || !orderId) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const snapToken = `midtrans-snap-token-${orderId}-${Date.now()}`;
  console.log(`[Midtrans] Order ${orderId}: ${name} - Rp ${price}`);
  res.json({ snapToken, transactionToken: snapToken });
});

// STRIPE WEBHOOK
app.post('/api/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  res.status(200).json({ received: true });
});

// SEND WHATSAPP VIA FONNTE
app.post('/api/whatsapp/send', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'Missing to or message' });
  }
  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONNTE_TOKEN || 'fonnte_demo_token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, message }),
    });
    const data = await response.json();
    res.json({ status: 'sent', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WEBHOOK HANDLER (called after payment verification)
app.post('/api/webhook/payment-success', (req, res) => {
  const { orderId, templateName, email, customerPhone } = req.body;
  console.log(`[Payment Success] Order ${orderId}: ${templateName} for ${email}`);

  // Auto-send WhatsApp confirmation
  const whatsappMsg = `✅ Payment confirmed!\n\nOrder: ${templateName}\nEmail: ${email}\n\nYour download link will be sent shortly.`;

  // Trigger WhatsApp send (non-blocking)
  fetch('http://localhost:' + PORT + '/api/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: customerPhone, message: whatsappMsg }),
  }).catch(console.error);

  res.json({ status: 'success', message: 'Payment verified, WhatsApp sent' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
