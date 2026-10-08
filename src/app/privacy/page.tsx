import { PolicyPage } from '@/components/layout/PolicyPage';

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Ujwala Eco Products"
      title="Privacy Policy"
      intro="This page describes how information submitted through the Ujwala Eco Products website is used to respond to enquiries, custom-order requests, and product orders."
      sections={[
        {
          title: 'Information you provide',
          body: 'The website may receive your name, phone number, email address, delivery details, product requirements, customization notes, and other information you choose to submit in an order or enquiry form.',
        },
        {
          title: 'How information is used',
          body: 'Submitted information is used to review requests, prepare quotations, confirm product availability, arrange delivery discussions, and contact you about the request you made.',
        },
        {
          title: 'External services',
          body: 'The website uses Supabase for application data and storage, and may open WhatsApp or other communication services when you choose those contact options. Those services have their own terms and privacy practices.',
        },
        {
          title: 'Contact',
          body: 'For questions about information submitted through this website, contact Ujwala Eco Products through the contact details published on the website.',
        },
      ]}
    />
  );
}