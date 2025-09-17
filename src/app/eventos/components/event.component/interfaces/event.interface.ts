// Representa una sesión dentro de un evento
export interface SesionFormulario {
  id_sesion?: string;
  id_actividad?: string;
  nombreSesion?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  asistentes_sesion?: number;
  metaEstado?: 'original' | 'nuevo' | 'modificado';
}

// Representa el evento completo (lo que recibimos al hacer click en el calendario)
export interface EventoFormulario {
  id_actividad?: string;
  id_sesion?: string;
  nombreSesion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  asistentes_evento?: number;
  sesiones: SesionFormulario[];
}

// Snapshot que envía el grid de sesiones al padre
export interface CambiosSesionesSnapshot {
  nuevos: SesionDTO[];
  modificados: SesionDTO[];
  eliminados: { id_sesion: string }[];
}

// DTO normalizado para mandar al backend
export interface SesionDTO {
  id_sesion?: string;
  id_actividad: string;
  fecha_sesion: string;
  hora_inicio: string;
  hora_fin: string;
}

// src/app/eventos/interfaces/event.interface.ts

export interface SesionCambioDTO {
  id_sesion?: string;
  id_actividad: string;
  fecha_sesion: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface CambiosSesionesPayload {
  nuevos: SesionCambioDTO[];
  modificados: SesionCambioDTO[];
  eliminados: { id_sesion: string }[];
}

export interface Sede {
  id_sede: string;
  nombre: string;
}

export interface TipoActividad {
  id_tipo_actividad: string;
  nombre: string;
}

export interface Aliado {
  id_aliado: string;
  nombre: string;
}

// Responsable de un evento
export interface Responsable {
  id_responsable: string;
  nombre: string;
}

// Frecuencia del evento
export interface Frecuencia {
  id_frecuencia: string;
  nombre: string;
}

export interface EventoFiltrado {
  id_parametro_detalle?: string; // <-- agregado (opcional)
  nombre: string;
  // si quieres ser flexible:
  [key: string]: any;
}

export interface NombreEvento {
  id_parametro_detalle?: string; // el identificador interno del nombre
  id_tipo_actividad?: string;    // <-- agregar esta propiedad
  nombre: string;                // el nombre visible
}

// Aliado filtrado para autocomplete
export interface AliadoFiltrado {
  id_aliado: string;
  nombre: string;
}

export interface ConfiguracionEvento {
  sedes: Sede[];
  tiposDeActividad: TipoActividad[];
  aliados: Aliado[];
  responsables: Responsable[];
  nombresDeActividad: NombreEvento[];
  frecuencias: Frecuencia[];
}

// Sesión que viene del backend (nombres en snake_case)
export interface SesionBackend {
  id_sesion: string;
  fecha_actividad: string;
  hora_inicio: string;
  hora_fin: string;
  nro_asistentes: number;
}

// Actividad que viene del backend
export interface ActividadBackend {
  id_actividad: string;
  institucional: 'S' | 'N';
  id_sede: string;
  id_tipo_actividad: string;
  id_responsable: string;
  id_aliado: string;
  nombre_actividad: string;
  descripcion: string;
  id_frecuencia: string;
  fecha_actividad: string;
  hora_inicio: string;
  hora_fin: string;
}

// Respuesta completa de obtenerEventoPorId
export interface EventoBackendResponse extends ConfiguracionEvento {
  actividad: ActividadBackend;
  sesiones: SesionBackend[];
}

export interface EventoPrecargado {
  id?: string;
  id_actividad?: string;
  institucional?: boolean | string;

  // Campos de backend
  id_sede?: string;
  id_tipo_actividad?: string;
  id_responsable?: string;
  id_aliado?: string;
  nombre_actividad?: string;
  descripcion?: string;
  id_frecuencia?: string;
  fecha_actividad?: string;
  hora_inicio?: string;
  hora_fin?: string;

  // Campos de formulario
  sede?: string;
  tipoEvento?: string;
  responsable?: string;
  aliado?: string;
  nombreEvento?: string;
  descripcionGrupo?: string;
  frecuencia?: string;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;

  // Relación con sesiones
  sesiones?: SesionFormulario[];
}


// Sesión usada al CREAR un evento (payload al backend)
export interface SesionCreaciones {
  id_sesion: string;
  id_actividad?: string;
  fecha_actividad: string;
  hora_inicio: string;
  hora_fin: string;
  id_creado_por: string;
}


export interface Sesiones {
  id_sesion: string;
  id_actividad: string;
  fecha_sesion: string;   // 👈 en back se llama así
  hora_inicio: string;
  hora_fin: string;
  id_creado_por?: string;
  syncStatus?: 'pending' | 'synced';
  deleted?: boolean;
}

// En event.interface.ts
export interface SesionCreacion {
  id_sesion?: string;
  id_actividad?: string;
  fecha_actividad: string;  // 👈 cuando se crea desde el front
  hora_inicio: string;
  hora_fin: string;
}

export interface EventoFormValue {
  id_programa: string;
  institucional: boolean;
  sede: string;
  tipoEvento: string;
  responsable: string;
  aliado: string;
  nombreEvento: string;
  descripcionGrupo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  frecuencia: string;
  sesiones: any[]; // 👈 se puede refinar a FormArray si quieres
  id_actividad?: string; // opcional, útil en edición
}


export interface SesionBasica {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}


export interface CambiosSesiones {
  nuevos: SesionFormulario[];
  modificados: SesionFormulario[];
  eliminados: SesionFormulario[];
}
