const missing = (label: string) => `Pendiente de configurar: ${label}`;

export const LEGAL_IDENTITY = {
  taxId: process.env.LEGAL_TAX_ID?.trim() || missing("NIF"),
  professionalBody:
    process.env.LEGAL_PROFESSIONAL_BODY?.trim() ||
    missing("colegio profesional"),
  registrationNumber:
    process.env.LEGAL_REGISTRATION_NUMBER?.trim() ||
    missing("número de colegiado"),
};
