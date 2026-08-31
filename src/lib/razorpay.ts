import Razorpay from 'razorpay';
import crypto from 'crypto';

export function isRazorpayConfigured(): boolean {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(key_id && key_secret && key_id.trim() !== '' && key_secret.trim() !== '');
}

export function getRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

export interface CreatePaymentOrderOptions {
  amount: number; // in INR rupees
  receipt: string;
  notes?: Record<string, string>;
}

export async function createPaymentOrder(options: CreatePaymentOrderOptions) {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay payment gateway is not configured. Please contact support or choose Cash on Delivery.');
  }

  const client = getRazorpayClient();
  if (!client) {
    throw new Error('Failed to initialize Razorpay client.');
  }

  const amountInPaisa = Math.round(options.amount * 100);

  const order = await client.orders.create({
    amount: amountInPaisa,
    currency: 'INR',
    receipt: options.receipt,
    notes: options.notes || {},
  });

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    receipt: order.receipt,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
  };
}

export function verifyPaymentSignature(options: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) {
    return false;
  }

  try {
    const text = `${options.razorpay_order_id}|${options.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(text)
      .digest('hex');

    // Constant-time string comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(options.razorpay_signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}
