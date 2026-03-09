/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface User {
    id: string;
    email: string;
    phone: string | null;
    name: string;
    address: string | null;
    us_warehouse_address: string | null;
    customer_code: string | null;
    branch_preference: string;
    last_activity: number;
    created_at: number;
}

interface Staff {
    id: string;
    email: string;
    name: string;
    role: string;
}

declare namespace App {
    interface Locals {
        user?: User;
        staff?: Staff;
    }
}
