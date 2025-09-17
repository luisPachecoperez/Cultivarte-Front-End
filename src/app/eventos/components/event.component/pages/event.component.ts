import { GridSesionesComponent } from './../../grid-sesiones.component/pages/grid-sesiones.component';
import {
  Component,
  input,
  OnInit,
  output,
  SimpleChanges,
  OnChanges,
  effect,
  inject,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
  FormArray
} from '@angular/forms';
import { EventService } from '../services/event.services';
import { GridSesionesService } from '../../grid-sesiones.component/services/grid-sesiones.services';
import { AuthService } from '../../../../shared/services/auth.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { EventoFormulario, CambiosSesionesSnapshot, CambiosSesionesPayload, Sede, TipoActividad, Aliado, NombreEvento, Frecuencia, EventoFiltrado, Responsable, AliadoFiltrado, ConfiguracionEvento, EventoBackendResponse, SesionBackend, SesionFormulario, EventoPrecargado, EventoFormValue, SesionBasica, CambiosSesiones} from '../interfaces/event.interface';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GridSesionesComponent, MatSnackBarModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventComponent implements OnInit, OnChanges {
  // Inputs convertidos a señales
  eventoSeleccionado = input<EventoFormulario | null>(null);
  fechaPreseleccionada = input<string | null>(null);
  mostrarFormulario = input<boolean>(false);

  private _fechaPreseleccionada: string | null = null;
  actualizarSesionEnCalendario!: (evento: EventoFormulario) => void;

  /** 🔹 Guardamos el snapshot del grid */
  private cambiosSesionesSnapshot: CambiosSesionesSnapshot = {
    nuevos: [],
    modificados: [],
    eliminados: []
  };

  // Inyectamos con funciones
