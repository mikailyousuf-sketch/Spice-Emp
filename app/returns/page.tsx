import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Returns & refunds" };

export default function ReturnsPage() {
  return (
    <LegalPage
      eyebrow="Returns & refunds"
      title="Fair remedies for damaged, incorrect or defective goods."
      intro="Because spices are food products, change-of-mind returns are handled differently from ordinary non-food retail goods. Your statutory consumer rights still apply."
    >
      <LegalSection title="Damaged, defective or incorrect goods">
        <p>If your order arrives damaged, unsafe, defective, incorrectly supplied or materially different from what you ordered, contact us as soon as possible with your order number and, where helpful, photographs of the issue.</p>
        <p>Where the Consumer Protection Act applies, statutory remedies for goods that fail applicable quality standards are not excluded by this policy.</p>
      </LegalSection>

      <LegalSection title="Change-of-mind returns">
        <p>Spices and other foodstuffs intended for everyday consumption do not fall under the general seven-day cooling-off right in section 44 of the Electronic Communications and Transactions Act.</p>
        <p>For food-safety and integrity reasons, we generally do not accept change-of-mind returns of opened, used, tampered-with or unsealed food products. Any discretionary return must be agreed with us before goods are sent back.</p>
      </LegalSection>

      <LegalSection title="Refunds">
        <p>Approved refunds are returned through the original payment route where reasonably possible. Processing times can depend on the payment provider and bank.</p>
        <p>If an item becomes unavailable after payment and we cannot fulfil the order, we will contact you and arrange the appropriate refund or alternative with you.</p>
      </LegalSection>

      <LegalSection title="How to request help">
        <p>Email <a href="mailto:theglidedpantry.co.za@gmail.com">theglidedpantry.co.za@gmail.com</a> with your order number, the affected item and a short description of the problem.</p>
      </LegalSection>
    </LegalPage>
  );
}
