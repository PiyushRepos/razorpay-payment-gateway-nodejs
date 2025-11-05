import 'dotenv/config';
import express from 'express';
import razorpay from '../config/razorpay.config.js';
import cors from 'cors';
import path from 'path';
import crypto from 'node:crypto';

const PORT = process.env.PORT || 4001;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route
app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(process.cwd(), 'src/index.html'));
});

// Create order route
app.post('/create-order', (req, res) => {
  const { amount } = req.body ?? {};

  if (!amount) return res.status(400).json({ message: 'Amount is required' });

  const options = {
    amount: amount * 100, // amount in the smallest currency unit, paise for INR
    currency: 'INR',
    receipt: `receipt_order_${
      Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
    }`,
  };

  razorpay.orders.create(options, (err, order) => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'Error creating order', error: err });
    }

    res.status(201).json({ order });
  });
});

// Get Razorpay Key route
app.get('/get-razorpay-key', (req, res) => {
  return res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});

// Payment verification route
app.post('/payment-verification', (req, res) => {
  console.log('Request Body : ', req.body);

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res
      .status(400)
      .sendFile(path.join(process.cwd(), 'src/payment-failure.html'));
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  console.log('Expected Signature : ', {
    expectedSignature,
    razorpay_signature,
  });

  if (expectedSignature === razorpay_signature) {
    return res
      .status(200)
      .sendFile(path.join(process.cwd(), 'src/payment-success.html'));
  }

  return res
    .status(400)
    .sendFile(path.join(process.cwd(), 'src/payment-failure.html'));
});

// Start the server
app.listen(PORT, () => console.log(`Server is running at ${PORT}`));
