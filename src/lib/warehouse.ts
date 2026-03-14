export function generateWarehouseAddress(fullName: string, customerCode: string | null): string {
    const lines: string[] = [];

    lines.push(`Name: ${fullName || ''} MGG`);
    lines.push('address line 1: 146-19 228th street');
    lines.push('city: Springfield Gardens');
    lines.push('State: New York');
    lines.push('Zip code: 11413');
    lines.push('Phone: (917) 660-6872');

    return lines.join('\n');
}
