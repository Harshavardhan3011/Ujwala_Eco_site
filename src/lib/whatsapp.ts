import { getStorageUrl } from './storage';

interface WhatsAppItem {
  productName: string;
  productId: string;
  productSku?: string | null;
  quantity: number;
  price: number;
  itemTotal: number;
  image?: string | null;
  customizationNotes?: string | null;
}

interface WhatsAppOrderDetails {
  whatsappNumber: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    note?: string;
  };
  items: WhatsAppItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
}

function absoluteImageUrl(image: string): string {
  const resolved = getStorageUrl('products', image);
  if (resolved.startsWith('http')) return resolved;
  return new URL(resolved, window.location.origin).href;
}

export function buildWhatsAppOrderUrl({
  whatsappNumber,
  customer,
  items,
  subtotal,
  shippingFee,
  totalAmount,
}: WhatsAppOrderDetails): string {
  const lines = [
    'NEW ORDER - UJWALA ECO PRODUCTS',
    '',
    'CUSTOMER DETAILS',
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
  ];

  if (customer.email) lines.push(`Email: ${customer.email}`);

  lines.push(
    '',
    'DELIVERY ADDRESS',
    `Address: ${customer.address}`,
    `City: ${customer.city}`,
    `State: ${customer.state}`,
    `Pincode: ${customer.pincode}`,
    '',
    'ORDER DETAILS',
    '',
  );

  items.forEach((item, index) => {
    lines.push(
      `Product ${index + 1}:`,
      `Name: ${item.productName}`,
      `Product ID/SKU: ${item.productId}${item.productSku ? ` / ${item.productSku}` : ''}`,
      `Quantity: ${item.quantity}`,
      `Price: ${formatCurrency(item.price)}`,
      `Subtotal: ${formatCurrency(item.itemTotal)}`,
    );

    if (item.image) lines.push(`Image URL: ${absoluteImageUrl(item.image)}`);
    if (item.customizationNotes) lines.push(`Customization: ${item.customizationNotes}`);
    lines.push('');
  });

  lines.push(
    `Subtotal: ${formatCurrency(subtotal)}`,
    `Shipping: ${shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}`,
    `TOTAL: ${formatCurrency(totalAmount)}`,
  );

  if (customer.note) lines.push('', `CUSTOMER NOTE: ${customer.note}`);

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function formatCurrency(value: number): string {
  return `₹${Number(value || 0).toFixed(2)}`;
}