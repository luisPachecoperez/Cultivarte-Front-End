import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { GraphQLService } from '../../shared/services/graphql.service';
import { DatabaseService } from './database.service';

// Interfaces
import { Actividades } from '../interfaces/actividades';
import { Aliados } from '../interfaces/aliados';
import { Beneficiarios } from '../interfaces/beneficiarios';
import { Asistencias } from '../interfaces/asistencias';
import { Parametros_detalle } from '../interfaces/parametros_detalle';
import { Parametros_generales } from '../interfaces/parametros_generales';
import { Personas } from '../interfaces/personas';
import { Personas_grupo_interes } from '../interfaces/personas_grupo_interes';
import { Personas_programas } from '../interfaces/personas_programas';
import { Personas_sedes } from '../interfaces/personas_sedes';
import { Poblaciones } from '../interfaces/poblaciones';
import { Sedes } from '../interfaces/sedes';
import { Sesiones } from '../interfaces/sesiones';
import { Sessions } from '../interfaces/sessions';

@Injectable({
  providedIn: 'root',
})
export class LoadIndexDB {
  constructor(private graphql: GraphQLService, private db: DatabaseService) {}

  // ==========================
  // ACTIVIDADES
  // ==========================
  async loadActividadesSede(id_usuario: string): Promise<void> {
    const hoy = new Date();
    const haceUnAnio = new Date();
    haceUnAnio.setDate(hoy.getDate() - 365);

    const query = `
      query ($id_usuario: String!, $fecha_inicio: String!, $fecha_fin: String!) {
        getActividadesSede(
          id_usuario: $id_usuario,
          fecha_inicio: $fecha_inicio,
          fecha_fin: $fecha_fin
        ) {
          id_actividad
          id_programa
          id_tipo_actividad
          id_responsable
          id_aliado
          id_sede
          id_frecuencia
          institucional
          nombre_actividad
          descripcion
          fecha_actividad
          hora_inicio
          hora_fin
          plazo_asistencia
          estado
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion
          asistentes_actividad
        }
      }
    `;

    const variables = {
      id_usuario,
      fecha_inicio: haceUnAnio.toISOString().split('T')[0],
      fecha_fin: hoy.toISOString().split('T')[0],
    };

    const response = await firstValueFrom(
      this.graphql.query<{ getActividadesByUsuario: Actividades[] }>(
        query,
        variables
      )
    );

    const actividades =
      response?.getActividadesByUsuario?.map((a) => ({
        ...a,
        deleted: false,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.actividades.bulkAdd(actividades);
    console.log(`✅ Actividades cargadas: ${actividades.length}`);
  }

  // ==========================
  // ALIADOS
  // ==========================
  // ==========================
  // ALIADOS POR USUARIO/SEDE
  // ==========================
  async loadAliadosSede(id_usuario: string): Promise<void> {
    const query = `
    query ($id_usuario: String!) {
      getAliadosSede(id_usuario: $id_usuario) {
        id_persona
        id_tipo_persona
        id_colegio
        id_sexo
        id_ubicacion
        id_pais
        id_departamento
        id_ciudad
        id_tipo_identificacion
        identificacion
        nombres
        apellidos
        razon_social
        fecha_nacimiento
        nombre_acudiente
        apellidos_acudiente
        correo_acudiente
        celular_acudiente
        archivo_habeas_data
        acepta_habeas_data
        fecha_habeas_data
        canal_habeas_data
        soporte_habeas_data
        dir_ip_habeas_data
        email
        email_contacto
        telefono_movil_contacto
        telefono_movil
        eliminado
        id_creado_por
        fecha_creacion
        id_modificado_por
        fecha_modificacion
      }
    }
  `;

    const variables = { id_usuario };

    const response = await firstValueFrom(
      this.graphql.query<{ getAliadosSede: Aliados[] }>(query, variables)
    );

    const aliados =
      response?.getAliadosSede?.map((a) => ({
        ...a,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.aliados.bulkAdd(aliados);
    console.log(
      `✅ Aliados cargados para usuario ${id_usuario}: ${aliados.length}`
    );
  }

  // ==========================
  // BENEFICIARIOS
  // ==========================
  async loadBeneficiariosSede(): Promise<void> {
    const query = `
      query {
        getBeneficiariosSede {
          id_persona
          id_tipo_persona
          id_colegio
          id_sexo
          id_ubicacion
          id_pais
          id_departamento
          id_ciudad
          id_tipo_identificacion
          identificacion
          nombres
          apellidos
          razon_social
          fecha_nacimiento
          nombre_acudiente
          apellidos_acudiente
          correo_acudiente
          celular_acudiente
          archivo_habeas_data
          acepta_habeas_data
          fecha_habeas_data
          canal_habeas_data
          soporte_habeas_data
          dir_ip_habeas_data
          email
          email_contacto
          telefono_movil_contacto
          telefono_movil
          eliminado
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion,
          id_sede
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getBeneficiarios: Beneficiarios[] }>(query)
    );

    const beneficiarios =
      response?.getBeneficiarios?.map((b) => ({
        ...b,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.Beneficiarios.bulkAdd(beneficiarios);
    console.log(`✅ Beneficiarios cargados: ${beneficiarios.length}`);
  }

  // ==========================
  // ASISTENCIAS POR USUARIO
  // ==========================
  async loadAsistenciasSede(id_usuario: string): Promise<void> {
    const hoy = new Date();
    const haceUnAnio = new Date();
    haceUnAnio.setDate(hoy.getDate() - 365);

    const query = `
    query ($id_usuario: String!, $fecha_inicio: String!, $fecha_fin: String!) {
      getAsistenciasSede(
        id_usuario: $id_usuario,
        fecha_inicio: $fecha_inicio,
        fecha_fin: $fecha_fin
      ) {
        id_asistencia
        id_actividad
        id_sesion
        id_persona
        id_creado_por
        fecha_creacion
        id_modificado_por
        fecha_modificacion
      }
    }
  `;

    const variables = {
      id_usuario,
      fecha_inicio: haceUnAnio.toISOString().split('T')[0],
      fecha_fin: hoy.toISOString().split('T')[0],
    };

    const response = await firstValueFrom(
      this.graphql.query<{ getAsistenciasPorUsuario: Asistencias[] }>(
        query,
        variables
      )
    );

    const asistencias =
      response?.getAsistenciasPorUsuario?.map((a) => ({
        ...a,
        deleted: false,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.asistencias.bulkAdd(asistencias);
    console.log(`✅ Asistencias cargadas: ${asistencias.length}`);
  }

  // ==========================
  // PARAMETROS
  // ==========================
  async loadParametrosGenerales(): Promise<void> {
    const query = `
      query {
        getParametrosGenerales {
          id_parametro_general
          nombre_parametro
          descripcion
          estado
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getParametrosGenerales: Parametros_generales[] }>(
        query
      )
    );

    const data =
      response?.getParametrosGenerales?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.parametros_generales.bulkAdd(data);
    console.log(`✅ Parametros Generales cargados: ${data.length}`);
  }

  async loadParametrosDetalle(): Promise<void> {
    const query = `
      query {
        getParametrosDetalle {
          id_parametro_detalle
          id_parametro_general
          nombre
          codigo
          orden
          valores
          estado
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getParametrosDetalle: Parametros_detalle[] }>(query)
    );

    const data =
      response?.getParametrosDetalle?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.parametros_detalle.bulkAdd(data);
    console.log(`✅ Parametros Detalle cargados: ${data.length}`);
  }

  // ==========================
  // SESIONES POR USUARIO
  // ==========================
  async loadSesionesSede(id_usuario: string): Promise<void> {
    const hoy = new Date();
    const haceUnAnio = new Date();
    haceUnAnio.setDate(hoy.getDate() - 365);

    const query = `
    query ($id_usuario: String!, $fecha_inicio: String!, $fecha_fin: String!) {
      getSesionesSede(
        id_usuario: $id_usuario,
        fecha_inicio: $fecha_inicio,
        fecha_fin: $fecha_fin
      ) {
        id_sesion
        id_actividad
        fecha_actividad
        hora_inicio
        hora_fin
        imagen
        asistentes_evento
        id_creado_por
        fecha_creacion
        id_modificado_por
        fecha_modificacion
      }
    }
  `;

    const variables = {
      id_usuario,
      fecha_inicio: haceUnAnio.toISOString().split('T')[0],
      fecha_fin: hoy.toISOString().split('T')[0],
    };

    const response = await firstValueFrom(
      this.graphql.query<{ getSesionesSede: Sesiones[] }>(
        query,
        variables
      )
    );

    const sesiones =
      response?.getSesionesSede?.map((s) => ({
        ...s,
        deleted: false,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.sesiones.bulkAdd(sesiones);
    console.log(`✅ Sesiones cargadas: ${sesiones.length}`);
  }

  // ==========================
  // POBLACIONES
  // ==========================
  async loadPoblaciones(): Promise<void> {
    const query = `
      query {
        getPoblaciones {
          id_poblacion
          id_padre
          nombre
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getPoblaciones: Poblaciones[] }>(query)
    );

    const poblaciones =
      response?.getPoblaciones?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.poblaciones.bulkAdd(poblaciones);
    console.log(`✅ Poblaciones cargadas: ${poblaciones.length}`);
  }

  // ==========================
  // SEDES
  // ==========================
  async loadSedes(): Promise<void> {
    const query = `
      query {
        getSedes {
          id_sede
          id_pais
          id_departamento
          id_ciudad
          nombre
          numero_convenio
          fecha_apertura_sede
          matricula_inmobiliaria
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getSedes: Sedes[] }>(query)
    );

    const sedes =
      response?.getSedes?.map((s) => ({
        ...s,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.sedes.bulkAdd(sedes);
    console.log(`✅ Sedes cargadas: ${sedes.length}`);
  }

  // ==========================
  // PERSONAS (y relaciones)
  // ==========================
  async loadPersonas(): Promise<void> {
    const query = `
      query {
        getPersonas {
          id_persona
          id_tipo_persona
          id_colegio
          id_sexo
          id_ubicacion
          id_pais
          id_departamento
          id_ciudad
          id_tipo_identificacion
          identificacion
          nombres
          apellidos
          razon_social
          fecha_nacimiento
          nombre_acudiente
          apellidos_acudiente
          correo_acudiente
          celular_acudiente
          archivo_habeas_data
          acepta_habeas_data
          fecha_habeas_data
          canal_habeas_data
          soporte_habeas_data
          dir_ip_habeas_data
          email
          email_contacto
          telefono_movil_contacto
          telefono_movil
          eliminado
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getPersonas: Personas[] }>(query)
    );

    const personas =
      response?.getPersonas?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.personas.bulkAdd(personas);
    console.log(`✅ Personas cargadas: ${personas.length}`);
  }

  async loadPersonasSedes(): Promise<void> {
    const query = `
      query {
        getPersonasSedes {
          id_personas_sede
          id_persona
          id_sede
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getPersonasSedes: Personas_sedes[] }>(query)
    );

    const data =
      response?.getPersonasSedes?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.personas_sedes.bulkAdd(data);
    console.log(`✅ PersonasSedes cargadas: ${data.length}`);
  }

  async loadPersonasProgramas(): Promise<void> {
    const query = `
      query {
        getPersonasProgramas {
          id_personas_programa
          id_persona
          id_programa
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getPersonasProgramas: Personas_programas[] }>(query)
    );

    const data =
      response?.getPersonasProgramas?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.personas_programas.bulkAdd(data);
    console.log(`✅ PersonasProgramas cargadas: ${data.length}`);
  }

  async loadPersonasGrupoInteres(): Promise<void> {
    const query = `
      query {
        getPersonasGrupoInteres {
          id_personas_grupo_interes
          id_persona
          id_grupo_interes
          id_creado_por
          fecha_creacion
          id_modificado_por
          fecha_modificacion
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getPersonasGrupoInteres: Personas_grupo_interes[] }>(
        query
      )
    );

    const data =
      response?.getPersonasGrupoInteres?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.db.personas_grupo_interes.bulkAdd(data);
    console.log(`✅ PersonasGrupoInteres cargadas: ${data.length}`);
  }


  // ==========================
  // ORQUESTADOR DE CARGA
  // ==========================
  async cargarDatosIniciales(id_usuario: string): Promise<void> {
    console.log(`🚀 Iniciando carga de datos para usuario ${id_usuario}`);

    try {
      // ==========================
      // Métodos por usuario / sede
      // ==========================
      await this.loadActividadesSede(id_usuario);
      await this.loadAsistenciasSede(id_usuario);
      await this.loadSesionesSede(id_usuario);
      await this.loadAliadosSede(id_usuario);
      await this.loadBeneficiariosSede();

      // ==========================
      // Métodos globales
      // ==========================
      await this.loadParametrosGenerales();
      await this.loadParametrosDetalle();
      await this.loadPoblaciones();
      await this.loadSedes();
      await this.loadPersonas();
      await this.loadPersonasSedes();
      await this.loadPersonasProgramas();
      await this.loadPersonasGrupoInteres();

      console.log(`✅ Carga de datos completada para usuario ${id_usuario}`);
    } catch (error) {
      console.error(`❌ Error en cargarDatos:`, error);
    }
  }

}
