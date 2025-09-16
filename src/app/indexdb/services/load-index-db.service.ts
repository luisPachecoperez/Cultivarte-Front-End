import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { GraphQLService } from '../../shared/services/graphql.service';
import { DatabaseService } from './database.service';

// Interfaces
import { Actividades } from '../interfaces/actividades.interface';
import { Asistencias } from '../interfaces/asistencias.interface';
import { Personas } from '../interfaces/personas.interface';
import { Personas_grupo_interes } from '../interfaces/personas_grupo_interes.interface';
import { Personas_programas } from '../interfaces/personas_programas.interface';
import { Personas_sedes } from '../interfaces/personas_sedes.interface';
import { Poblaciones } from '../interfaces/poblaciones.interface';
import { Sedes } from '../interfaces/sedes.interface';
import { Sesiones } from '../interfaces/sesiones.interface';
import { Parametros_generales } from '../interfaces/parametros_generales.interface';
import { Parametros_detalle } from '../interfaces/parametros_detalle.interface';
import { Parametros_generalesDataSource } from '../datasources/parametros_generales-datasource';
import { Parametros_detalleDataSource } from '../datasources/parametros_detalle-datasource';
import { PersonasDataSource } from '../datasources/personas-datasource';
import { PoblacionesDataSource } from '../datasources/poblaciones-datasource';
import { SedesDataSource } from '../datasources/sedes-datasource';
import { Personas_sedesDataSource } from '../datasources/personas_sedes-datasource';
import { Personas_programasDataSource } from '../datasources/personas_programas-datasource';
import { Personas_grupo_interesDataSource } from '../datasources/personas_grupo_interes-datasource';
import { ActividadesDataSource } from '../datasources/actividades-datasource';
import { AsistenciasDataSource } from '../datasources/asistencias-datasource';
import { SesionesDataSource } from '../datasources/sesiones-datasource';
import { map,switchMap,filter,from,of } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class LoadIndexDBService {
  private hoy = new Date(new Date().setDate(new Date().getDate() + 180))
    .toISOString()
    .split('T')[0];

  private haceUnAnio = new Date(new Date().setDate(new Date().getDate() - 180))
    .toISOString()
    .split('T')[0];

  constructor(
    private graphql: GraphQLService,
    private db: DatabaseService,
    private parametros_generalesDataSource: Parametros_generalesDataSource,
    private parametros_detalleDataSource: Parametros_detalleDataSource,
    private personasDataSource: PersonasDataSource,
    private poblacionesDataSource: PoblacionesDataSource,
    private sedesDataSource: SedesDataSource,
    private personas_sedesDataSource: Personas_sedesDataSource,
    private personas_programasDataSource: Personas_programasDataSource,
    private personas_grupo_interesDataSource: Personas_grupo_interesDataSource,
    private actividadesDataSource: ActividadesDataSource,
    private asistenciasDataSource: AsistenciasDataSource,
    private sesionesDataSource: SesionesDataSource
  ) {
    // //console.log('LoadIndexDBService initialized');
    //  //console.log('hoy',this.hoy);
    // //console.log('haceUnAnio',new Date(this.haceUnAnio));
  }


  ping(): Observable<string> {
    const query = `
      query Ping {
        ping {
          ping
        }
      }
    `;

    return this.graphql.query<{ ping: { ping: string } }>(query).pipe(
      map((res) => {
        //console.log('PING response:', res.ping.ping);
        // Si llega bien el backend
        return res.ping.ping;
      }),
      catchError((err) => {
        //console.error('❌ Error en ping:', err);
        return of('error');
      })
    );
  }

  // ==========================
  // PARAMETROS
  // ==========================
  async loadParametrosGenerales(): Promise<void> {
    //console.log('Cargando Parámetros Generales...');
    const query = `
      query {
        getParametrosGenerales {
          id_parametro_general
          nombre_parametro
          descripcion
          estado
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getParametrosGenerales: Parametros_generales[] }>(
        query
      )
    );

    const parametros =
      response?.getParametrosGenerales?.map((pg) => ({
        ...pg,
        syncStatus: 'synced',
      })) ?? [];

    //await this.db.parametros_generales.bulkAdd(parametros);
    await this.parametros_generalesDataSource.bulkAdd(parametros);
    //console.log(`✅ Parámetros Generales cargados: ${parametros.length}`);
  }

  async loadParametrosDetalle(): Promise<void> {
    //console.log('Cargando Parámetros detalles...');
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
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getParametrosDetalle: Parametros_detalle[] }>(query)
    );
    const detalles =
      response?.getParametrosDetalle?.map((pd) => ({
        ...pd,
        syncStatus: 'synced',
      })) ?? [];

    await this.parametros_detalleDataSource.bulkAdd(detalles);
    //console.log(`✅ Parámetros Detalle cargados: ${detalles.length}`);
  }

  // ==========================
  // PERSONAS
  // ==========================
  async loadPersonas(): Promise<void> {
    //console.log('Cargando Personas...');
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

    await this.personasDataSource.bulkAdd(personas);

    //console.log(`✅ Personas cargadas: ${personas.length}`);
  }

  // ==========================
  // POBLACIONES
  // ==========================
  async loadPoblaciones(): Promise<void> {
    //console.log('Cargando poblaciones...');
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

    await this.poblacionesDataSource.bulkAdd(poblaciones);
    //console.log(`✅ Poblaciones cargadas: ${poblaciones.length}`);
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

    await this.sedesDataSource.bulkAdd(sedes);
    //console.log(`✅ Sedes cargadas: ${sedes.length}`);
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
    //console.log('Response getPersonasSedes:', response);

    const data =
      response?.getPersonasSedes?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.personas_sedesDataSource.bulkAdd(data);
    //console.log(`✅ PersonasSedes cargadas: ${data.length}`);
  }

  async loadPersonaProgramas(): Promise<void> {
    const query = `
      query {
        getPersonaProgramas {
          id_persona_programa
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
      this.graphql.query<{ getPersonaProgramas: Personas_programas[] }>(query)
    );
    const data =
      response?.getPersonaProgramas?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.personas_programasDataSource.bulkAdd(data);
    //console.log(`✅ PersonasProgramas cargadas: ${data.length}`);
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

    await this.personas_grupo_interesDataSource.bulkAdd(data);
    //console.log(`✅ PersonasGrupoInteres cargadas: ${data.length}`);
  }

  // ==========================
  // ACTIVIDADES
  // ==========================
  async loadActividadesSede(id_usuario: string): Promise<void> {
    const query = `
      query ($id_usuario: ID!, $fecha_inicio: String!, $fecha_fin: String!) {
        getActividadSedes(
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
        }
      }
    `;

    const variables = {
      id_usuario,
      fecha_inicio: this.haceUnAnio,
      fecha_fin: this.hoy,
    };

    const response = await firstValueFrom(
      this.graphql.query<{ getActividadSedes: Actividades[] }>(query, variables)
    );
    const actividades =
      response?.getActividadSedes?.map((a) => ({
        ...a,
        deleted: false,
        syncStatus: 'synced',
      })) ?? [];

    await this.actividadesDataSource.bulkAdd(actividades);
    //console.log(`✅ Actividades cargadas: ${actividades.length}`);
  }

  // ==========================
  // ASISTENCIAS POR USUARIO
  // ==========================
  async loadAsistenciasSede(id_usuario: string): Promise<void> {
    const query = `
    query ($id_usuario: String!, $fecha_inicio: String!, $fecha_fin: String!) {
      getAsistenciasSede(
        id_usuario: $id_usuario,
        fecha_inicio: $fecha_inicio,
        fecha_fin: $fecha_fin
      ) {
        id_asistencia
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
      fecha_inicio: this.haceUnAnio,
      fecha_fin: this.hoy,
    };

    const response = await firstValueFrom(
      this.graphql.query<{ getAsistenciasSede: Asistencias[] }>(
        query,
        variables
      )
    );

    const asistencias =
      response?.getAsistenciasSede?.map((a) => ({
        ...a,
        deleted: false,
        syncStatus: 'synced',
      })) ?? [];

    await this.asistenciasDataSource.bulkAdd(asistencias);
    //console.log(`✅ Asistencias cargadas: ${asistencias.length}`);
  }

  // ==========================
  // SESIONES POR USUARIO
  // ==========================
  async loadSesionesSede(id_usuario: string): Promise<void> {
    //console.log("Cargando SesionesSedes");
    const query = `
    query ($id_usuario: ID!, $fecha_inicio: String!, $fecha_fin: String!) {
      getSesionesSedes(
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
        nro_asistentes
        descripcion
        id_creado_por
        fecha_creacion
        id_modificado_por
        fecha_modificacion
      }
    }
  `;

    const variables = {
      id_usuario,
      fecha_inicio: this.haceUnAnio,
      fecha_fin: this.hoy,
    };

    const response = await firstValueFrom(
      this.graphql.query<{ getSesionesSedes: Sesiones[] }>(query, variables)
    );
    //console.log('Respuesta getSesionesSedes:', response);

    const sesiones =
      response?.getSesionesSedes?.map((s) => ({
        ...s,
        deleted: false,
        syncStatus: 'synced',
      })) ?? [];
    //console.log('Sesiones cargadas a indexdb:', sesiones);
    await this.sesionesDataSource.bulkAdd(sesiones);
    //console.log(`✅ Sesiones cargadas: ${sesiones.length}`);
  }

  // ==========================
  // ORQUESTADOR DE CARGA
  // ==========================
  async cargarDatosIniciales(id_usuario: string): Promise<void> {
    //console.log("Inicia carga de datos iniciales");
    from(this.ping()).pipe(
      // solo seguimos si devuelve "pong"
      filter(p => p.trim() === "pong"),
      switchMap(() =>
        // encadenamos todos los métodos como Promises
        from((async () => {
          await this.loadParametrosGenerales();
          await this.loadParametrosDetalle();
          await this.loadPoblaciones();
          await this.loadSedes();
          await this.loadPersonas();
          await this.loadPersonasSedes();
          await this.loadPersonaProgramas();
          await this.loadPersonasGrupoInteres();

          await this.loadActividadesSede(id_usuario);
          await this.loadSesionesSede(id_usuario);
          await this.loadAsistenciasSede(id_usuario);
        })())
      ),
      catchError(err => {
        console.error("❌ Error en cargarDatosIniciales:", err);
        return of(null);
      })
    ).subscribe();
  }
}
