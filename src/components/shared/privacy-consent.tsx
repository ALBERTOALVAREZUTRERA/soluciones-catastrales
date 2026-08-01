import Link from "next/link";

interface PrivacyConsentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  tone?: "light" | "dark";
}

export function PrivacyConsent({
  checked,
  onCheckedChange,
  id,
  tone = "light",
}: PrivacyConsentProps) {
  const textColor = tone === "dark" ? "text-blue-100" : "text-slate-600";
  const linkColor = tone === "dark" ? "text-white" : "text-primary";

  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 text-xs leading-relaxed ${textColor}`}
    >
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
      />
      <span>
        He leído y acepto la{" "}
        <Link
          href="/legal/privacidad"
          className={`font-semibold underline underline-offset-2 ${linkColor}`}
        >
          política de privacidad
        </Link>{" "}
        para que contacten conmigo sobre esta solicitud.
      </span>
    </label>
  );
}

export function HoneypotField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
    >
      <label htmlFor={id}>Sitio web</label>
      <input
        id={id}
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
