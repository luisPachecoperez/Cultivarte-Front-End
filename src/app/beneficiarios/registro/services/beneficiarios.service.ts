import { Injectable, inject } from '@angular/core';
import { GraphQLService } from '../../../shared/services/graphql.service';
import { firstValueFrom } from 'rxjs';

export interface PreBeneficiariosResponse {
  id_programa: string;
  id_grupo_interes: string;
  paises: { id_pais: string; nombre: string }[];
  sedes: { id_sede: string; nombre: string }[];
  tiposIdentificacion: { id_tipo_identificacion: string; nombre: string }[];
  tiposPersona: {
    id_tipo_persona?: string;
    id_tipo_identificacion?: string;
    nombre: string;
  }[];
  sexo: { id_sexo: string; nombre: string }[];
  ubicaciones: { id_ubicacion: string; nombre: string }[];
  nombre_usuario?: string;
}

export interface PersonaParams {
  id_persona: string;
  id_sede: string;
  id_tipo_persona: string;
  id_colegio: string;
  id_sexo: string;
  id_ubicacion: string;
  id_pais: string;
  id_departamento: string;
  id_ciudad: string;
  id_tipo_identificacion: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  razon_social: string;
  fecha_nacimiento: string;
  nombre_acudiente: string;
  apellidos_acudiente: string;
  correo_acudiente: string;
  celular_acudiente: string;
  archivo_habeas_data: string;
  acepta_habeas_data: string;
  fecha_habeas_data: string;
  canal_habeas_data: string;
  soporte_habeas_data: string;
  dir_ip_habeas_data: string;
  email: string;
  email_contacto: string;
  telefono_movil_contacto: string;
  telefono_movil: string;
  r: string;
  id_creado_por: string;
  fecha_creacion: string;
  id_modificado_por: string;
  fecha_modificacion: string;
  estado: string;
  // Campos adicionales para acudiente
  id_tipo_identificacion_acudiente: string;
  identificacion_acudiente: string;
  // Campo para borrado lógico
  eliminado: string;
  discapacitado?: string;
}

@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
  private readonly graphqlService = inject(GraphQLService);

  private readonly GET_PRE_BENEFICIARIOS = `
    query getPreBeneficiarios($idUsuario: ID!) {
      getPreBeneficiarios(id_usuario: $idUsuario) {
        id_programa
        id_grupo_interes
        paises { id_pais nombre }
        sedes { id_sede nombre }
        tiposIdentificacion { id_tipo_identificacion nombre }
        tiposPersona { id_tipo_persona nombre }
        sexo { id_sexo nombre }
        ubicaciones { id_ubicacion nombre }
      }
    }
  `;

  private readonly GET_PERSONAS_PARAMS = `
    query GetPersonasParams(
      $id_sede: ID!,
      $id_programa: ID!,
      $id_grupo_interes: ID!,
      $limit: Int!,
      $offset: Int!
    ) {
      getPersonasParams(
        id_sede: $id_sede,
        id_programa: $id_programa,
        id_grupo_interes: $id_grupo_interes,
        limit: $limit,
        offset: $offset
      ) {
        id_persona
        id_sede
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
        id_creado_por
        fecha_creacion
        id_modificado_por
        fecha_modificacion
        estado
        id_tipo_identificacion_acudiente
        identificacion_acudiente
        discapacitado
      }
    }
  `;

  private readonly GUARDAR_CAMBIOS_BENEFICIARIOS = `
    mutation UpdateBeneficiarios($input: EditarBeneficiarios!) {
      updateBeneficiarios(input: $input) {
        exitoso
        mensaje
      }
    }
  `;

  async getPreBeneficiarios(
    idUsuario: string,
  ): Promise<PreBeneficiariosResponse[]> {
    console.log('[GraphQL] getPreBeneficiarios variables:', {
      idUsuario,
      query: this.GET_PRE_BENEFICIARIOS,
    });
    const response = await firstValueFrom(
      this.graphqlService.query<{
        getPreBeneficiarios:
          | PreBeneficiariosResponse
          | PreBeneficiariosResponse[];
      }>(this.GET_PRE_BENEFICIARIOS, { idUsuario }),
    );
    console.log('[GraphQL] getPreBeneficiarios response:', response);
    const data = response.getPreBeneficiarios;
    return Array.isArray(data) ? data : [data];
  }

  async getPersonasParams(
    id_sede: string,
    id_programa: string,
    id_grupo_interes: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PersonaParams[]> {
    const variables = {
      id_sede,
      id_programa,
      id_grupo_interes,
      limit,
      offset,
    };
    console.log('[GraphQL] getPersonasParams variables:', variables);
    const response = await firstValueFrom(
      this.graphqlService.query<{ getPersonasParams: PersonaParams[] }>(
        this.GET_PERSONAS_PARAMS,
        variables,
      ),
    );
    console.log('[GraphQL] getPersonasParams response:', response);
    return response.getPersonasParams;
  }

  async guardarCambiosBeneficiarios(payload: {
    id_programa: string;
    id_grupo_interes: string;
    nuevos: Record<string, unknown>[];
    modificados: Record<string, unknown>[];
    eliminados: string[];
  }): Promise<any> {
    console.log('[GraphQL] guardarCambiosBeneficiarios payload:', payload);
    const response = await firstValueFrom(
      this.graphqlService.mutation<{ updateBeneficiarios: any }>(
        this.GUARDAR_CAMBIOS_BENEFICIARIOS,
        { input: payload },
      ),
    );
    console.log('[GraphQL] guardarCambiosBeneficiarios response:', response);
    return response.updateBeneficiarios;
  }
}
