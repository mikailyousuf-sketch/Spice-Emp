import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Shipping policy" };

export default function ShippingPage() {
  return (
    <LegalPage
      eyebrow="Shipping"
      title="How your pantry order gets to you."
      intro="Delivery options are shown before payment so you can review the method and cost before placing your order."
    >
      <LegalSection title="Available delivery methods">
        <p><strong>Door-to-door courier:</strong> a fixed R120 delivery charge is currently used at checkout while our Courier Guy API connection is unavailable.</p>
        <p><strong>PUDO locker:</strong> a fixed R75 delivery charge is available where selected. You can provide your preferred locker during checkout.</p>
        <p><strong>Uber delivery:</strong> only appears when Uber delivery is online and the delivery address is within the configured service radius. The current Uber fee is shown at checkout.</p>
      </LegalSection>

      <LegalSection title="Delivery timing">
        <p>We will prepare and dispatch paid orders as soon as reasonably possible. Delivery timing depends on the selected delivery method, destination, courier conditions and product availability.</p>
        <p>If an order cannot be fulfilled within the period agreed with you, we will contact you. Where no shorter period is agreed, South African electronic-commerce law generally requires an online supplier to execute an order within 30 days.</p>
      </LegalSection>

      <LegalSection title="Delivery information">
        <p>Please provide complete and accurate delivery details. Delays or extra costs caused by an incorrect address, inaccessible destination or incorrect PUDO preference may require us to contact you before dispatch.</p>
        <p>Tracking or delivery references will appear in your account or order communication when available.</p>
      </LegalSection>

      <LegalSection title="Uber availability">
        <p>Uber is a local delivery option rather than a guaranteed nationwide service. Availability can be switched on or off operationally and may be limited by radius, capacity or service conditions.</p>
      </LegalSection>

      <LegalSection title="Need help with a delivery?">
        <p>Email <a href="mailto:theglidedpantry.co.za@gmail.com">theglidedpantry.co.za@gmail.com</a> and include your order number.</p>
      </LegalSection>
    </LegalPage>
  );
}
