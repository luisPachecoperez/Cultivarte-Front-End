import { indexDB } from '../services/database.service';
import { PersonasDB } from '../interfaces/personas.interface';
import { Injectable } from '@angular/core';
import { Aliados } from '../../eventos/interfaces/lista-aliados.interface';

@Injectable({
  providedIn: 'root',
})
export class PersonasDataSource {
  async getAll(): Promise<PersonasDB[]> {
    return await indexDB.personas.toArray();
  }

  async getById(id: string): Promise<PersonasDB | undefined> {
    return await indexDB.personas.get(id);
  }

  async bulkAdd(data: PersonasDB[]): Promise<void> {
    const withSyncStatus = data.map((item) => ({
      ...item,
      syncStatus: item.syncStatus ?? 'synced',
    }));
    await indexDB.personas.bulkAdd(withSyncStatus);
  }

  async deleteFull(): Promise<void> {
    await indexDB.personas.clear();
  }

  async getAliados(idUsuario: string): Promise<Aliados[]> {
    // 1. Buscar las sedes del usuario
    const sedesUsuario = await indexDB.personas_sedes
      .where('id_persona')
      .equals(idUsuario)
      .toArray();

    const idsSedesUsuario: string[] = sedesUsuario.map((s) => s.id_sede);
    //console.log("sedes del usuario para buscar aliado:",idsSedesUsuario);
    // 2. Ubicar el grupo de interés "ALIADO_CULTIVARTE"
    const paramGeneralGrupoInteres = await indexDB.parametros_generales
      .where('nombre_parametro')
      .equals('GRUPOS_INTERES_CULTIVARTE')
      .first();
    //console.log("Grupo deinteres cultivarte:",paramGeneralGrupoInteres);
    if (!paramGeneralGrupoInteres) {
      console.warn(
        '❌ No se encontró el parámetro GRUPOS_INTERES_CULTIVARTE en parametros_generales',
      );
      return [];
    }

    const paramAliadoCultivarte = await indexDB.parametros_detalle
      .where('id_parametro_general')
      .equals(paramGeneralGrupoInteres.id_parametro_general)
      .filter((pd) => pd.nombre.toUpperCase() === 'ALIADO_CULTIVARTE')
      .first();
    //console.log("grupo-interes-aliado-cultivarte:",paramAliadoCultivarte)
    if (!paramAliadoCultivarte) {
      console.warn(
        '❌ No se encontró detalle "ALIADO_CULTIVARTE" en parametros_detalle',
      );
      return [];
    }

    // 3. Personas en personas_grupo_interes que sean Aliados
    const personasGrupoInteres = await indexDB.personas_grupo_interes
      .where('id_grupo_interes')
      .equals(paramAliadoCultivarte.id_parametro_detalle)
      .toArray();
    //console.log('Personas Grupo Interes Aliados:', personasGrupoInteres);
    const idsPersonasAliados = personasGrupoInteres.map(
      (pgi) => pgi.id_persona,
    );
    //console.log("1- id de aliados:",idsPersonasAliados);

    // 4. Buscar personas aliadas
    const aliados = await indexDB.personas
      .where('id_persona')
      .anyOf(idsPersonasAliados)
      .toArray();
    //console.log("2- personas que son aliados:",aliados);
    // 5. Si el usuario no tiene sedes → devolver todos los aliados
    if (idsSedesUsuario.length === 0) {
      return aliados.map((a) => ({
        id_aliado: a.id_persona,
        nombre:
          `${a.nombres ?? ''} ${a.apellidos ?? ''}`.trim() || a.razon_social,
      }));
    }

    // 6. Filtrar personas por sedes
    const personasSedesAliados = await indexDB.personas_sedes
      .where('id_persona')
      .anyOf(idsPersonasAliados)
      .and((ps) => idsSedesUsuario.includes(ps.id_sede))
      .toArray();
    //console.log("Nro. de aliados de la sede:",personasSedesAliados.length);

    const aliadosFiltrados = aliados.filter((a) =>
      personasSedesAliados.some(
        (ps) =>
          ps.id_persona === a.id_persona &&
          idsSedesUsuario.includes(ps.id_sede),
      ),
    );
    return aliadosFiltrados.map((a) => ({
      id_aliado: a.id_persona,
      nombre:
        `${a.nombres ?? ''} ${a.apellidos ?? ''}`.trim() || a.razon_social,
    }));
  }
}
