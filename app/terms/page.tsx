import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Terms of use & sale" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms for shopping with The Glided Pantry."
      intro="These terms govern use of the website and orders placed through it, subject to applicable South African law."
    >
      <LegalSection title="Store operator">
        <p>The online store trades as <strong>The Glided Pantry</strong>. Customer support email: <a href="mailto:theglidedpantry.co.za@gmail.com">theglidedpantry.co.za@gmail.com</a>.</p>
        <p className="legal-callout">Before public launch, the store operator’s full legal name/status, registration details where applicable, physical address, telephone number and address for legal service must be added to this page and the site footer.</p>
      </LegalSection>

      <LegalSection title="Products and pricing">
        <p>We aim to display product descriptions, sizes, stock status and prices accurately. Prices are shown in South African rand. Delivery charges and any other applicable amounts are shown before payment.</p>
        <p>Product imagery may vary slightly from the physical product, packaging or batch without changing the nature of the item supplied.</p>
      </LegalSection>

      <LegalSection title="Placing an order">
        <p>The checkout gives you an opportunity to review your cart, delivery method, delivery cost and final total before continuing to payment. An order is only treated as paid once the payment provider confirms successful payment.</p>
        <p>We may contact you if information is incomplete, stock is unavailable, fraud or misuse is suspected, or fulfilment is not reasonably possible.</p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>Stock displayed online may change. If an item becomes unavailable after you pay, we will contact you and arrange an appropriate refund or alternative.</p>
      </LegalSection>

      <LegalSection title="Delivery, returns and refunds">
        <p>Our <a href="/shipping">Shipping Policy</a> and <a href="/returns">Returns & Refunds Policy</a> form part of these terms.</p>
      </LegalSection>

      <LegalSection title="Wholesale">
        <p>Wholesale enquiries, quotes and business orders may have additional commercial terms shown on the relevant quote, including pricing, validity, quantities, lead time, packaging, delivery and payment arrangements.</p>
      </LegalSection>

      <LegalSection title="Pantry Assistant">
        <p>The Pantry Assistant is a product-discovery aid. Its recommendations are grounded in catalogue information but are not medical, nutritional or allergy advice. Always verify labels and suitability for your own dietary requirements.</p>
      </LegalSection>

      <LegalSection title="Liability and statutory rights">
        <p>Nothing in these terms is intended to remove or limit rights that cannot lawfully be excluded under the Consumer Protection Act, POPIA, ECTA or other applicable South African law.</p>
      </LegalSection>
    </LegalPage>
  );
}
