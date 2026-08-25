import Razorpay from 'razorpay';
import crypto from 'crypto';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_ujwala_key';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'ujwala_razorpay_secret_key';

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});

export interface CreatePaymentOrderOptions {
  amount: number; // in INR rupees
  receipt: string;
  notes?: Record<string, string>;
}

export async function createPaymentOrder(options: CreatePaymentOrderOptions) {
  const amountInPaisa = Math.round(options.amount * 100);
  
  try {
    const order = await razorpay.orders.create({
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
      isSimulated: false,
    };
  } catch (error) {
    console.warn('Razorpay order creation fallback to simulated mode:', error);
    // Sandbox fallback for local development / testing without live API keys
    const simulatedId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: simulatedId,
      amount: amountInPaisa,
      currency: 'INR',
      status: 'created',
      receipt: options.receipt,
      isSimulated: true,
    };
  }
}

export function verifyPaymentSignature(options: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  if (options.razorpay_order_id.startsWith('order_sim_')) {
    return true; // Always valid in sandbox mode
  }
  
  const text = `${options.razorpay_order_id}|${options.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(text)
    .digest('hex');

  return expectedSignature === options.razorpay_signature;
}
