export interface Usuario {
    id: string;
    email: string;
    nombre: string;
    photoUrl?: string | null;
    user_uuid?: string | null;
}
