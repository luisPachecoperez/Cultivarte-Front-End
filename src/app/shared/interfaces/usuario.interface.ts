export interface Usuario {
  id: string | null;
  email: string;
  nombre: string;
  exp: number | null;
  photoUrl?: string | null;
  user_uuid?: string | null;
}
