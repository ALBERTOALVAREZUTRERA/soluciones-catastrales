export const WHATSAPP_NUMBER = "34665890608";

export function whatsappUrl(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Vía alternativa cuando el envío por correo falla: la consulta ya escrita
 * se abre en WhatsApp para que el contacto no se pierda.
 */
export function WhatsAppFallback({ lines }: { lines: string[] }) {
  const text = ["Hola, el formulario de la web no me ha dejado enviar esta consulta:", ...lines.filter(Boolean)].join("\n");
  return (
    <a
      href={whatsappUrl(text)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#25D366] px-4 py-2 text-sm font-bold text-white hover:bg-[#128C7E]"
    >
      Enviar esta consulta por WhatsApp
    </a>
  );
}
