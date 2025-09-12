export interface Personas {
   id_persona: string;
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
   fecha_nacimiento: Date;
   nombre_acudiente: string;
   apellidos_acudiente: string;
   correo_acudiente: string;
   celular_acudiente: string;
   archivo_habeas_data: string;
   acepta_habeas_data: boolean;
   fecha_habeas_data: Date;
   canal_habeas_data: string;
   soporte_habeas_data: boolean;
   dir_ip_habeas_data: string;
   email: string;
   email_contacto: string;
   telefono_movil_contacto: string;
   telefono_movil: string;
   sede: string |null;
   eliminado: string;
   id_creado_por: string;
   fecha_creacion: Date;
   id_modificado_por: string;
   fecha_modificacion: Date;
   syncStatus: string;

}
