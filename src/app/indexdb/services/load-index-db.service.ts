import { Injectable } from '@angular/core';

import { GraphQLService } from '../../shared/services/graphql.service';

// Interfaces
import { ActividadesDB } from '../interfaces/actividades.interface';
import { AsistenciasDB } from '../interfaces/asistencias.interface';
import { PersonasDB } from '../interfaces/personas.interface';
import { PersonasGrupoInteresDB } from '../interfaces/personas_grupo_interes.interface';
import { PersonasProgramasDB } from '../interfaces/personas_programas.interface';
import { PersonasSedesDB } from '../interfaces/personas_sedes.interface';
import { PoblacionesDB } from '../interfaces/poblaciones.interface';
import { SedesDB } from '../interfaces/sedes.interface';
import { SesionesDB } from '../interfaces/sesiones.interface';
import { ParametrosGeneralesDB } from '../interfaces/parametros_generales.interface';
import { ParametrosDetalleDB } from '../interfaces/parametros_detalle.interface';
import { ParametrosGeneralesDataSource } from '../datasources/parametros_generales-datasource';
import { ParametrosDetalleDataSource } from '../datasources/parametros_detalle-datasource';
import { PersonasDataSource } from '../datasources/personas-datasource';
import { PoblacionesDataSource } from '../datasources/poblaciones-datasource';
import { SedesDataSource } from '../datasources/sedes-datasource';
import { PersonasSedesDataSource } from '../datasources/personas_sedes-datasource';
import { PersonasProgramasDataSource } from '../datasources/personas_programas-datasource';
import { PersonasGrupoInteresDataSource } from '../datasources/personas_grupo_interes-datasource';
import { ActividadesDataSource } from '../datasources/actividades-datasource';
import { AsistenciasDataSource } from '../datasources/asistencias-datasource';
import { SesionesDataSource } from '../datasources/sesiones-datasource';
import {
  map,
  switchMap,
  filter,
  from,
  of,
  firstValueFrom,
  Observable,
  catchError,
} from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LoadIndexDBService {
  private readonly hoy = new Date(
    new Date().setDate(new Date().getDate() + 180),
  )
    .toISOString()
    .split('T')[0];

  private readonly haceUnAnio = new Date(
    new Date().setDate(new Date().getDate() - 180),
  )
    .toISOString()
    .split('T')[0];
  private readonly limit: number = 2500;

  constructor(
    private readonly graphql: GraphQLService,
    private readonly ParametrosGeneralesDataSource: ParametrosGeneralesDataSource,
    private readonly parametros_detalleDataSource: ParametrosDetalleDataSource,
    private readonly personasDataSource: PersonasDataSource,
    private readonly poblacionesDataSource: PoblacionesDataSource,
    private readonly sedesDataSource: SedesDataSource,
    private readonly PersonasSedesDataSource: PersonasSedesDataSource,
    private readonly PersonasProgramasDataSource: PersonasProgramasDataSource,
    private readonly PersonasGrupoInteresDataSource: PersonasGrupoInteresDataSource,
    private readonly actividadesDataSource: ActividadesDataSource,
    private readonly asistenciasDataSource: AsistenciasDataSource,
    private readonly sesionesDataSource: SesionesDataSource,
  ) {}

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
      this.graphql.query<{ getParametrosGenerales: ParametrosGeneralesDB[] }>(
        query,
      ),
    );

    const parametros =
      response?.getParametrosGenerales?.map((pg) => ({
        ...pg,
        syncStatus: 'synced',
      })) ?? [];

    await this.ParametrosGeneralesDataSource.bulkAdd(parametros);
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
        }
      }
    `;

    const response = await firstValueFrom(
      this.graphql.query<{ getParametrosDetalle: ParametrosDetalleDB[] }>(
        query,
      ),
    );
    const detalles =
      response?.getParametrosDetalle?.map((pd) => ({
        ...pd,
        syncStatus: 'synced',
      })) ?? [];

    await this.parametros_detalleDataSource.bulkAdd(detalles);
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
      this.graphql.query<{ getPoblaciones: PoblacionesDB[] }>(query),
    );

    const poblaciones =
      response?.getPoblaciones?.map((p) => ({
        ...p,
        syncStatus: 'synced',
      })) ?? [];

    await this.poblacionesDataSource.bulkAdd(poblaciones);
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
  }

  async loadPersonasSedes(): Promise<void> {
    let offset: number = 0;
    let hasMore: boolean = true;
    await this.PersonasSedesDataSource.deleteFull();
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
        this.graphql.query<{ getPersonasSedes: PersonasSedesDB[] }>(
          query,
          variables,
        ),
      );

      const data =
        response?.getPersonasSedes?.map((p) => ({
          ...p,
          syncStatus: 'synced',
        })) ?? [];

      await this.PersonasSedesDataSource.bulkAdd(data);
      if (data.length < this.limit) {
        hasMore = false;
      } else {
        offset += this.limit;
      }
      console.log(`✅ PersonasSedes cargadas: ${data.length}`);
    }
  }

  async loadPersonaProgramas(): Promise<void> {
    let offset: number = 0;
    let hasMore: boolean = true;
    await this.PersonasProgramasDataSource.deleteFull();
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
        this.graphql.query<{ getPersonaProgramas: PersonasProgramasDB[] }>(
          query,
          variables,
        ),
      );
      const data =
        response?.getPersonaProgramas?.map((p) => ({
          ...p,
          syncStatus: 'synced',
        })) ?? [];

      await this.PersonasProgramasDataSource.bulkAdd(data);
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
    await this.PersonasGrupoInteresDataSource.deleteFull();
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
          getPersonasGrupoInteres: PersonasGrupoInteresDB[];
        }>(query, variables),
      );

      const data =
        response?.getPersonasGrupoInteres?.map((p) => ({
          ...p,
          syncStatus: 'synced',
        })) ?? [];

      await this.PersonasGrupoInteresDataSource.bulkAdd(data);
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
    }
  }

  // ==========================
  // SESIONES POR USUARIO
  // ==========================
  async loadSesionesSede(id_usuario: string): Promise<void> {
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

      const data =
        response?.getSesionesSedes?.map((s) => ({
          ...s,
          deleted: false,
          syncStatus: 'synced',
        })) ?? [];
      await this.sesionesDataSource.bulkAdd(data);
      if (data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }
  }

  // ==========================
  // ORQUESTADOR DE CARGA
  // ==========================
  cargarDatosIniciales(id_usuario: string): void {
    from(this.ping())
      .pipe(
        // solo seguimos si devuelve "pong"
        filter((p) => p === 'pong'),
        switchMap(() =>
          // encadenamos todos los métodos como Promises
          from(
            (async () => {
              console.log('carga datos iniciales');
              await this.loadParametrosGenerales();
              await this.loadParametrosDetalle();
              await this.loadPoblaciones();
              await this.loadSedes();
              await this.loadPersonas();
              await this.loadPersonasSedes();
              await this.loadPersonaProgramas();
              console.log('personasprogramas');
              await this.loadPersonasGrupoInteres();
              console.log('gruposinteres');
              await this.loadActividadesSede(id_usuario);
              await this.loadSesionesSede(id_usuario);
              await this.loadAsistenciasSede(id_usuario);
              console.log('fin carga inicial');
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
