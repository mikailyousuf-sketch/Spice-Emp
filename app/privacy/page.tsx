import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Privacy & POPIA" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy & POPIA"
      title="Your information is used to run your order, account and pantry experience."
      intro="This notice explains the main categories of personal information we process and why."
    >
      <LegalSection title="Information we collect">
        <p>Depending on how you use the site, we may process your name, email address, phone number, delivery and billing addresses, account information, order history, wholesale enquiry details, support correspondence, product searches, assistant prompts and technical information needed to operate the website.</p>
      </LegalSection>

      <LegalSection title="Why we use it">
        <p>We use relevant personal information to create and manage accounts, process orders, arrange delivery, provide customer support, manage wholesale enquiries and quotes, prevent misuse, maintain records, improve catalogue discovery and meet legal or regulatory obligations.</p>
      </LegalSection>

      <LegalSection title="Payments">
        <p>Online payment processing is handled through configured payment providers such as Yoco or Paystack. We do not intentionally store full card numbers or card security codes in The Glided Pantry database.</p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>We may share only the information reasonably necessary with service providers that help us operate the store, such as hosting, database, payment, email and delivery providers. Their own privacy terms may also apply to the services they provide.</p>
      </LegalSection>

      <LegalSection title="Retention and security">
        <p>We retain information for as long as reasonably necessary for the purpose for which it was collected, legal record-keeping, dispute handling, fraud prevention and legitimate business operations. We use technical and organisational safeguards appropriate to the systems we operate.</p>
      </LegalSection>

      <LegalSection title="Your privacy requests">
        <p>You may contact us to request access to, correction of or deletion of personal information where applicable, or to raise a privacy concern. Email <a href="mailto:theglidedpantry.co.za@gmail.com">theglidedpantry.co.za@gmail.com</a>.</p>
        <p>You may also lodge a complaint with the Information Regulator of South Africa if you believe your personal information has been processed unlawfully.</p>
      </LegalSection>

      <LegalSection title="Marketing">
        <p>Where we send optional marketing communications, you may opt out. Transactional messages about orders, payments, fulfilment and wholesale activity may still be sent where necessary to provide the service you requested.</p>
      </LegalSection>
    </LegalPage>
  );
}