private fb = inject(FormBuilder);
private eventService = inject(EventService);
private gridSesionesService = inject(GridSesionesService);
private authService = inject(AuthService);
private snack = inject(SnackbarService);

  constructor() {
    // Effect: cambios en fecha preseleccionada
    effect(() => {
      const fecha = this.fechaPreseleccionada();
      if (fecha && this.eventoForm) {
        this.eventoForm.patchValue({ fecha });
      }
    });

    // Effect: cambios en evento seleccionado
    effect(() => {
      const evento = this.eventoSeleccionado();
      console.log('📦 evento seleccionado3:', evento);
      console.log('📦 eventoForm efect:', this.eventoForm);
      if (evento && this.eventoForm) {
        console.log('entro');
        // 🔴 ANTES: precargábamos directo con lo que venía del calendario (incompleto)
        // ✅ AHORA: si viene id_actividad, consultamos al "backend" mock y luego precargamos
        if (evento.id_actividad) {
          this.cargarEdicionDesdeBackend(evento.id_actividad);
        } else {
          this.precargarFormulario(evento);
        }
      }
    });
  }

  get estaEditando(): boolean {
    return !!this.eventoParaEditar;
  }

  get modoSoloLectura(): boolean {
    return this.estaEditando && this.eventoParaEditar?.idSesion;
  }

  // Outputs con la nueva API
  limpiarEventoSeleccionado = output<void>();
  eventoEditado = output<any>();
  eventoGuardado = output<any>();
  cerrarFormulario = output<void>();
  sesionEliminada = output<string>();

  eventoForm!: FormGroup;
  eventoParaEditar: any = null;

  // 🔹 Listas desde el servicio
  sedes: Sede[] = [];
  tiposDeActividad: TipoActividad[] = [];
  aliados: Aliado[] = [];
  responsables: Responsable[] = [];
  nombreDeEventos: NombreEvento[] = [];
  frecuencias: Frecuencia[] = [];
  eventosFiltrados: EventoFiltrado[] = [];

  // Variables para el autocomplete de aliados
  aliadoTexto: string = '';
  aliadosFiltrados: AliadoFiltrado[] = [];
  mostrarSugerencias: boolean = false;

  // Filtra aliados cada vez que el usuario escribe
  onAliadoInput(event: Event) {
    const texto = (event.target as HTMLInputElement).value.toLowerCase();
    this.aliadoTexto = texto;

    // Filtra por coincidencia en nombre
    this.aliadosFiltrados = this.aliados.filter(a =>
      a.nombre.toLowerCase().includes(texto)
    );

    // Mostrar lista si hay coincidencias
    this.mostrarSugerencias = this.aliadosFiltrados.length > 0;
  }

  // Selecciona un aliado de la lista
  seleccionarAliado(aliado: Aliado) {
    this.aliadoTexto = aliado.nombre;
    this.eventoForm.patchValue({ aliado: aliado.id_aliado });
    this.mostrarSugerencias = false;
  }

  // Opcional: cerrar lista si hace clic fuera
  @HostListener('document:click', ['$event'])
  clickFuera(event: Event) {
    const inputElement = (event.target as HTMLElement).closest('.col');
    if (!inputElement) {
      this.mostrarSugerencias = false;
    }
  }


  ngOnInit(): void {
    this.eventoForm = this.fb.group({
      id_programa: [{ value: this.id_programa, disabled: this.modoSoloLectura }, Validators.required],
      institucional: [{ value: null, disabled: this.modoSoloLectura }, Validators.required],
      sede: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      tipoEvento: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      responsable: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      aliado: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      nombreEvento: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      descripcionGrupo: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      fecha: [{ value: this._fechaPreseleccionada ?? '', disabled: this.modoSoloLectura }, Validators.required],
      horaInicio: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      horaFin: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      frecuencia: [{ value: '', disabled: this.modoSoloLectura }, Validators.required],
      sesiones: this.fb.array([])
    });
    console.log('📦 eventoForm ngOnInit:', this.eventoForm);

    // 🔹 Cargar datos desde el backend simulado
    this.cargarConfiguracionFormulario();


    // Suscribir cambios en tipoEvento para mantener la lista filtrada
    this.eventoForm.get('tipoEvento')?.valueChanges.subscribe(tipoId => {
      this.filtrarEventosPorTipo(tipoId);
    });

    // Pre-cargar si es edición (si llega algo ya en el primer render)
    const evento = this.eventoSeleccionado();
    console.log('📦 evento seleccionado:', evento);
    if (evento) {
      this.eventoParaEditar = evento;
      if (evento.id_actividad) {
        this.cargarEdicionDesdeBackend(evento.id_actividad);
      } else {
        this.precargarFormulario(evento);
      }
    } else {
      this.eventoParaEditar = null;
      this.eventoForm.enable(); // 👈 si no es edición, dejamos el form editable
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventoSeleccionado']) {
      const evento = this.eventoSeleccionado();
      if (evento) {
        this.eventoParaEditar = evento;
        if (this.eventoForm) {
          if (evento.id_actividad) {
            this.cargarEdicionDesdeBackend(evento.id_actividad);
          } else {
            this.precargarFormulario(evento);
          }
        }
      } else {
        this.eventoParaEditar = null;
        if (this.eventoForm) {
          this.eventoForm.enable();
        }
      }
    }
  }

  get nombresFiltrados(): NombreEvento[] {
    const tipoId = this.eventoForm.get('tipoEvento')?.value;
    if (!tipoId) return [];

    // Retorna sólo los nombres cuyo id_parametro_detalle coincide con el tipo seleccionado
    return this.nombreDeEventos.filter(
      n => n.id_parametro_detalle === tipoId
    );
  }

  private filtrarEventosPorTipo(tipoId: string | null | undefined): void {
    console.log('📦 tipoId filtrarEventosPorTipo:', tipoId);
    if (!tipoId) {
      this.eventosFiltrados = [];
      return;
    }
    // nombreDeEventos viene del mock; filtramos por id_parametro_detalle (padre)
    console.log('📦 nombreDeEventos:', this.nombreDeEventos);
    this.eventosFiltrados = (this.nombreDeEventos || []).filter(
      n => n.id_tipo_actividad === tipoId
    );
  }


  // 🔹 Lógica para saber si nombreEvento es select o input
  esListaNombreEvento(): boolean {
    const tipoId = this.eventoForm.get('tipoEvento')?.value;
    // console.log('📦 tipoId:', tipoId);
    const tipo = this.tiposDeActividad.find(t => t.id_tipo_actividad === tipoId)?.nombre.toUpperCase();
    return tipo === 'Contenido del ciclo'.toUpperCase() || tipo === 'Actividad General'.toUpperCase();
  }

  cargarConfiguracionFormulario(parametros?: ConfiguracionEvento): void {
    const idUsuario = this.authService.getUserUuid(); // por ahora fijo

    if (parametros) {
      console.log('📦 viene con parametros:', parametros);
      this.sedes = parametros.sedes || [];
      this.tiposDeActividad = parametros.tiposDeActividad || [];
      this.aliados = parametros.aliados || [];
      this.responsables = parametros.responsables || [];
      this.nombreDeEventos = parametros.nombresDeActividad || [];
      this.frecuencias = parametros.frecuencias || [];
      this.filtrarEventosPorTipo(this.eventoForm?.get('tipoEvento')?.value);
      return;
    }

    // Si no, carga los "globales" mock
    this.eventService.obtenerConfiguracionEvento(idUsuario).subscribe((data: ConfiguracionEvento & { id_programa: string }) => {
      console.log('📦 datos de configuración:', data);
      this.id_programa = data.id_programa;
      this.eventoForm.get('id_programa')?.setValue(this.id_programa);

      this.sedes = data.sedes;
      this.tiposDeActividad = data.tiposDeActividad;
      this.aliados = data.aliados;
      this.responsables = data.responsables;
      this.nombreDeEventos = data.nombresDeActividad;
      this.frecuencias = data.frecuencias;


      // ✅ Si hay exactamente una sede y estamos creando (no editando)
      if (!this.estaEditando && this.sedes.length === 1) {
        this.eventoForm.get('sede')?.enable({ emitEvent: false });
        this.eventoForm.get('sede')?.setValue(this.sedes[0].id_sede, { emitEvent: false });
        this.eventoForm.get('sede')?.disable({ emitEvent: false });
        console.log('✅ Sede única asignada:', this.eventoForm.get('sede')?.value);
      } else {
        this.eventoForm.get('sede')?.enable({ emitEvent: false });
      }

      this.filtrarEventosPorTipo(this.eventoForm?.get('tipoEvento')?.value);
    });

    console.log('📦 configuración cargada:', this.sedes, this.tiposDeActividad, this.aliados, this.responsables, this.nombreDeEventos, this.frecuencias);
  }



  id_programa: string | null = null;

  get sesiones(): FormArray {
    return this.eventoForm?.get('sesiones') as FormArray;
  }

  private formatearFechaLocal(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  onAccionSeleccionado(accion: 'editar' | 'asistencia') {
    console.log('🎯 Accion seleccionada:', accion);
    if (accion === 'editar') {
      this.eventoParaEditar = this.eventoSeleccionado;
      console.log('Editar evento', this.eventoParaEditar);
      if (this.eventoParaEditar?.id_actividad) {
        this.cargarEdicionDesdeBackend(this.eventoParaEditar.id_actividad);
      } else {
        this.precargarFormulario(this.eventoParaEditar);
      }
    }

    if (accion === 'asistencia') {
      console.log('Tomar asistencia aún no implementado');
    }

    this.limpiarEventoSeleccionado.emit();
  }

  // ⬇️⬇️⬇️ CAMBIO CLAVE: cuando hay id_actividad, traemos TODO del mock y recién precargamos
  cargarEdicionDesdeBackend(id_actividad: string): void {
    this.eventService.obtenerEventoPorId(id_actividad).subscribe((resp: EventoBackendResponse) => {
      // 1) listas / parámetros
      console.log('📦 respuesta del backend:', resp);
      this.cargarConfiguracionFormulario(resp);

      // 2) armar objeto "eventoParaEditar" con ids del backend (y boolean institucional)
      console.log('📦 id_actividad:', resp.actividad.id_actividad);

      const eventoAdaptado = {
        id: resp.actividad.id_actividad,
        institucional: resp.actividad.institucional === 'S',
        id_sede: resp.actividad.id_sede,
        id_tipo_actividad: resp.actividad.id_tipo_actividad,
        id_responsable: resp.actividad.id_responsable,
        id_aliado: resp.actividad.id_aliado,
        nombre_actividad: resp.actividad.nombre_actividad,
        descripcion: resp.actividad.descripcion,
        id_frecuencia: resp.actividad.id_frecuencia,
        fecha_actividad: resp.actividad.fecha_actividad,
        hora_inicio: resp.actividad.hora_inicio,
        hora_fin: resp.actividad.hora_fin,
        sesiones: resp.sesiones.map((s: SesionBackend) => ({
          id_sesion: s.id_sesion,
          id_actividad: resp.actividad.id_actividad,
          fecha: s.fecha_actividad,
          horaInicio: s.hora_inicio,
          horaFin: s.hora_fin,
          asistentes_sesion: s.nro_asistentes
        }))
      };

      this.eventoParaEditar = eventoAdaptado;

      // 3) pintar formulario
      this.precargarFormulario(eventoAdaptado);

      // 4) poner el texto visible del autocomplete de aliado (solo para mostrar nombre)
      const aliado = this.aliados.find(a => a.id_aliado === resp.actividad.id_aliado);
      this.aliadoTexto = aliado?.nombre || '';
    });
  }


  // ✅ Ajustado para aceptar tanto campos "id_*" del backend como los antiguos del mock
  precargarFormulario(evento: EventoPrecargado): void {
    console.log('📦 evento para precargar:', evento);
    if (!this.eventoForm) return;

    this.eventoForm.patchValue({
      institucional: typeof evento.institucional === 'string'
        ? evento.institucional === 'S'
        : !!evento.institucional,
      sede: evento.id_sede || evento.sede,
      tipoEvento: evento.id_tipo_actividad || evento.tipoEvento,
      responsable: evento.id_responsable || evento.responsable,
      aliado: evento.id_aliado || evento.aliado,
      nombreEvento: evento.nombre_actividad || evento.nombreEvento,
      descripcionGrupo: evento.descripcion || evento.descripcionGrupo,
      fecha: evento.fecha_actividad || evento.fecha,
      horaInicio: evento.hora_inicio || evento.horaInicio,
      horaFin: evento.hora_fin || evento.horaFin,
      frecuencia: evento.id_frecuencia || evento.frecuencia || 'no'
    });

    if (this.estaEditando) {
      this.eventoForm.disable();
      this.eventoForm.get('aliado')?.disable({ emitEvent: false });
    } else {
      this.eventoForm.get('aliado')?.enable({ emitEvent: false });
    }

    this.sesiones.clear();
    console.log("Justo antes de cargar las sesiones:", evento.sesiones);

    if (evento.sesiones && Array.isArray(evento.sesiones)) {
      evento.sesiones.forEach((s: SesionFormulario) => {
        this.sesiones.push(this.fb.group({
          fecha: [s.fecha],
          horaInicio: [s.horaInicio],
          horaFin: [s.horaFin],
          id_sesion: [s.id_sesion],
          id_actividad: [s.id_actividad],
          asistentes_sesion: [s.asistentes_sesion ?? 0]
        }));
      });
    }

    console.log("Justo despues de cargar las sesiones:", this.sesiones);
  }

  guardarEvento(): void {
    console.log('📦 eventoFormguardar:', this.eventoForm);
    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      this.snack.error('Formulario inválido. Revisa los campos obligatorios.');
      return;
    }
    console.log('📦 esta editando:', this.estaEditando);
    console.log('📦 evento para editar:', this.eventoParaEditar?.id);

    if (this.estaEditando && this.eventoParaEditar?.id) {
      this.actualizarSesion();
    } else {
      this.crearEvento();
    }
  }

  private crearEvento(): void {
    const evento = this.eventoForm.getRawValue();
    let sesiones: any[] = [];

    console.log('📋 Evento base:', evento);

    const fechaBase = new Date(evento.fecha);
    const finMes = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
    const [year, month, day] = evento.fecha.split("-").map(Number);
    const actual = new Date(year, month - 1, day);
    console.log('📋 actual:', actual);

    const nombreFrecuencia = this.frecuencias.find(f => f.id_frecuencia === evento.frecuencia)?.nombre || '';

    // Frecuencias
    console.log('📋 nombreFrecuencia:', nombreFrecuencia.toLowerCase());
    if (nombreFrecuencia.toLowerCase() === 'a diario') {
      while (actual <= finMes) {
        if (actual.getDay() >= 1 && actual.getDay() <= 6) {
          sesiones.push(this.crearSesion(this.formatearFechaLocal(actual), evento.horaInicio, evento.horaFin, evento));
        }
        actual.setDate(actual.getDate() + 1);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'todos los días de la semana') {
      while (actual <= finMes) {
        if (actual.getDay() >= 1 && actual.getDay() <= 5) {
          sesiones.push(this.crearSesion(this.formatearFechaLocal(actual), evento.horaInicio, evento.horaFin, evento));
        }
        actual.setDate(actual.getDate() + 1);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'semanalmente') {
      console.log('📋 entro a semanalmente:');
      while (actual <= finMes) {
        console.log('📋 fecha formateada:', this.formatearFechaLocal(actual));
        sesiones.push(this.crearSesion(this.formatearFechaLocal(actual), evento.horaInicio, evento.horaFin, evento));

        actual.setDate(actual.getDate() + 7);
        console.log('📋 fecha actual:', actual);
        console.log('📋 fecha fin de mes:', finMes);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'mensualmente') {
      for (let mes = fechaBase.getMonth(); mes <= 11; mes++) {
        const [year, month, day] = evento.fecha.split("-").map(Number);
        console.log('📋 dia:', day);
        console.log('📋 mes:', month);
        console.log('📋 año:', year);
        const nuevaFecha = new Date(year, month - 1, day); // clonamos la fecha base
        nuevaFecha.setMonth(mes); // solo cambiamos el mes
        sesiones.push(
          this.crearSesion(
            this.formatearFechaLocal(nuevaFecha),
            evento.horaInicio,
            evento.horaFin,
            evento
          )
        );
      }
    }

    // Evitar duplicados y solapamientos
    this.sesiones.controls.forEach(control => {
      const s = control.value;
      const nueva = this.crearSesion(s.fecha, s.horaInicio, s.horaFin, evento);

      // const yaExiste = sesiones.some(ev =>
      //   ev.fecha === nueva.fecha && ev.horaInicio === nueva.horaInicio && ev.horaFin === nueva.horaFin
      // );

      // const haySolape = this.haySuperposicion(sesiones, nueva);

      // if (!yaExiste && !haySolape) {
      //   sesiones.push(nueva);
      // }
    });

    console.log('📦 Sesiones creadas:', sesiones);

    // 📤 Construir payload para el back
    console.log('📦 Evento basessssss:', evento);
    // traducir nombreEvento si vino como id desde la lista
    let nombreActividad = evento.nombreEvento;

    // Si estamos en modo lista (esListaNombreEvento) y el valor es un id,
    // buscar el objeto en eventosFiltrados por id_parametro_detalle y usar su nombre.
    if (this.esListaNombreEvento()) {
      const seleccionado = this.eventosFiltrados.find(n => n.id_parametro_detalle === evento.nombreEvento);
      if (seleccionado) {
        nombreActividad = seleccionado.nombre;
      } else {
        // fallback: si no está en eventosFiltrados intentar buscar en nombreDeEventos
        const buscado = (this.nombreDeEventos || []).find(n => n.id_parametro_detalle === evento.nombreEvento);
        nombreActividad = buscado?.nombre ?? evento.nombreEvento;
      }
    }

    const payload = {
      id_programa: evento.id_programa, // esto vendrá del back en producción
      institucional: evento.institucional ? 'S' : 'N',
      id_tipo_actividad: evento.tipoEvento,
      id_responsable: evento.responsable,
      id_aliado: evento.aliado,
      id_sede: evento.sede,
      id_frecuencia: evento.frecuencia,
      nombre_actividad: nombreActividad,
      descripcion: evento.descripcionGrupo,
      fecha_actividad: evento.fecha,
      hora_inicio: evento.horaInicio,
      hora_fin: evento.horaFin,
      id_usuario: '550e8400-e29b-41d4-a716-446655440006'
    };

    console.log('📤 Enviando payload al back:', payload);

    this.eventService.crearEvento(payload, sesiones).subscribe(resp => {
      console.log('📥 Respuesta del back:', resp);
      if (resp.exitoso === 'S') {
        console.log('✅ Evento creado correctamente');
        this.snack.success('Evento creado correctamente');
        this.eventoGuardado.emit({ sesiones, editarUna: false, idSesionOriginal: null });
        this.resetearFormulario();
      } else {
        console.error('❌ Error al crear evento:', resp.mensaje);
        this.snack.error('Error al crear evento');
      }
    });
  }

  async actualizarSesion() {
    const payloadFinal: CambiosSesionesPayload = {
      nuevos: this.cambiosSesionesSnapshot.nuevos.map(s => ({
        id_sesion: s.id_sesion,
        id_actividad: s.id_actividad,
        fecha_sesion: s.fecha_sesion,
        hora_inicio: s.hora_inicio,
        hora_fin: s.hora_fin
      })),
      modificados: this.cambiosSesionesSnapshot.modificados.map(s => ({
        id_sesion: s.id_sesion,
        id_actividad: s.id_actividad,
        fecha_sesion: s.fecha_sesion,
        hora_inicio: s.hora_inicio,
        hora_fin: s.hora_fin
      })),
      eliminados: this.cambiosSesionesSnapshot.eliminados.map(s => ({
        id_sesion: s.id_sesion
      }))
    };

    console.log('📦 Payload final a enviar al back:', payloadFinal);

    try {
      const resp = await this.gridSesionesService.guardarCambiosSesiones(payloadFinal);
      if (resp.exitoso === 'S') {
        this.snack.success(resp.mensaje ?? 'Sesiones actualizadas');
        this.eventoEditado.emit(payloadFinal); // ✅ ahora tipado correctamente
        this.cerrarFormulario.emit();
      } else {
        this.snack.error(resp.mensaje ?? 'No se pudieron actualizar las sesiones');
      }
    } catch (err) {
      console.error('❌ Error al guardar sesiones:', err);
      this.snack.error('Error al guardar sesiones');
    }
  }


  private resetearFormulario(): void {
    this.eventoForm.reset();
    this.sesiones.clear();
    this.eventoParaEditar = null;
    this.cerrarFormulario.emit();
    this.limpiarEventoSeleccionado.emit();

    // 👇 Aseguramos que todo quede habilitado para la próxima creación
    this.eventoForm.enable({ emitEvent: false });

  }

  private crearSesion(fecha: string, horaInicio: string, horaFin: string, base: EventoFormValue) {
    const idGenerado = crypto.randomUUID();
    const sesion = {
      id_sesion: idGenerado,
      id_actividad: base.id_actividad,
      fecha_actividad: fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      id_creado_por: this.authService.getUserUuid()
    };

    console.log(`🆕 Crear sesión `, sesion);
    return sesion;
  }

  private haySuperposicion(sesiones: SesionBasica[], nuevaSesion: SesionBasica): boolean {
    const nuevaInicio = new Date(`${nuevaSesion.fecha}T${nuevaSesion.horaInicio}`);
    const nuevaFin = new Date(`${nuevaSesion.fecha}T${nuevaSesion.horaFin}`);

    return sesiones.some(ev => {
      const evInicio = new Date(`${ev.fecha}T${ev.horaInicio}`);
      const evFin = new Date(`${ev.fecha}T${ev.horaFin}`);

      return (
        nuevaSesion.fecha === ev.fecha &&
        (
          (nuevaInicio >= evInicio && nuevaInicio < evFin) ||
          (nuevaFin > evInicio && nuevaFin <= evFin) ||
          (nuevaInicio <= evInicio && nuevaFin >= evFin)
        )
      );
    });
  }

  /** 🔹 Recibe cambios en tiempo real desde el grid */
  onCambiosSesiones(payload: { nuevos: any[]; modificados: any[]; eliminados: any[] }) {
    console.log('🧩 Cambios recibidos del grid (snapshot actualizado):', payload);
    this.cambiosSesionesSnapshot = payload;
  }

  private uppercaseMaxLengthValidator(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (typeof value !== 'string') return null;

      const isUppercase = value === value.toUpperCase();
      const isWithinLimit = value.length <= maxLength;

      return !isUppercase || !isWithinLimit
        ? {
          uppercaseMaxLength: {
            requiredUppercase: true,
            requiredMaxLength: maxLength,
            actualLength: value.length
          }
        }
        : null;
    };
  }
}
