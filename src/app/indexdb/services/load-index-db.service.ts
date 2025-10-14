import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { GraphQLService } from '../../shared/services/graphql.service';
import { DatabaseService } from './database.service';

// Interfaces
import { ActividadesDB } from '../interfaces/actividades.interface';
import { AsistenciasDB } from '../interfaces/asistencias.interface';
import { PersonasDB } from '../interfaces/personas.interface';
import { Personas_grupo_interesDB } from '../interfaces/personas_grupo_interes.interface';
import { Personas_programasDB } from '../interfaces/personas_programas.interface';
import { Personas_sedesDB } from '../interfaces/personas_sedes.interface';
import { PoblacionesDB } from '../interfaces/poblaciones.interface';
import { SedesDB } from '../interfaces/sedes.interface';
import { SesionesDB } from '../interfaces/sesiones.interface';
import { Parametros_generalesDB } from '../interfaces/parametros_generales.interface';
import { Parametros_detalleDB } from '../interfaces/parametros_detalle.interface';
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
import { map, switchMap, filter, from, of } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LoadIndexDBService {
  private hoy = new Date(new Date().setDate(new Date().getDate() + 180))
    .toISOString()
    .split('T')[0];

  private haceUnAnio = new Date(new Date().setDate(new Date().getDate() - 180))
    .toISOString()
    .split('T')[0];
  private limit: number;

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
    private sesionesDataSource: SesionesDataSource,
  ) {
    this.limit = 2500;
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
      catchError((err: HttpErrorResponse) => {
        return of(err.message);
      }),
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
      this.graphql.query<{ getParametrosGenerales: Parametros_generalesDB[] }>(
        query,
      ),
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
      this.graphql.query<{ getParametrosDetalle: Parametros_detalleDB[] }>(
        query,
      ),
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
    let offset: number = 0;
    let hasMore: boolean = true;
    await this.personasDataSource.deleteFull();
    while (hasMore) {
      const query = `
        query GetPersonas($limit: Int!, $offset: Int!) {
          getPersonas(limit: $limit, offset: $offset) {
            id_persona
            id_tipo_persona
            id_tipo_identificacion
            identificacion
            nombres
            apellidos
            razon_social
            email
          }
        }
      `;

      const variables = {
        limit: this.limit,
        offset: offset,
      };

      const response = await firstValueFrom(
        this.graphql.query<{ getPersonas: PersonasDB[] }>(query, variables),
      );
      //console.log('Respuesta:', response);
      const data =
        response?.getPersonas?.map((p) => ({
          ...p,
          syncStatus: 'synced',
        })) ?? [];

      await this.personasDataSource.bulkAdd(data);
      if (data.length < this.limit) {
        hasMore = false;
      } else {
        offset += this.limit;
      }
    }

    //console.log(`✅ Personas cargadas`);
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
      this.graphql.query<{ getPoblaciones: PoblacionesDB[] }>(query),
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
      this.graphql.query<{ getSedes: SedesDB[] }>(query),
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
    let offset: number = 0;
    let hasMore: boolean = true;
    await this.personas_sedesDataSource.deleteFull();
    while (hasMore) {
      const query = `
      query GetPersonasSedes($limit: Int!, $offset: Int!) {
        getPersonasSedes(limit: $limit, offset: $offset) {
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
      const variables = {
        limit: this.limit,
        offset: offset,
      };
      const response = await firstValueFrom(
        this.graphql.query<{ getPersonasSedes: Personas_sedesDB[] }>(
          query,
          variables,
        ),
      );
      //console.log('Response getPersonasSedes:', response);

      const data =
        response?.getPersonasSedes?.map((p) => ({
          ...p,
          syncStatus: 'synced',
        })) ?? [];

      await this.personas_sedesDataSource.bulkAdd(data);
      if (data.length < this.limit) {
        hasMore = false;
      } else {
        offset += this.limit;
      }
      //console.log(`✅ PersonasSedes cargadas: ${data.length}`);
    }
  }

  async loadPersonaProgramas(): Promise<void> {
    //console.log("llamando personas_programas");
    let offset: number = 0;
    let hasMore: boolean = true;
    await this.personas_programasDataSource.deleteFull();
    while (hasMore) {
      const query = `
      query GetPersonaProgramas($limit: Int!, $offset: Int) {
        getPersonaProgramas(limit: $limit, offset: $offset) {
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
      const variables = { limit: this.limit, offset: offset };

      const response = await firstValueFrom(
        this.graphql.query<{ getPersonaProgramas: Personas_programasDB[] }>(
          query,
          variables,
        ),
      );
      //console.log("personas_programas response:", response);
      const data =
        response?.getPersonaProgramas?.map((p) => ({
          ...p,
          syncStatus: 'synced',
        })) ?? [];

      await this.personas_programasDataSource.bulkAdd(data);
      //console.log(`✅ PersonasProgramas cargadas: ${data.length}`);
      if (data.length < this.limit) {
        hasMore = false;
      } else {
        offset += this.limit;
      }
    }
  }

  async loadPersonasGrupoInteres(): Promise<void> {
    let offset: number = 0;
    let hasMore: boolean = true;
    await this.personas_grupo_interesDataSource.deleteFull();
    while (hasMore) {
      const query = `
     query GetPersonasGrupoInteres($limit: Int!, $offset: Int!) {
        getPersonasGrupoInteres(limit: $limit, offset: $offset) {
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
      const variables = { limit: this.limit, offset: offset };

      const response = await firstValueFrom(
        this.graphql.query<{
          getPersonasGrupoInteres: Personas_grupo_interesDB[];
        }>(query, variables),
      );

      const data =
        response?.getPersonasGrupoInteres?.map((p) => ({
          ...p,
          syncStatus: 'synced',
        })) ?? [];

      await this.personas_grupo_interesDataSource.bulkAdd(data);
      //console.log(`✅ PersonasGrupoInteres cargadas: ${data.length}`);
      if (data.length < this.limit) {
        hasMore = false;
      } else {
        offset += this.limit;
      }
    }
  }

  // ==========================
  // ACTIVIDADES
  // ==========================
  async loadActividadesSede(id_usuario: string): Promise<void> {
    let offset: number = 0;
    const limit: number = this.limit;
    let hasMore: boolean = true;
    await this.actividadesDataSource.deleteFull();

    while (hasMore) {
      const query = `
	      query GetActividadSedes ($id_usuario: ID!, $fecha_inicio: String!, $fecha_fin: String!, $limit: Int!, $offset: Int!  ) {
          getActividadSedes(
            id_usuario: $id_usuario,
            fecha_inicio: $fecha_inicio,
            fecha_fin: $fecha_fin,
            limit : $limit,
            offset: $offset
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
        limit: limit,
        offset: offset,
      };

      const response = await firstValueFrom(
        this.graphql.query<{ getActividadSedes: ActividadesDB[] }>(
          query,
          variables,
        ),
      );
      const data =
        response?.getActividadSedes?.map((a) => ({
          ...a,
          deleted: false,
          syncStatus: 'synced',
        })) ?? [];

      await this.actividadesDataSource.bulkAdd(data);
      if (data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      //console.log("✅ Actividades cargadas:", actividades.length);
    }
  }

  // ==========================
  // ASISTENCIAS POR USUARIO
  // ==========================
  async loadAsistenciasSede(id_usuario: string): Promise<void> {
    let offset: number = 0;
    const limit: number = this.limit;
    let hasMore: boolean = true;
    await this.asistenciasDataSource.deleteFull();
    while (hasMore) {
      const query = `
        query GetAsistenciasSede($idUsuario: String, $fechaInicio: String, $fechaFin: String, $limit: Int!, $offset: Int!) {
            getAsistenciasSede(id_usuario: $idUsuario, fecha_inicio: $fechaInicio, fecha_fin: $fechaFin, limit: $limit, offset: $offset) {
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
        idUsuario: id_usuario,
        fechaInicio: this.haceUnAnio,
        fechaFin: this.hoy,
        limit: this.limit,
        offset: offset,
      };

      const response = await firstValueFrom(
        this.graphql.query<{ getAsistenciasSede: AsistenciasDB[] }>(
          query,
          variables,
        ),
      );

      const data =
        response?.getAsistenciasSede?.map((a) => ({
          ...a,
          deleted: false,
          syncStatus: 'synced',
        })) ?? [];
      if (data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      await this.asistenciasDataSource.bulkAdd(data);
      //console.log(`✅ Asistencias cargadas: ${data.length}`);
    }
  }

  // ==========================
  // SESIONES POR USUARIO
  // ==========================
  async loadSesionesSede(id_usuario: string): Promise<void> {
    //console.log("Cargando SesionesSedes");
    let offset: number = 0;
    const limit: number = this.limit;
    let hasMore: boolean = true;
    await this.sesionesDataSource.deleteFull();
    while (hasMore) {
      const query = `
        query ($id_usuario: ID!, $fecha_inicio: String!, $fecha_fin: String!, $limit:Int!, $offset:Int!) {
          getSesionesSedes(
            id_usuario: $id_usuario,
            fecha_inicio: $fecha_inicio,
            fecha_fin: $fecha_fin,
            limit: $limit,
            offset: $offset
          ) {
            id_sesion
            id_actividad
            fecha_actividad
            hora_inicio
            hora_fin
            imagen
            nro_asistentes
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
        limit: this.limit,
        offset: offset,
      };

      const response = await firstValueFrom(
        this.graphql.query<{ getSesionesSedes: SesionesDB[] }>(
          query,
          variables,
        ),
      );
      //console.log('Respuesta getSesionesSedes:', response);

      const data =
        response?.getSesionesSedes?.map((s) => ({
          ...s,
          deleted: false,
          syncStatus: 'synced',
        })) ?? [];
      //console.log('Sesiones cargadas a indexdb:', data);
      await this.sesionesDataSource.bulkAdd(data);
      if (data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      //console.log(`✅ Sesiones cargadas: ${sesiones.length}`);
    }
  }

  // ==========================
  // ORQUESTADOR DE CARGA
  // ==========================
  cargarDatosIniciales(id_usuario: string): void {
    //console.log("Inicia carga de datos iniciales");
    from(this.ping())
      .pipe(
        // solo seguimos si devuelve "pong"
        filter((p) => p.trim() === 'pong'),
        switchMap(() =>
          // encadenamos todos los métodos como Promises
          from(
            (async () => {
              await this.loadParametrosGenerales();
              await this.loadParametrosDetalle();
              await this.loadPoblaciones();
              await this.loadSedes();
              await this.loadPersonas();
              await this.loadPersonasSedes();
              await this.loadPersonaProgramas();
              //console.log('personasprogramas');
              await this.loadPersonasGrupoInteres();
              //console.log('gruposinteres');
              await this.loadActividadesSede(id_usuario);
              await this.loadSesionesSede(id_usuario);
              await this.loadAsistenciasSede(id_usuario);
              //console.log('fin carga inicial');
            })(),
          ),
        ),
        catchError((err) => {
          console.error('❌ Error en cargarDatosIniciales:', err);
          return of(null);
        }),
      )
      .subscribe();
  }
}
