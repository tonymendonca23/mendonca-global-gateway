export function generateWarehouseAddress(fullName: string, customerCode: string | null): string {
    const lines: string[] = [];

    lines.push(`Name: ${fullName || ''} + MGG`);
    lines.push('Address Line 1: 146-19 228th Street');
    lines.push('City: Springfield Gardens');
    lines.push('State: New York');
    lines.push('Zip Code: 11413');
    lines.push('Phone: (917) 660-6872');

    return lines.join('\n');
}
