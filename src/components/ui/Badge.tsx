export default function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "error";
}) {
  const toneMap = {
    default: "border-borderGold text-textMed",
    success: "border-success/40 text-success",
    warning: "border-warning/40 text-warning",
    error: "border-error/40 text-error",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${toneMap[tone]}`}
    >
      {label}
    </span>
  );
}
