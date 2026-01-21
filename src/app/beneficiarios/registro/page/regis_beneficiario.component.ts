import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  BeneficiariosService,
  PersonaParams,
} from '../services/beneficiarios.service';
import { AuthService } from '../../../shared/services/auth.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-regis-beneficiario',
  standalone: true,
  templateUrl: './regis_beneficicario.component.html',
  styleUrls: ['./regis_beneficicario.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class RegisBeneficiarioComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly beneficiariosService = inject(BeneficiariosService);
  private readonly authService = inject(AuthService);

  usuarioLogueado: { nombre: string; id: string } | null = null;
  sedesLigadas: { id_sede: string; nombre: string }[] = [];
  sedeSeleccionada: { id_sede: string; nombre: string } | null = null;

  beneficiarioForm!: FormGroup;

  idPrograma: string | null = null;
  idGrupoInteres: string | null = null;
  tipoPersonaDefaultId: string | null = null;
  tipoPersonaDefaultNombre = 'Natural';

  get tipoPersonaLabel(): string {
    const current =
      (this.beneficiarioForm?.get('tipoPersona')?.value as string | null) ??
      this.tipoPersonaDefaultId ??
      '';
    return this.nombreTipoPersona(current, this.tipoPersonaDefaultNombre);
  }

  constructor() {
    this.beneficiarioForm = this.fb.group({
      sede: ['', [(control: AbstractControl) => Validators.required(control)]],
      tipoIdentificacion: [
        '',
        [(control: AbstractControl) => Validators.required(control)],
      ],
      tipoPersona: [
        { value: 'Natural', disabled: true },
        [(control: AbstractControl) => Validators.required(control)],
      ],
      identificacion: [
        '',
        [
          (control: AbstractControl) => Validators.required(control),
          (control: AbstractControl) => Validators.maxLength(20)(control),
        ],
      ],
      nombres: [
        '',
        [
          (control: AbstractControl) => Validators.required(control),
          (control: AbstractControl) => Validators.maxLength(30)(control),
        ],
      ],
      apellidos: [
        '',
        [
          (control: AbstractControl) => Validators.required(control),
          (control: AbstractControl) => Validators.maxLength(30)(control),
        ],
      ],
      fechaNacimiento: [
        '',
        [(control: AbstractControl) => Validators.required(control)],
      ],
      sexo: ['', [(control: AbstractControl) => Validators.required(control)]],
      ubicacion: [
        '',
        [(control: AbstractControl) => Validators.required(control)],
      ],
      discapacidad: [''],
      acudienteTipoIdentificacion: [''],
      acudienteIdentificacion: [''],
      acudienteNombres: [''],
      acudienteApellidos: [''],
      acudienteCorreo: [''],
      acudienteCelular: [''],
      habeasArchivo: [null],
      fechaHabeas: [''],
    });
    this.lockFechaHabeasControl();
  }

  private resetEstadoBeneficiarios(): void {
    this.sedeSeleccionada = null;
    this.beneficiarioForm.disable();
    this.ninosSedeActual = [];
    this.ninosFiltrados = [];
    this.lockFechaHabeasControl();
  }

  fechaActual: string = new Date().toISOString().slice(0, 10);

  sedesUsuario: { id_sede: string; nombre: string }[] = [];
  tiposIdentificacion: { id_tipo_identificacion: string; nombre: string }[] =
    [];
  tiposPersona: TipoPersonaOption[] = [];
  sexos: { id_sexo: string; nombre: string }[] = [];
  ubicaciones: { id_ubicacion: string; nombre: string }[] = [];
  paises: { id_pais: string; nombre: string }[] = [];

  ninosSedeActual: PersonaParamsExt[] = [];
  editandoNino: boolean = false;
  ninoEditando: EditandoNino | null = null;

  beneficiariosNuevos: PersonaParamsExt[] = [];
  beneficiariosModificados: PersonaParamsExt[] = [];
  beneficiariosEliminados: string[] = [];

  busquedaBeneficiario: string = '';
  ninosFiltrados: PersonaParamsExt[] = [];

  ngOnInit(): void {
    this.cargarUsuarioYSedes().then(() => {
      this.cargarDatosIniciales();
      this.ninosFiltrados = this.ninosSedeActual;
    });
  }

  /**
   * Llama al backend para obtener el usuario logueado y sus sedes asociadas.
   * Ajusta el endpoint según tu backend real.
   */
  async cargarUsuarioYSedes() {
    try {
      const idUsuario = this.authService.getUserUuid();
      const datosArr =
        await this.beneficiariosService.getPreBeneficiarios(idUsuario);
      const datos = datosArr[0];
      if (!datos) {
        this.resetEstadoBeneficiarios();
        return;
      }

      this.idPrograma = datos.id_programa;
      this.idGrupoInteres = datos.id_grupo_interes ?? null;

      this.usuarioLogueado = {
        nombre: datos.nombre_usuario ?? 'Usuario',
        id: idUsuario,
      };

      this.sedesLigadas = Array.isArray(datos.sedes) ? datos.sedes : [];

      this.sedeSeleccionada = null;
      this.beneficiarioForm.disable();
    } catch (err) {
      console.error('Error al cargar usuario y sedes:', err);
      this.usuarioLogueado = null;
      this.sedesLigadas = [];
      this.sedeSeleccionada = null;
      this.beneficiarioForm.disable();
      this.idPrograma = null;
      this.idGrupoInteres = null;
    }
  }

  async cargarDatosIniciales() {
    const idUsuario = this.usuarioLogueado?.id;
    if (!idUsuario) return;

    try {
      const datosArr =
        await this.beneficiariosService.getPreBeneficiarios(idUsuario);
      const datos = datosArr[0];
      if (!datos) {
        this.resetEstadoBeneficiarios();
        this.idGrupoInteres = null;
        return;
      }

      this.idPrograma = datos.id_programa;
      this.idGrupoInteres = datos.id_grupo_interes ?? null;

      this.sedesUsuario = Array.isArray(datos.sedes) ? datos.sedes : [];
      this.tiposIdentificacion = Array.isArray(datos.tiposIdentificacion)
        ? datos.tiposIdentificacion
        : [];
      this.tiposPersona = Array.isArray(datos.tiposPersona)
        ? datos.tiposPersona
        : [];
      this.sexos = Array.isArray(datos.sexo) ? datos.sexo : [];
      this.ubicaciones = Array.isArray(datos.ubicaciones)
        ? datos.ubicaciones
        : [];
      this.sedesLigadas = Array.isArray(datos.sedes) ? datos.sedes : [];
      this.paises = Array.isArray(datos.paises) ? datos.paises : [];
      this.configurarTipoPersonaDefault();
    } catch (err) {
      console.error('Error al cargar datos iniciales de beneficiarios:', err);
      this.resetEstadoBeneficiarios();
      this.idGrupoInteres = null;
    }
  }

  async onSeleccionarSede(id_sede: string) {
    this.sedeSeleccionada =
      this.sedesLigadas.find((s) => s.id_sede === id_sede) || null;
    if (this.sedeSeleccionada) {
      this.beneficiarioForm.patchValue({ sede: id_sede });
      this.beneficiarioForm.enable();
      this.lockFechaHabeasControl();
      await this.cargarPersonasPorSede(id_sede);
    } else {
      this.beneficiarioForm.patchValue({ sede: '' });
      this.beneficiarioForm.disable();
      this.ninosSedeActual = [];
    }
  }

  async cargarPersonasPorSede(id_sede: string) {
    try {
      if (!this.idPrograma || !this.idGrupoInteres) {
        console.warn('ID de programa o grupo de interés indefinido.');
        this.ninosSedeActual = [];
        this.ninosFiltrados = [];
        return;
      }
      const personas = await this.beneficiariosService.getPersonasParams(
        id_sede,
        this.idPrograma,
        this.idGrupoInteres,
        50,
        0,
      );
      this.ninosSedeActual = personas.map((persona) =>
        this.enrichPersonaForView({ ...persona } as PersonaParamsExt),
      );
      this.filtrarBeneficiarios(this.busquedaBeneficiario);
    } catch {
      this.ninosSedeActual = [];
      this.ninosFiltrados = [];
    }
  }

  editarNino(nino: PersonaParams) {
    const fuente = nino as PersonaParamsExt;
    const discapacidadFlag = this.normalizeDiscapacidadFlag(
      fuente.discapacitado ?? fuente.discapacidad,
    );
    const fechaNacimientoNormalizada = this.formatFechaISO(
      fuente.fechaNacimiento ?? fuente.fecha_nacimiento,
    );
    this.editandoNino = true;
    this.ninoEditando = {
      ...fuente,
      fechaNacimiento: fechaNacimientoNormalizada,
      fecha_nacimiento: fechaNacimientoNormalizada,
      fechaHabeas: this.formatFechaISO(
        fuente.fechaHabeas ?? fuente.fecha_habeas_data,
      ),
      fecha_habeas_data: this.formatFechaISO(
        fuente.fecha_habeas_data ?? fuente.fechaHabeas,
      ),
      discapacitado: discapacidadFlag,
      discapacidad: discapacidadFlag,
      acudienteTipoIdentificacion:
        fuente.acudienteTipoIdentificacion ??
        fuente.id_tipo_identificacion_acudiente ??
        '',
      id_tipo_identificacion_acudiente:
        fuente.id_tipo_identificacion_acudiente ??
        fuente.acudienteTipoIdentificacion ??
        '',
      identificacion_acudiente:
        fuente.identificacion_acudiente ?? fuente.acudienteIdentificacion ?? '',
      acudienteIdentificacion:
        fuente.acudienteIdentificacion ?? fuente.identificacion_acudiente ?? '',
      _originalId: fuente.identificacion,
    } as EditandoNino;
    this.beneficiarioForm.disable();
  }

  onEditarIdentificacion(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Editando identificación:', input.value);
  }

  onKeydownIdentificacion(event: KeyboardEvent) {
    if (
      event.key === 'Enter' ||
      event.key === 'Tab' ||
      event.key === 'Escape'
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  actualizarNino() {
    if (
      !this.ninoEditando ||
      typeof this.ninoEditando !== 'object' ||
      !('identificacion' in this.ninoEditando) ||
      !('_originalId' in this.ninoEditando)
    ) {
      this.editandoNino = false;
      this.ninoEditando = null;
      this.beneficiarioForm.enable();
      return;
    }
    const originalId: string = this.ninoEditando._originalId;
    const idx = this.ninosSedeActual.findIndex(
      (n) => n.identificacion === originalId,
    );
    if (idx !== -1) {
      const base = this.ninoEditando;
      const discapacidadFlag = this.normalizeDiscapacidadFlag(
        base.discapacitado ?? base.discapacidad,
      );
      const fechaNacimientoNormalizada = this.formatFechaISO(
        base.fechaNacimiento ?? base.fecha_nacimiento,
      );
      const fechaHabeasNormalizada = this.formatFechaISO(
        base.fechaHabeas ?? base.fecha_habeas_data,
      );
      const actualizadoNormalizado: PersonaParamsExt = {
        ...base,
        discapacitado: discapacidadFlag,
        discapacidad: discapacidadFlag,
        id_tipo_identificacion_acudiente:
          base.id_tipo_identificacion_acudiente ??
          base.acudienteTipoIdentificacion ??
          '',
        acudienteTipoIdentificacion:
          base.acudienteTipoIdentificacion ??
          base.id_tipo_identificacion_acudiente ??
          '',
        identificacion_acudiente:
          base.identificacion_acudiente ?? base.acudienteIdentificacion ?? '',
        acudienteIdentificacion:
          base.acudienteIdentificacion ?? base.identificacion_acudiente ?? '',
        fecha_nacimiento: fechaNacimientoNormalizada,
        fechaNacimiento: fechaNacimientoNormalizada,
        fecha_habeas_data: fechaHabeasNormalizada,
        fechaHabeas: fechaHabeasNormalizada,
      };
      const enriquecido = this.enrichPersonaForView({
        ...actualizadoNormalizado,
      });
      this.ninosSedeActual[idx] = enriquecido;

      const nuevoIdx = this.beneficiariosNuevos.findIndex(
        (n) => n.id_persona === actualizadoNormalizado.id_persona,
      );
      if (nuevoIdx !== -1) {
        this.beneficiariosNuevos[nuevoIdx] = { ...actualizadoNormalizado };
      } else {
        this.upsertBeneficiarioModificado({ ...actualizadoNormalizado });
      }
    }
    this.editandoNino = false;
    this.ninoEditando = null;
    this.beneficiarioForm.enable();
    this.filtrarBeneficiarios(this.busquedaBeneficiario);
  }

  cancelarEdicion() {
    this.editandoNino = false;
    this.ninoEditando = null;
    this.beneficiarioForm.enable();
    this.lockFechaHabeasControl();
  }

  editarHabeasData() {
    alert('Editar Habeas Data');
  }

  habeasData() {
    alert('Información de Habeas Data');
  }

  onHabeasFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      if (this.editandoNino && this.ninoEditando) {
        this.ninoEditando.habeasArchivo = null;
        this.ninoEditando.archivo_habeas_data = '';
        this.ninoEditando.fechaHabeas = '';
        this.ninoEditando.fecha_habeas_data = '';
      } else {
        this.beneficiarioForm.patchValue({ habeasArchivo: null });
        this.updateFechaHabeasControl('');
      }
      if (input) input.value = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      input.value = '';
      return;
    }

    const base64 = await this.readFileAsBase64(file);
    const fecha = new Date().toISOString().slice(0, 10);

    if (this.editandoNino && this.ninoEditando) {
      this.ninoEditando.habeasArchivo = base64;
      this.ninoEditando.archivo_habeas_data = base64;
      this.ninoEditando.fechaHabeas = fecha;
      this.ninoEditando.fecha_habeas_data = fecha;
    } else {
      this.beneficiarioForm.patchValue({ habeasArchivo: base64 });
      this.updateFechaHabeasControl(fecha);
    }
  };

  agregarBeneficiario() {
    if (this.beneficiarioForm.valid) {
      if (this.tipoPersonaDefaultId) {
        this.beneficiarioForm.patchValue(
          { tipoPersona: this.tipoPersonaDefaultId },
          { emitEvent: false },
        );
      }
      const base = this.mapFormToPersonaParams(
        this.beneficiarioForm.getRawValue(),
      );
      this.beneficiariosNuevos.push(base);
      this.ninosSedeActual.push(this.enrichPersonaForView({ ...base }));
      this.filtrarBeneficiarios(this.busquedaBeneficiario);
      this.beneficiarioForm.reset();
      this.updateFechaHabeasControl('');
      this.beneficiarioForm.patchValue({
        tipoPersona: this.tipoPersonaDefaultId ?? '',
        sede: this.sedeSeleccionada?.id_sede ?? '',
      });
    }
  }

  eliminarBeneficiario(index: number) {
    const beneficiario = this.ninosSedeActual[index];
    if (!beneficiario) return;

    const id = beneficiario.id_persona;
    const esNuevo =
      !!id && this.beneficiariosNuevos.some((n) => n.id_persona === id);

    if (esNuevo) {
      this.beneficiariosNuevos = this.beneficiariosNuevos.filter(
        (n) => n.id_persona !== id,
      );
    } else if (id) {
      this.beneficiariosEliminados = [
        ...this.beneficiariosEliminados.filter((item) => item !== id),
        id,
      ];
    }

    this.beneficiariosModificados = this.beneficiariosModificados.filter(
      (n) => n.id_persona !== id,
    );

    if (
      this.editandoNino &&
      this.ninoEditando?._originalId === beneficiario.identificacion
    ) {
      this.cancelarEdicion();
    }

    this.ninosSedeActual.splice(index, 1);
    this.filtrarBeneficiarios(this.busquedaBeneficiario);
  }

  eliminarBeneficiarioPorPersona(beneficiario: PersonaParamsExt): void {
    const index = this.ninosSedeActual.findIndex(
      (n) =>
        n.id_persona === beneficiario.id_persona ||
        n.identificacion === beneficiario.identificacion,
    );
    if (index !== -1) {
      this.eliminarBeneficiario(index);
    }
  }

  async guardarCambiosBeneficiarios(): Promise<void> {
    if (!this.idPrograma || !this.idGrupoInteres) {
      console.error('No hay id_programa o id_grupo_interes definidos.');
      return;
    }
    const cambios = {
      nuevos: this.beneficiariosNuevos.map((p) => this.mapToPersonaInput(p)),
      modificados: this.beneficiariosModificados.map((p) =>
        this.mapToPersonaInput(p),
      ),
      eliminados: this.beneficiariosEliminados.filter(
        (id): id is string => typeof id === 'string' && id.trim() !== '',
      ),
    };
    const payload = {
      id_programa: this.idPrograma,
      id_grupo_interes: this.idGrupoInteres,
      ...cambios,
    };
    try {
      console.log('[Guardar Beneficiarios] Payload:', payload);
      await this.beneficiariosService.guardarCambiosBeneficiarios(payload);
      this.beneficiariosNuevos = [];
      this.beneficiariosModificados = [];
      this.beneficiariosEliminados = [];
    } catch (error) {
      console.error('Error al guardar beneficiarios:', error);
    }
  }

  // 🔽 Refactor: elimina duplicidad en filtrarBeneficiarios
  filtrarBeneficiarios(valor: string) {
    const filtro = valor.trim().toLowerCase();
    if (!filtro) {
      this.ninosFiltrados = this.ninosSedeActual;
      return;
    }
    this.ninosFiltrados = this.ninosSedeActual.filter((n) =>
      ['nombres', 'apellidos', 'identificacion'].some(
        (campo) =>
          n[campo as keyof PersonaParams]?.toLowerCase().includes(filtro) ??
          false,
      ),
    );
  }

  onBuscarBeneficiario(valor: string) {
    this.busquedaBeneficiario = valor;
    this.filtrarBeneficiarios(valor);
  }

  // Utilidad para mapear el formulario a PersonaParamsExt (evita duplicidad)
  private mapFormToPersonaParams(form: unknown): PersonaParamsExt {
    const f = form as Record<string, unknown>;
    const controlValor =
      typeof f['tipoPersona'] === 'string' ? f['tipoPersona'] : '';
    const tipoPersonaId = this.resolveIdTipoPersona(controlValor);
    const tipoPersonaNombre = this.nombreTipoPersona(
      tipoPersonaId,
      this.tipoPersonaDefaultNombre,
    );
    const rawId =
      typeof f['id_persona'] === 'string' && f['id_persona'].trim()
        ? f['id_persona'].trim()
        : uuidv4();
    const rawSedeControl =
      typeof f['sede'] === 'string' ? f['sede'].trim() : '';
    const resolvedSede = rawSedeControl || this.sedeSeleccionada?.id_sede || '';
    const defaultPaisId = this.defaultPaisId ?? '';
    const discapacidadValor =
      this.normalizeFlagString(f['discapacidad']) ?? 'NO';
    const fechaNacimientoNormalizada = this.formatFechaISO(
      f['fechaNacimiento'],
    );
    const fechaHabeasNormalizada = this.formatFechaISO(f['fechaHabeas']);

    return {
      id_persona: rawId,
      id_tipo_persona: tipoPersonaId,
      id_colegio: '',
      id_sexo: (f['sexo'] as string) ?? '',
      id_ubicacion: (f['ubicacion'] as string) ?? '',
      id_pais: defaultPaisId,
      id_departamento: '',
      id_ciudad: '',
      id_tipo_identificacion: (f['tipoIdentificacion'] as string) ?? '',
      identificacion: (f['identificacion'] as string) ?? '',
      nombres: (f['nombres'] as string) ?? '',
      apellidos: (f['apellidos'] as string) ?? '',
      razon_social: '',
      fecha_nacimiento: fechaNacimientoNormalizada,
      nombre_acudiente: (f['acudienteNombres'] as string) ?? '',
      apellidos_acudiente: (f['acudienteApellidos'] as string) ?? '',
      correo_acudiente: (f['acudienteCorreo'] as string) ?? '',
      celular_acudiente: (f['acudienteCelular'] as string) ?? '',
      archivo_habeas_data:
        typeof f['habeasArchivo'] === 'string' ? f['habeasArchivo'] : '',
      acepta_habeas_data: '',
      fecha_habeas_data: fechaHabeasNormalizada,
      canal_habeas_data: '',
      soporte_habeas_data: '',
      dir_ip_habeas_data: '',
      email: '',
      email_contacto: '',
      telefono_movil_contacto: '',
      telefono_movil: '',
      eliminado: '',
      id_creado_por: this.usuarioLogueado?.id ?? '',
      fecha_creacion: '',
      id_modificado_por: '',
      fecha_modificacion: '',
      id_tipo_identificacion_acudiente:
        (f['acudienteTipoIdentificacion'] as string) ?? '',
      identificacion_acudiente: (f['acudienteIdentificacion'] as string) ?? '',
      id_sede: resolvedSede,
      estado: '',
      r: '',
      habeasArchivo: (f['habeasArchivo'] as File | null) ?? null,
      fechaHabeas: fechaHabeasNormalizada,
      tipoPersona: tipoPersonaNombre,
      fechaNacimiento: fechaNacimientoNormalizada,
      discapacidad: discapacidadValor,
      discapacitado: discapacidadValor,
      acudienteTipoIdentificacion:
        (f['acudienteTipoIdentificacion'] as string) ?? '',
      acudienteIdentificacion: (f['acudienteIdentificacion'] as string) ?? '',
      acudienteNombres: (f['acudienteNombres'] as string) ?? '',
      acudienteApellidos: (f['acudienteApellidos'] as string) ?? '',
      acudienteCorreo: (f['acudienteCorreo'] as string) ?? '',
      acudienteCelular: (f['acudienteCelular'] as string) ?? '',
    };
  }

  private getNombre<T extends Record<string, unknown>>(
    lista: T[] | undefined,
    id: string | number | null | undefined,
    idKey: keyof T,
    nombreKey: keyof T,
  ): string {
    if (!lista || id == null) return '';
    const target = String(id);
    const encontrado = lista.find((item) => {
      const valor = item[idKey];
      // Solo compara si valor es string o number, nunca objeto
      if (typeof valor === 'string' || typeof valor === 'number') {
        return String(valor) === target;
      }
      return false;
    });
    const nombre = encontrado?.[nombreKey];
    if (typeof nombre === 'string') {
      return nombre;
    }
    if (typeof nombre === 'number' || typeof nombre === 'boolean') {
      return String(nombre);
    }
    // Evita stringificar objetos, retorna vacío si no es string/number/boolean
    return '';
  }

  private enrichPersonaForView(persona: PersonaParamsExt): PersonaParamsExt {
    const record = this.asRecord(persona);
    const discapacidadFuenteCruda =
      persona.discapacidad ??
      persona.discapacitado ??
      record['persona_con_discapacidad'] ??
      record['es_discapacitado'] ??
      record['posee_discapacidad'];
    const discapacidadFlag = this.normalizeDiscapacidadFlag(
      discapacidadFuenteCruda,
    );
    const idTipoIdentAcudiente =
      persona.id_tipo_identificacion_acudiente ??
      this.getStringField(record, 'acudienteTipoIdentificacion') ??
      '';
    const acudienteTipoNombre =
      this.getNombre(
        this.tiposIdentificacion,
        idTipoIdentAcudiente,
        'id_tipo_identificacion',
        'nombre',
      ) || idTipoIdentAcudiente;
    const acudienteIdentRaw =
      persona.identificacion_acudiente ??
      persona.acudienteIdentificacion ??
      this.getStringField(record, 'identificacion_acudiente') ??
      '';
    const acudienteIdentStr =
      acudienteIdentRaw != null ? String(acudienteIdentRaw) : '';

    const fechaNacimientoRaw =
      persona.fechaNacimiento ?? persona.fecha_nacimiento;
    const fechaNormalizada = this.formatFechaISO(fechaNacimientoRaw);
    const fechaHabeasNormalizada = this.formatFechaISO(
      persona.fecha_habeas_data ??
        persona.fechaHabeas ??
        record['fechaHabeas'] ??
        record['fecha_habeas_data'] ??
        '',
    );

    return {
      ...persona,
      sede: this.getNombre(
        this.sedesUsuario,
        persona.id_sede,
        'id_sede',
        'nombre',
      ),
      tipoIdentificacion: this.getNombre(
        this.tiposIdentificacion,
        persona.id_tipo_identificacion,
        'id_tipo_identificacion',
        'nombre',
      ),
      tipoPersona: this.nombreTipoPersona(
        persona.id_tipo_persona,
        persona.tipoPersona ?? this.tipoPersonaDefaultNombre,
      ),
      fechaNacimiento: fechaNormalizada,
      fecha_nacimiento: fechaNormalizada,
      sexo: this.getNombre(this.sexos, persona.id_sexo, 'id_sexo', 'nombre'),
      ubicacion: this.getNombre(
        this.ubicaciones,
        persona.id_ubicacion,
        'id_ubicacion',
        'nombre',
      ),
      discapacidad: this.formatDiscapacidad(discapacidadFlag),
      discapacitado: discapacidadFlag ?? persona.discapacitado ?? '',
      acudienteTipoIdentificacion: acudienteTipoNombre,
      acudienteIdentificacion: acudienteIdentStr,
      acudienteNombres:
        persona.nombre_acudiente ?? persona.acudienteNombres ?? '',
      acudienteApellidos:
        persona.apellidos_acudiente ?? persona.acudienteApellidos ?? '',
      acudienteCorreo:
        persona.correo_acudiente ?? persona.acudienteCorreo ?? '',
      acudienteCelular:
        persona.celular_acudiente ?? persona.acudienteCelular ?? '',
      identificacion_acudiente: acudienteIdentStr,
      fechaHabeas: fechaHabeasNormalizada,
      fecha_habeas_data: fechaHabeasNormalizada,
      habeasArchivo:
        persona.archivo_habeas_data ?? persona.habeasArchivo ?? null,
    };
  }

  private mapToPersonaInput(
    persona: PersonaParamsExt,
  ): Record<string, unknown> {
    const fechaNacimientoNormalizada = this.formatFechaISO(
      persona.fecha_nacimiento ?? persona.fechaNacimiento,
    );
    const fechaHabeasNormalizada = this.formatFechaISO(
      persona.fecha_habeas_data ?? persona.fechaHabeas,
    );
    const payload: Record<string, unknown> = {
      id_persona: persona.id_persona || uuidv4(),
      id_tipo_persona: persona.id_tipo_persona ?? null,
      id_colegio: persona.id_colegio || null,
      id_sexo: persona.id_sexo || null,
      id_ubicacion: persona.id_ubicacion || null,
      id_pais: persona.id_pais || this.defaultPaisId || null,
      id_departamento: persona.id_departamento || null,
      id_ciudad: persona.id_ciudad || null,
      id_tipo_identificacion: persona.id_tipo_identificacion || null,
      identificacion: persona.identificacion ?? '',
      nombres: persona.nombres ?? '',
      apellidos: persona.apellidos ?? '',
      fecha_nacimiento: fechaNacimientoNormalizada || null,
      nombre_acudiente: persona.nombre_acudiente || null,
      apellidos_acudiente: persona.apellidos_acudiente || null,
      correo_acudiente: persona.correo_acudiente || null,
      celular_acudiente: persona.celular_acudiente || null,
      id_tipo_identificacion_acudiente:
        persona.id_tipo_identificacion_acudiente ||
        persona.acudienteTipoIdentificacion ||
        null,
      identificacion_acudiente:
        persona.identificacion_acudiente ||
        persona.acudienteIdentificacion ||
        null,
      archivo_habeas_data:
        persona.archivo_habeas_data || persona.habeasArchivo || null,
      acepta_habeas_data: this.toBoolean(persona.acepta_habeas_data),
      fecha_habeas_data: fechaHabeasNormalizada || null,
      canal_habeas_data: persona.canal_habeas_data || null,
      soporte_habeas_data: this.toBoolean(persona.soporte_habeas_data),
      dir_ip_habeas_data: persona.dir_ip_habeas_data || null,
      email: persona.email || null,
      email_contacto: persona.email_contacto || null,
      telefono_movil_contacto: persona.telefono_movil_contacto || null,
      telefono_movil: persona.telefono_movil || null,
      eliminado: this.toFlag(persona.eliminado),
      id_sede:
        persona.id_sede ||
        this.beneficiarioForm.get('sede')?.value ||
        this.sedeSeleccionada?.id_sede ||
        null,
      discapacitado: persona.discapacitado ?? persona.discapacidad ?? null,
    };

    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );
  }

  private toFlag(value: unknown): 'S' | 'N' {
    const normalized = this.normalizeFlagString(value);
    if (normalized === 'SI') return 'S';
    if (normalized === 'NO') return 'N';
    return 'N';
  }

  private toBoolean(value: unknown): boolean {
    const normalized = this.normalizeFlagString(value);
    return normalized === 'SI';
  }

  private formatDiscapacidad(value: unknown): string {
    const normalized = this.normalizeFlagString(value);
    if (normalized === 'SI') return 'Sí';
    if (normalized === 'NO') return 'No';
    return 'No';
  }

  private formatFechaISO(value: unknown): string {
    if (value == null) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'number' && !Number.isNaN(value)) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      if (/^\d+$/.test(trimmed)) {
        const date = new Date(Number(trimmed));
        return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
      }
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
    }
    return '';
  }

  private normalizeDiscapacidadFlag(value: unknown): 'SI' | 'NO' | '' {
    const normalized = this.normalizeFlagString(value);
    return normalized ?? '';
  }

  private configurarTipoPersonaDefault(): void {
    if (!Array.isArray(this.tiposPersona) || this.tiposPersona.length === 0) {
      return;
    }
    const natural = this.tiposPersona.find((t) =>
      (t.nombre ?? '').toLowerCase().includes('natural'),
    );
    const fallback = this.tiposPersona[0];
    // Asegura que nunca se asigne undefined, solo string o null
    const id =
      natural?.id_tipo_persona ??
      natural?.id_tipo_identificacion ??
      fallback?.id_tipo_persona ??
      fallback?.id_tipo_identificacion ??
      null;
    this.tipoPersonaDefaultId = id ?? null;
    this.tipoPersonaDefaultNombre =
      natural?.nombre ?? fallback?.nombre ?? this.tipoPersonaDefaultNombre;
    if (this.tipoPersonaDefaultId) {
      this.beneficiarioForm.patchValue(
        { tipoPersona: this.tipoPersonaDefaultId },
        { emitEvent: false },
      );
    }
  }

  nombreTipoPersona(id: string | null | undefined, fallback?: string): string {
    if (!id) {
      return fallback ?? this.tipoPersonaDefaultNombre;
    }
    const found = this.tiposPersona.find(
      (t) => (t.id_tipo_persona ?? t.id_tipo_identificacion) === id,
    );
    return found?.nombre ?? fallback ?? this.tipoPersonaDefaultNombre;
  }

  private get defaultPaisId(): string | null {
    return this.paises?.[0]?.id_pais ?? null;
  }

  private normalizeFlagString(value: unknown): 'SI' | 'NO' | null {
    if (value == null) return null;
    if (typeof value === 'boolean') {
      return value ? 'SI' : 'NO';
    }
    if (typeof value === 'number') {
      if (value === 1) return 'SI';
      if (value === 0) return 'NO';
    }
    if (typeof value === 'string') {
      const normalized = value
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replaceAll('\u0300', '') // reemplaza todos los acentos
        .replaceAll('\u036f', '');
      if (!normalized) return null;
      if (['SI', 'S', 'YES', 'TRUE', '1'].includes(normalized)) return 'SI';
      if (['NO', 'N', 'FALSE', '0'].includes(normalized)) return 'NO';
    }
    return null;
  }

  private upsertBeneficiarioModificado(persona: PersonaParamsExt): void {
    const idx = this.beneficiariosModificados.findIndex(
      (item) => item.id_persona === persona.id_persona,
    );
    if (idx === -1) {
      this.beneficiariosModificados.push(persona);
    } else {
      this.beneficiariosModificados[idx] = persona;
    }
  }

  private resolveIdTipoPersona(valor: string | undefined): string {
    if (!valor) {
      return this.tipoPersonaDefaultId ?? '';
    }
    const matchById = this.tiposPersona.find(
      (t) => (t.id_tipo_persona ?? t.id_tipo_identificacion) === valor,
    );
    if (matchById) {
      return (
        matchById.id_tipo_persona ??
        matchById.id_tipo_identificacion ??
        this.tipoPersonaDefaultId ??
        valor ??
        ''
      );
    }
    const normalized = valor.trim().toLowerCase();
    const matchByName = this.tiposPersona.find(
      (t) => (t.nombre ?? '').trim().toLowerCase() === normalized,
    );
    if (matchByName) {
      return (
        matchByName.id_tipo_persona ??
        matchByName.id_tipo_identificacion ??
        this.tipoPersonaDefaultId ??
        valor ??
        ''
      );
    }
    // Siempre retorna string, nunca undefined ni null
    return this.tipoPersonaDefaultId ?? valor ?? '';
  }

  soloNumeros(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (input) {
      input.value = input.value.replaceAll(/\D/g, '');
    }
  }

  private lockFechaHabeasControl(): void {
    const control = this.beneficiarioForm.get('fechaHabeas');
    if (!control) return;
    if (!control.disabled) {
      control.disable({ emitEvent: false });
    }
  }

  private updateFechaHabeasControl(value: string | null): void {
    const control = this.beneficiarioForm.get('fechaHabeas');
    if (!control) return;
    control.setValue(value ?? '', { emitEvent: false });
    this.lockFechaHabeasControl();
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const [, base64] = result.split(',');
          resolve(base64 ?? '');
        } else {
          resolve('');
        }
      };
      reader.onerror = () =>
        reject(reader.error ?? new Error('Error al leer el archivo PDF'));
      reader.readAsDataURL(file);
    });
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  }

  private getStringField(
    record: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = record[key];
    return typeof value === 'string' ? value : undefined;
  }
}

interface PersonaParamsExt extends PersonaParams {
  habeasArchivo?: File | string | null;
  fechaHabeas?: string;
  tipoPersona?: string;
  fechaNacimiento?: string;
  discapacidad?: string;
  discapacitado?: string;
  sede?: string;
  tipoIdentificacion?: string;
  sexo?: string;
  ubicacion?: string;
  acudienteTipoIdentificacion?: string;
  acudienteIdentificacion?: string;
  acudienteNombres?: string;
  acudienteApellidos?: string;
  acudienteCorreo?: string;
  acudienteCelular?: string;
}

interface EditandoNino extends PersonaParamsExt {
  _originalId: string;
}

interface TipoPersonaOption {
  id_tipo_persona?: string;
  id_tipo_identificacion?: string;
  nombre: string;
}
