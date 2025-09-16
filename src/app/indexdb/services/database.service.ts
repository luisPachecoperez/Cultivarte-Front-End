import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Actividades } from '../interfaces/actividades.interface';
import { Aliados } from '../interfaces/aliados.interface';
import { Beneficiarios } from '../interfaces/beneficiarios.interface';

import { Asistencias } from '../interfaces/asistencias.interface';
import { Parametros_detalle } from '../interfaces/parametros_detalle.interface';
import { Parametros_generales } from '../interfaces/parametros_generales.interface';
import { Personas } from '../interfaces/personas.interface';
import { Personas_grupo_interes } from '../interfaces/personas_grupo_interes.interface';
import { Personas_programas } from '../interfaces/personas_programas.interface';
import { Personas_sedes } from '../interfaces/personas_sedes.interface';
import { Poblaciones } from '../interfaces/poblaciones.interface';
import { Sedes } from '../interfaces/sedes.interface';
import { Sesiones } from '../interfaces/sesiones.interface';
import { Sessions } from '../interfaces/sessions.interface';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService extends Dexie {
  actividades!: Table<Actividades, string>;
  aliados!: Table<Aliados, string>;

  asistencias!: Table<Asistencias, string>;
  parametros_detalle!: Table<Parametros_detalle, string>;
  parametros_generales!: Table<Parametros_generales, string>;
  personas!: Table<Personas, string>;
  Aliados!: Table<Aliados, string>;
  Beneficiarios!: Table<Beneficiarios, string>;
  personas_grupo_interes!: Table<Personas_grupo_interes, string>;
  personas_programas!: Table<Personas_programas, string>;
  personas_sedes!: Table<Personas_sedes, string>;
  poblaciones!: Table<Poblaciones, string>;
  sedes!: Table<Sedes, string>;
  sesiones!: Table<Sesiones, string>;
  sessions!: Table<Sessions, string>;

  constructor() {
    super('CultivarteAppIndexDB');
    //console.log('Crea base de datos si no existe');
    this.version(1).stores({
      actividades:
        'id_actividad, id_programa, id_tipo_actividad, id_responsable, id_aliado, id_sede, id_frecuencia, institucional, nombre_actividad, descripcion, fecha_actividad_desde, fecha_actividad_hasta, plazo_asistencia, estado, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      asistencias:
        'id_asistencia, id_actividad, id_sesion, id_persona, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      parametros_detalle:
        'id_parametro_detalle, id_parametro_general, nombre, codigo, orden, valores, estado, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      parametros_generales:
        'id_parametro_general, nombre_parametro, descripcion, estado, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      personas:
        'id_persona, id_tipo_persona, id_colegio, id_sexo, id_ubicacion, id_pais, id_departamento, id_ciudad, id_tipo_identificacion, identificacion, nombres, apellidos, razon_social, fecha_nacimiento, nombre_acudiente, apellidos_acudiente, correo_acudiente, celular_acudiente, archivo_habeas_data, acepta_habeas_data, fecha_habeas_data, canal_habeas_data, soporte_habeas_data, dir_ip_habeas_data, email, email_contacto, telefono_movil_contacto, telefono_movil, eliminado, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      personas_grupo_interes:
        'id_personas_grupo_interes, id_persona, id_grupo_interes, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      personas_programas:
        'id_persona_programa, id_persona, id_programa, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      personas_sedes:
        'id_personas_sede, id_persona, id_sede, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      poblaciones:
        'id_poblacion, id_padre, nombre, codigo, estado, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      sedes:
        'id_sede, id_pais, id_departamento, id_ciudad, nombre, direccion, telefono, email, estado, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',

      sesiones:
        'id_sesion, id_actividad, fecha_actividad, hora_inicio, hora_fin,imagen,descripcion, nro_asistentes, id_creado_por, fecha_creacion, id_modificado_por, fecha_modificacion',
      sessions:
        'session_id, user_id, user_email, user_name, created_at, expires_at, revoked',
    });
    //console.log('Base de datos lista para usarse');
  }
}

export const indexDB = new DatabaseService();
