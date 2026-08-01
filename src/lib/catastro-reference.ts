export function normalizeCadastralReference(value: string): string {
    return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidCadastralReference(value: string): boolean {
    const reference = normalizeCadastralReference(value);
    return (
        [14, 18, 20].includes(reference.length)
        && /^[A-Z0-9]+$/.test(reference)
    );
}
