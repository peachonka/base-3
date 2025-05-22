require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middleware
app.use(express.json());

// Пример защищенного роута
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Доступ разрешен', user: req.user });
});

// Пример роута с Stripe
app.post('/api/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount * 100, // amount in cents
      currency: 'usd',
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware аутентификации
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(8080, () => console.log('Server running on port 8080'));