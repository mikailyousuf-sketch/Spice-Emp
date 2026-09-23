"use client";

import type { MouseEvent, ReactNode } from "react";

type CartAddButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function CartAddButton({ children, className, disabled }: CartAddButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) return;

    const form = event.currentTarget.form;
    const quantityField = form?.elements.namedItem("quantity");
    const quantity =
      quantityField instanceof HTMLInputElement
        ? Math.max(1, Number(quantityField.value) || 1)
        : 1;

    window.dispatchEvent(
      new CustomEvent("pantry:cart-add", {
        detail: { quantity },
      }),
    );
  }

  return (
    <button
      type="submit"
      className={className}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
