export interface Address {
    street: string;
    city: string;
    state?: string;
    zip: string;
}
export interface Company {
    name: string;
    contact: string;
    address: Address;
    identifier: string;
    vatNumber?: string;
}
export interface Person {
    name: string;
    address?: Address;
}
