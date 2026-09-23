import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Allergens & food notice" };

export default function AllergensPage() {
  return (
    <LegalPage
      eyebrow="Food information"
      title="Ingredients, allergens and safe pantry use."
      intro="Always use the product label as the final source of ingredient and allergen information."
    >
      <LegalSection title="Allergen information">
        <p>Spices, blends and seasonings may be packed, handled or sourced in environments where allergens are also present. Unless a product is specifically labelled otherwise, do not assume it is free from traces of common allergens.</p>
        <p>If you have a serious allergy or intolerance, contact us before ordering and review the physical product label before use.</p>
      </LegalSection>

      <LegalSection title="Product descriptions">
        <p>Website descriptions, cuisine tags, flavour tags and Pantry Assistant recommendations are provided for shopping and culinary discovery. They do not replace the ingredient list, allergen declaration, storage instructions, best-before information or other information on the physical packaging.</p>
      </LegalSection>

      <LegalSection title="Dietary and medical use">
        <p>Nothing on the site should be interpreted as medical, diagnostic or nutritional advice. If a dietary restriction relates to a medical condition or severe allergy, obtain appropriate professional guidance and verify the product label.</p>
      </LegalSection>

      <LegalSection title="Storage">
        <p>Store products according to the instructions on the packaging and keep them sealed, dry and protected from excessive heat, moisture and contamination.</p>
      </LegalSection>
    </LegalPage>
  );
}
