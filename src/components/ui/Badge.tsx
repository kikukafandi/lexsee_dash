// Badge.tsx — Pill-shaped status/type badge component.
// Used to display status (PENDING, SUCCESS, FAILED), roles (ADMIN, PREMIUM),
// order status, and document types throughout the dashboard.

type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "gold"
  | "default";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

// Maps variant names to Tailwind classes
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-success/15 text-success border border-success/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  info: "bg-blue-500/15 text-blue-600 border border-blue-500/30",
  gold: "bg-gold/15 text-gold border border-neutral-300",
  default: "bg-surface-2 text-text-med border border-neutral-200",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Convenience helper — maps a PaymentStatus string to a Badge variant.
 * Usage: <Badge variant={paymentStatusVariant(payment.status)}>{payment.status}</Badge>
 */
export function paymentStatusVariant(
  status: string
): BadgeVariant {
  if (status === "SUCCESS") return "success";
  if (status === "FAILED") return "danger";
  return "warning"; // PENDING
}

/**
 * Convenience helper — maps an OrderStatus string to a Badge variant.
 */
export function orderStatusVariant(status: string): BadgeVariant {
  if (["DELIVERED", "PAID"].includes(status)) return "success";
  if (["CANCELLED"].includes(status)) return "danger";
  if (["SHIPPED", "PROCESSING"].includes(status)) return "info";
  return "warning"; // PENDING
}

/**
 * Convenience helper — maps a user Role to a Badge variant.
 */
export function roleVariant(role: string): BadgeVariant {
  if (role === "ADMIN") return "gold";
  if (role === "PREMIUM") return "success";
  return "default"; // USER
}
