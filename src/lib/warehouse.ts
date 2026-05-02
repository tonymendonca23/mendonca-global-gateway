export const DEFAULT_WAREHOUSE_ADDRESS = {
    addressLine1: '146-19 228th Street',
    city: 'Springfield Gardens',
    state: 'New York',
    zipCode: '11413',
    phone: '(917) 660-6872',
};

export function generateWarehouseAddress(fullName: string, customerCode: string | null): string {
    const lines: string[] = [];

    lines.push(`Name: ${fullName || ''} MGG`);
    lines.push(`address line 1: ${DEFAULT_WAREHOUSE_ADDRESS.addressLine1}`);
    lines.push(`city: ${DEFAULT_WAREHOUSE_ADDRESS.city}`);
    lines.push(`State: ${DEFAULT_WAREHOUSE_ADDRESS.state}`);
    lines.push(`Zip code: ${DEFAULT_WAREHOUSE_ADDRESS.zipCode}`);
    lines.push(`Phone: ${DEFAULT_WAREHOUSE_ADDRESS.phone}`);

    return lines.join('\n');
}
