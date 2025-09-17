// src/app/asistencia/asistencia-lista/models/asistencia.interface.ts

/**
 * 📥 Evento que llega del calendario
 */
export interface EventoAsistenciaNormal {
  id_actividad: string;
  id_sesion: string;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  nombreSesion?: string;
}

/**
 * 📥 Beneficiario que viene del backend
 */
export interface Beneficiario {
  id_persona: string;
  nombre_completo: string;
  id_sede: string;
}

/**
 * 📥 Asistente ya registrado en la sesión
 */
export interface AsistenteSesion {
  id_persona: string;
  eliminar?: 'S' | 'N';
}

/**
 * 📤 Asistente mapeado en el front (con datos completos)
 */
export interface AsistenteConDetalle {
  id_persona: string;
  nombre_completo: string;
  id_sede: string | null;
  eliminar: 'S' | 'N';
}

/**
 * 📥 Detalle de asistencia normal desde el backend
 */
export interface DetalleAsistenciaNormal {
  beneficiarios: Beneficiario[];
  asistentes_sesiones: AsistenteSesion[];
  sedes: { id_sede: string; nombre: string }[];   // 👈 aquí
  id_sede?: string;
}

/**
 * 📤 Payload al guardar asistencia normal
 */
export interface PayloadAsistenciaNormal {
  id_actividad: string;
  id_sesion: string;
  imagen: string;
  numero_asistentes: number;
  descripcion: string;
  nuevos: {
    id_persona: string;
    id_sesion: string;
    id_asistencia: string;
  }[];
}

/**
 * 📤 Respuesta del backend
 */
export interface AsistenciaResponse {
  exitoso: 'S' | 'N';
  mensaje?: string;
}
