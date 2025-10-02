export interface SedesDB {
  id_sede: string;
  id_pais: string | null;
  id_departamento: string | null;
  id_ciudad: string | null;
  id_regional_davivienda: string | null;
  id_regional_seguros_bolivar: string | null;
  id_tipo_inmueble: string | null;
  id_espacio: string | null;
  id_uso_inmueble: string | null;
  id_nivel_inmueble: string | null;
  id_condicion_urbana: string | null;
  id_clima: string | null;
  id_condicion_inmueble: string | null;
  nombre: string;
  numero_convenio: string | null;
  fecha_apertura_sede: string | null;
  matricula_inmobiliaria: string | null;
  id_creado_por: string | null;
  fecha_creacion: string | null;
  id_modificado_por: string | null;
  fecha_modificacion: string | null;
  syncStatus: string | null;
}
