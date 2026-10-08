import { PolicyPage } from '@/components/layout/PolicyPage';

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Ujwala Eco Products"
      title="Terms of Service"
      intro="By using this website, you agree to use it for genuine product enquiries, custom-order requests, and purchases, and to provide accurate contact and delivery information."
      sections={[
        {
          title: 'Product information',
          body: 'Product descriptions, images, prices, stock availability, customization options, and estimated charges are provided for ordering guidance and may require confirmation by the Ujwala Eco Products team.',
        },
        {
          title: 'Order requests',
          body: 'Submitting an order or custom-order form sends a request for review. The team may contact you to confirm availability, specifications, delivery details, and the final quotation before fulfillment.',
        },
        {
          title: 'Customer responsibility',
          body: 'Please provide a reachable phone number, valid email address where requested, and accurate delivery or customization details. Do not submit information that belongs to another person without permission.',
        },
        {
          title: 'Communication',
          body: 'The website may provide links to phone, email, or WhatsApp communication. Choosing one of those links may take you to an external service.',
        },
      ]}
    />
  );
}