import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <LegalPage
      eyebrow="FAQ"
      title="The common pantry questions."
      intro="Quick answers about ordering, delivery, wholesale, payments and the Pantry Assistant."
    >
      <LegalSection title="What delivery options are available?">
        <p>Door-to-door courier, PUDO locker and Uber delivery are supported. Uber is only shown when it is operationally online and your address is within the configured service radius.</p>
      </LegalSection>

      <LegalSection title="How much is delivery?">
        <p>Door-to-door is currently R120 and PUDO is R75. Uber pricing is shown dynamically at checkout.</p>
      </LegalSection>

      <LegalSection title="Can I track my order?">
        <p>Yes. Signed-in customers can use the account order area, and tracking or delivery references are shown when available.</p>
      </LegalSection>

      <LegalSection title="What if my payment fails?">
        <p>The failed-payment flow allows a safe retry. Stock is checked again before a new payment attempt begins.</p>
      </LegalSection>

      <LegalSection title="Can restaurants or retailers order in bulk?">
        <p>Yes. Use the <a href="/business">Wholesale</a> enquiry flow. Quotes can be priced per kilogram, sent securely and accepted online.</p>
      </LegalSection>

      <LegalSection title="Does the Pantry Assistant invent products?">
        <p>No. Recommendations are constrained to live catalogue products. Search demand with no strong match is logged so we can learn what customers want us to stock.</p>
      </LegalSection>

      <LegalSection title="Can I return spices?">
        <p>Food products are handled differently from ordinary change-of-mind retail returns. See the <a href="/returns">Returns & Refunds Policy</a> for damaged, incorrect or defective products and food-safety restrictions.</p>
      </LegalSection>

      <LegalSection title="How do I contact you?">
        <p>Email <a href="mailto:theglidedpantry.co.za@gmail.com">theglidedpantry.co.za@gmail.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
