import { PolicyPage } from '@/components/layout/PolicyPage';

export default function ShippingPage() {
  return (
    <PolicyPage
      eyebrow="Ujwala Eco Products"
      title="Shipping Policy"
      intro="Ujwala Eco Products discusses delivery arrangements with customers after product availability, quantity, destination, and order requirements are reviewed."
      sections={[
        {
          title: 'Delivery details',
          body: 'Delivery charges and timelines can depend on the product, order quantity, customization requirements, and destination. The team will confirm the applicable details for your request.',
        },
        {
          title: 'Custom and bulk orders',
          body: 'Custom printed and bulk orders may require additional preparation time. Please share your required date early so the production team can assess feasibility.',
        },
        {
          title: 'Address accuracy',
          body: 'Customers are responsible for providing a complete delivery address, city, state, and postal code. Contact the team promptly if submitted details need correction.',
        },
        {
          title: 'Delivery confirmation',
          body: 'The final delivery method, charge, and timeline are confirmed by Ujwala Eco Products before an order is finalized.',
        },
      ]}
    />
  );
}