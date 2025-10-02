import { Grid_sesionesComponent } from './../../grid-sesiones.component/pages/grid-sesiones.component';
import { PreEditActividad } from '../../../interfaces/pre-edit-actividad.interface';
import { v4 as uuidv4 } from 'uuid';

import {
  Component,
  input,
  OnInit,
  output,
  SimpleChanges,
  OnChanges,
  effect,
  inject,
  HostListener,
} from '@angular/core';
import { Aliados } from '../../../interfaces/lista-aliados.interface';
import { CommonModule } from '@angular/common';
import { Injectable } from '@angular/core';
import { Sesiones } from '../../../interfaces/sesiones.interface';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { EventService } from '../services/event.services';
import { Grid_sesionesService } from '../../grid-sesiones.component/services/grid-sesiones.services';
import { AuthService } from '../../../../shared/services/auth.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { Actividades } from '../../../interfaces/actividades.interface';
import { EventoSeleccionado } from '../../../interfaces/evento-seleccionado.interface';
import { Sedes } from '../../../interfaces/lista-sedes.interface';
import { Frecuencias } from '../../../interfaces/lista-frecuencias-interface';
import { NombresDeActividad } from '../../../interfaces/lista-nombres-actividades.interface';
import { TiposDeActividad } from '../../../interfaces/lista-tipos-actividades-interface';
import { Responsables } from '../../../interfaces/lista-responsables-interface';
import { PreCreateActividad } from '../../../interfaces/pre-create-actividad.interface';
@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Grid_sesionesComponent,
    MatSnackBarModule,
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
})
export class EventComponent implements OnInit, OnChanges {
  // Inputs convertidos a señales
  eventoSeleccionado = input<EventoSeleccionado>();
  fechaPreseleccionada = input<string | null>(null);
  mostrarFormulario = input<boolean>(false);
  id_programa: string | null = null;
  private _fechaPreseleccionada: string | null = null;
  actualizarSesionEnCalendario: any;

  /** 🔹 Guardamos el snapshot del grid */
  private cambiosSesionesSnapshot: {
    nuevos: Sesiones[];
    modificados: Sesiones[];
    eliminados: Sesiones[];
  } = {
    nuevos: [],
    modificados: [],
    eliminados: [],
  };

  // Inyectamos con funciones
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private grid_sesionesService = inject(Grid_sesionesService);
  private authService = inject(AuthService);
  private snack = inject(SnackbarService);
  private loadingService = inject(LoadingService);

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
      const evento = <EventoSeleccionado>this.eventoSeleccionado();
      //console.log('📦 evento seleccionado3:', evento);
      //console.log('📦 eventoForm efect:', this.eventoForm);
      if (evento && this.eventoForm) {
        //console.log('entro');
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
    return (
      this.estaEditando &&
      this.eventoParaEditar?.id_sesion != null &&
      this.eventoParaEditar?.id_sesion != ''
    );
  }

  // Outputs con la nueva API
  limpiarEventoSeleccionado = output<void>();
  eventoEditado = output<any>();
  eventoGuardado = output<any>();
  cerrarFormulario = output<void>();
  sesionEliminada = output<string>();

  eventoForm!: FormGroup;
  eventoParaEditar: EventoSeleccionado | undefined | null = null;

  // 🔹 Listas desde el servicio
  sedes: Sedes[] = [];
  tiposDeActividad: TiposDeActividad[] = [];
  aliados: Aliados[] = [];
  responsables: Responsables[] = [];
  nombreDeEventos: NombresDeActividad[] = [];
  frecuencias: Frecuencias[] = [];
  nombresDeEventosFiltrados: NombresDeActividad[] = [];

  // Variables para el autocomplete de aliados
  aliadoTexto: string = '';
  aliadosFiltrados: Aliados[] = [];
  mostrarSugerencias: boolean = false;

  // Filtra aliados cada vez que el usuario escribe
  onAliadoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const texto: string = input.value?.toLowerCase();
    this.aliadoTexto = texto;
    // Filtra por coincidencia en nombre
    //console.log('aliados sin filtrar:', this.aliados);
    this.aliadosFiltrados = this.aliados.filter((a) =>
      a.nombre.toLowerCase().includes(texto),
    );

    // Mostrar lista si hay coincidencias
    this.mostrarSugerencias = this.aliadosFiltrados.length > 0;
  }

  // Selecciona un aliado de la lista
  seleccionarAliado(aliado: Aliados) {
    this.aliadoTexto = aliado.nombre;
    this.eventoForm.patchValue({ id_aliado: aliado.id_aliado });
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
    /* eslint-disable @typescript-eslint/unbound-method */
    this.eventoForm = this.fb.group({
      id_programa: [
        { value: this.id_programa, disabled: this.modoSoloLectura },
        Validators.required,
      ],
      institucional: [
        { value: null, disabled: this.modoSoloLectura },
        Validators.required,
      ],
      id_sede: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      id_tipo_actividad: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      id_responsable: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      id_aliado: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      nombre_actividad: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      descripcion: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      fecha_actividad: [
        {
          value: this._fechaPreseleccionada ?? '',
          disabled: this.modoSoloLectura,
        },
        Validators.required,
      ],
      hora_inicio: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      hora_fin: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      id_frecuencia: [
        { value: '', disabled: this.modoSoloLectura },
        Validators.required,
      ],
      sesiones: this.fb.array([]),
    });
    //console.log('📦 eventoForm ngOnInit:', this.eventoForm);

    // 🔹 Cargar datos desde el backend simulado
    this.cargarConfiguracionFormulario();

    // Suscribir cambios en id_tipo_actividad para mantener la lista filtrada
    this.eventoForm
      .get('id_tipo_actividad')
      ?.valueChanges.subscribe((tipoId: string) => {
        //console.log("Cambia Tipo de Actividad");
        this.filtrarEventosPorTipo(tipoId);
      });

    // Pre-cargar si es edición (si llega algo ya en el primer render)
    const evento = this.eventoSeleccionado();
    //console.log('📦 evento seleccionado:', evento);
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

  private filtrarEventosPorTipo(tipoId: string | null | undefined): void {
    //console.log('📦 tipoId filtrarEventosPorTipo:', tipoId);
    if (!tipoId) {
      this.nombresDeEventosFiltrados = [];
      return;
    }
    // nombreDeEventos viene del mock; filtramos por id_parametro_detalle (padre)
    //console.log('📦 nombreDeEventos:', this.nombreDeEventos);
    this.nombresDeEventosFiltrados = (this.nombreDeEventos || []).filter(
      (n) => n.id_tipo_actividad === tipoId,
    );
    //console.log('📦 nombresDeEventosFiltrados:', this.nombresDeEventosFiltrados);
  }

  // 🔹 Lógica para saber si nombre_actividad es select o input
  esListaNombreEvento(): boolean {
    const tipoId: string = this.eventoForm.get('id_tipo_actividad')
      ?.value as string;

    if (tipoId === null || tipoId === undefined) {
      return false;
    }
    const tipoActividad = this.tiposDeActividad?.find(
      (t: TiposDeActividad) => t.id_tipo_actividad === tipoId,
    );

    if (!tipoActividad || !tipoActividad.nombre) {
      return false;
    }

    const tipo = tipoActividad.nombre.toUpperCase();

    return (
      tipo === 'Contenido del ciclo'.toUpperCase() ||
      tipo === 'Actividad General'.toUpperCase()
    );
  }

  cargarConfiguracionFormulario(parametros?: PreEditActividad): void {
    const idUsuario = this.authService.getUserUuid(); // por ahora fijo

    // 👇 Si ya vienen parámetros desde la consulta de edición, úsalos
    if (parametros) {
      //console.log('📦 viene con parametros:', parametros);
      this.sedes = parametros.sedes || [];
      this.tiposDeActividad = parametros.tiposDeActividad || [];
      this.aliados = parametros.aliados || [];
      this.responsables = parametros.responsables || [];
      this.nombreDeEventos = parametros.nombresDeActividad || [];
      this.frecuencias = parametros.frecuencias || [];
      // si ya hay un tipo seleccionado, actualizamos la lista filtrada
      this.filtrarEventosPorTipo(
        this.eventoForm?.get('id_tipo_actividad')?.value as string,
      );

      return;
    }

    this.eventService
      .obtenerConfiguracionEvento(idUsuario)
      .subscribe((data: PreCreateActividad) => {
        //console.log('📦 datos de configuración:', data);
        this.id_programa = data.id_programa;
        //console.log('📦 id_programa:', this.id_programa);
        this.eventoForm.get('id_programa')?.setValue(this.id_programa);
        this.sedes = data.sedes;
        this.sedes.sort((a, b) => a.nombre.localeCompare(b.nombre));

        this.tiposDeActividad = data.tiposDeActividad;
        this.tiposDeActividad.sort((a, b) => {
          const nombreA = a.nombre ?? '';
          const nombreB = b.nombre ?? '';
          return nombreA.localeCompare(nombreB);
        });
        this.aliados = data.aliados;
        this.aliados.sort((a, b) => a.nombre.localeCompare(b.nombre));

        this.responsables = data.responsables;
        this.responsables.sort((a, b) => {
          const nombreA = a.nombre ?? '';
          const nombreB = b.nombre ?? '';
          return nombreA.localeCompare(nombreB);
        });
        this.nombreDeEventos = data.nombresDeActividad;
        //console.log("nombre de eventos:", this.nombreDeEventos);
        this.nombreDeEventos.sort((a, b) => {
          const nombreA = a.nombre;
          const nombreB = b.nombre;
          return nombreA.localeCompare(nombreB);
        });
        this.frecuencias = data.frecuencias;
        this.frecuencias.sort((a, b) => {
          const nombreA = a.nombre ?? '';
          const nombreB = b.nombre ?? '';
          return nombreA.localeCompare(nombreB);
        }); //console.log('📦 frecuencias:', this.frecuencias);
        // actualizar eventos filtrados si ya hay un tipo seleccionado

        // ✅ Lógica de sede
        //console.log("Cantidad de sedes:", this.sedes.length);
        if (!this.estaEditando && this.sedes.length === 1) {
          this.eventoForm.get('id_sede')?.enable({ emitEvent: false });
          this.eventoForm
            .get('id_sede')
            ?.setValue(this.sedes[0].id_sede, { emitEvent: false });
          this.eventoForm.get('id_sede')?.disable({ emitEvent: false });
          //console.log('✅ Sede única asignada:',this.eventoForm.get('sede')?.value);
        } else {
          this.eventoForm.get('id_sede')?.enable({ emitEvent: false });
        }

        this.filtrarEventosPorTipo(
          this.eventoForm?.get('id_tipo_actividad')?.value as string,
        );
        this.loadingService.hide(); // 🔄 ocultar
        console.log(
          '📦 configuración cargada:',
          this.sedes,
          this.tiposDeActividad,
          this.aliados,
          this.responsables,
          this.nombreDeEventos,
          this.frecuencias,
        );
      });
  }

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
    //console.log('🎯 Accion seleccionada:', accion);
    if (accion === 'editar') {
      this.eventoParaEditar = this.eventoSeleccionado as EventoSeleccionado;
      //console.log('Editar evento', this.eventoParaEditar);
      if (this.eventoParaEditar?.id_actividad) {
        this.cargarEdicionDesdeBackend(this.eventoParaEditar.id_actividad);
      } else {
        this.precargarFormulario(this.eventoParaEditar);
      }
    }

    if (accion === 'asistencia') {
      //console.log('Tomar asistencia aún no implementado');
    }

    this.limpiarEventoSeleccionado.emit();
  }

  // ⬇️⬇️⬇️ CAMBIO CLAVE: cuando hay id_actividad, traemos TODO del mock y recién precargamos
  cargarEdicionDesdeBackend(id_actividad: string): void {
    try {
      this.eventService
        .obtenerEventoPorId(id_actividad)
        .then((resp: PreEditActividad) => {
          //console.log('📦 respuesta del backend:', resp);
          this.cargarConfiguracionFormulario(resp);

          const eventoAdaptado: EventoSeleccionado = {
            id_actividad: resp.actividad.id_actividad,
            institucional: resp.actividad.institucional === 'S',
            id_sede: resp.actividad.id_sede,
            id_tipo_actividad: resp.actividad.id_tipo_actividad,
            id_responsable: resp.actividad.id_responsable,
            id_aliado: resp.actividad.id_aliado,
            nombre_actividad: resp.actividad.nombre_actividad,
            descripcion: resp.actividad.descripcion,
            id_frecuencia: resp.actividad.id_frecuencia,
            fecha_actividad: resp.actividad.fecha_actividad,
            hora_inicio: resp.actividad.hora_inicio ?? '',
            hora_fin: resp.actividad.hora_fin ?? '',
            sesiones:
              resp.sesiones.map((s: Sesiones) => ({
                id_sesion: s.id_sesion ?? '',
                id_actividad: resp.actividad.id_actividad ?? '',
                fecha_actividad: s.fecha_actividad ?? '',
                hora_inicio: s.hora_inicio ?? '',
                hora_fin: s.hora_fin ?? '',
                nro_asistentes: s.nro_asistentes,
              })) ?? [],
          };

          //console.log('✅ Evento adaptado:', eventoAdaptado);
          this.eventoParaEditar = eventoAdaptado;

          // 3) pintar formulario
          this.precargarFormulario(eventoAdaptado);

          // 4) poner el texto visible del autocomplete de aliado (solo para mostrar nombre)
          const aliado = this.aliados.find(
            (a) => a.id_aliado === resp.actividad.id_aliado,
          );
          this.aliadoTexto = aliado?.nombre || '';
        })
        .catch((err) => {
          console.error('❌ Error al obtener evento:', err);
          this.snack.error('No fue posible cargar el evento');
        });
    } finally {
      //console.log('Fin obtenerEventoPorId');
    }
  }

  // ✅ Ajustado para aceptar tanto campos "id_*" del backend como los antiguos del mock
  precargarFormulario(evento: EventoSeleccionado | null): void {
    if (evento !== null) {
      //console.log('📦 evento para precargar:', evento);
      if (!this.eventoForm) return;
      //console.log('📦 DESPUES DEL IF eventoForm:', this.eventoForm);
      this.eventoForm.patchValue({
        institucional:
          typeof evento.institucional === 'string'
            ? evento.institucional === 'S'
            : !!evento.institucional,
        id_sede: evento.id_sede,
        id_tipo_actividad: evento.id_tipo_actividad,
        id_responsable: evento.id_responsable,
        id_aliado: evento.id_aliado,
        nombre_actividad: evento.nombre_actividad,
        descripcion: evento.descripcion,
        fecha_actividad: evento.fecha_actividad,
        hora_inicio: evento.hora_inicio,
        hora_fin: evento.hora_fin,
        id_frecuencia: evento.id_frecuencia,
      });

      // En edición, dejamos el form en solo lectura (si quieres permitir edición, comenta esto)
      if (this.estaEditando) {
        this.eventoForm.disable();
      }

      // FORZAR bloqueo del control 'aliado' cuando estamos en modo edición
      if (this.estaEditando) {
        this.eventoForm.get('aliado')?.disable({ emitEvent: false });
      } else {
        // por si acaso: en creación dejamos el control habilitado
        this.eventoForm.get('aliado')?.enable({ emitEvent: false });
      }

      this.sesiones.clear();
      //console.log('Justo antes de cargar las sesiones:', evento.sesiones);
      if (evento.sesiones && Array.isArray(evento.sesiones)) {
        evento.sesiones.forEach((s: Sesiones) => {
          this.sesiones.push(
            this.fb.group({
              fecha_actividad: [s.fecha_actividad],
              hora_inicio: [s.hora_inicio],
              hora_fin: [s.hora_fin],
              id_sesion: [s.id_sesion],
              id_actividad: [s.id_actividad],
              nro_asistentes: [s.nro_asistentes ?? 0], // 👈 nuevo
            }),
          );
        });
      }
    }
    //console.log('Justo despues de cargar las sesiones:');
    //this.sesiones.controls.forEach((control, index) => {
    //console.log(`Sesión ${index + 1}:`);
    //console.log('Fecha de Actividad:', control.get('fecha_actividad')?.value);
    //console.log('Hora de Inicio:', control.get('hora_inicio')?.value);
    //console.log('Hora de Fin:', control.get('hora_fin')?.value);
    //console.log('ID de Sesión:', control.get('id_sesion')?.value);
    //console.log('ID de Actividad:', control.get('id_actividad')?.value);
    //console.log('Número de Asistentes:', control.get('nro_asistentes')?.value);
    // });
  }

  guardarEvento() {
    //console.log("Formulario novalido:", this.eventoForm.invalid);
    //console.log('📦 eventoFormguardar:', this.eventoForm);
    //console.log('markAllAsTouched:', this.eventoForm.markAllAsTouched());
    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      this.snack.error(
        'Formulario no válido. Todos los campos son obligatorios.',
      );
      //console.log("Debio mostrar error");
      return;
    }
    //console.log('📦 esta editando:', this.estaEditando);
    //console.log('📦 evento para editar:', this.eventoParaEditar?.id);

    if (this.estaEditando && this.eventoParaEditar?.id_actividad) {
      this.actualizarSesion();
    } else {
      this.crearEvento();
    }
  }
  private getFinDeMes(fechaStr: string | null): Date {
    // Partir el string en partes
    if (fechaStr != null) {
      const [y, m, d] = fechaStr.split('-').map(Number);

      // Crear la fecha base de manera local (evita el bug de UTC)
      const fechaBase = new Date(y, m - 1, d);

      // Último día del mes = día 0 del siguiente mes
      return new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
    } else {
      return new Date();
    }
  }
  private crearEvento(): void {
    this.loadingService.show();
    const evento: EventoSeleccionado =
      this.eventoForm.getRawValue() as EventoSeleccionado;
    const sesiones: Sesiones[] = [];

    //console.log('📋 Evento base:', evento);
    //console.log('Fecha base:', evento.fecha_actividad);
    const fechaBase: Date = new Date(evento.fecha_actividad ?? Date.now());
    let finMes: Date = new Date();
    if (
      evento.fecha_actividad !== null &&
      evento.fecha_actividad !== undefined
    ) {
      finMes = this.getFinDeMes(evento.fecha_actividad);
    }

    let year: number | undefined;
    let month: number | undefined;
    let day: number | undefined;
    let actual: Date | undefined;

    if (evento.fecha_actividad) {
      [year, month, day] = evento.fecha_actividad.split('-').map(Number);
      actual = new Date(year, month - 1, day);
    } else {
      // Manejar el caso en que fecha_actividad es undefined
      console.error('fecha_actividad es undefined');
    }

    //console.log('📋 actual:', actual);

    const nombreFrecuencia =
      this.frecuencias.find((f) => f.id_frecuencia === evento.id_frecuencia)
        ?.nombre || '';

    // Frecuencias
    //console.log('📋 nombreFrecuencia:', nombreFrecuencia.toLowerCase());
    //console.log('📋 Actual:', actual, 'Fin de mes:', finMes);
    if (nombreFrecuencia.toLowerCase() === 'a diario') {
      while (actual != null && actual <= finMes) {
        if (actual.getDay() >= 1 && actual.getDay() <= 6) {
          sesiones.push(
            this.crearSesion(
              this.formatearFechaLocal(actual),
              evento.hora_inicio ?? '',
              evento.hora_fin ?? '',
              evento,
            ),
          );
        }
        actual.setDate(actual.getDate() + 1);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'todos los días de la semana') {
      while (actual != null && actual <= finMes) {
        if (actual.getDay() >= 1 && actual.getDay() <= 5) {
          sesiones.push(
            this.crearSesion(
              this.formatearFechaLocal(actual),
              evento.hora_inicio ?? '',
              evento.hora_fin ?? '',
              evento,
            ),
          );
        }
        actual.setDate(actual.getDate() + 1);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'semanalmente') {
      //console.log('📋 entro a semanalmente:');
      while (actual != null && actual <= finMes) {
        //console.log('📋 fecha formateada:', this.formatearFechaLocal(actual));
        sesiones.push(
          this.crearSesion(
            this.formatearFechaLocal(actual),
            evento.hora_inicio ?? '',
            evento.hora_fin ?? '',
            evento,
          ),
        );

        actual.setDate(actual.getDate() + 7);
        //console.log('📋 fecha actual:', actual);
        //console.log('📋 fecha fin de mes:', finMes);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'mensualmente') {
      for (let mes: number = fechaBase.getUTCMonth(); mes <= 11; mes++) {
        let nuevaFecha: Date = new Date(
          Date.UTC(
            fechaBase.getUTCFullYear(), // año fijo
            mes, // mes iterado (0–11)
            fechaBase.getUTCDate(), // día original
          ),
        );
        if (nuevaFecha.getUTCMonth() !== mes) {
          // Entonces ponemos el último día del mes correcto
          nuevaFecha = new Date(Date.UTC(year ?? 0, mes + 1, 0));
        }
        sesiones.push(
          this.crearSesion(
            this.formatearFechaLocal(nuevaFecha),
            evento.hora_inicio ?? '',
            evento.hora_fin ?? '',
            evento,
          ),
        );
      }
    }

    //console.log('📦 Sesiones creadas:', sesiones);

    // 📤 Construir payload para el back
    //console.log('📦 Evento basessssss:', evento);
    // traducir nombre_actividad si vino como id desde la lista
    let nombreActividad = evento.nombre_actividad;

    // Si estamos en modo lista (esListaNombreEvento) y el valor es un id,
    // buscar el objeto en eventosFiltrados por id_parametro_detalle y usar su nombre.
    if (this.esListaNombreEvento()) {
      const seleccionado = this.nombresDeEventosFiltrados.find(
        (n) => n.nombre === evento.nombre_actividad,
      );
      if (seleccionado) {
        nombreActividad = seleccionado.nombre;
      } else {
        // fallback: si no está en eventosFiltrados intentar buscar en nombreDeEventos
        const buscado = (this.nombreDeEventos || []).find(
          (n) => n.nombre === evento.nombre_actividad,
        );
        nombreActividad = buscado?.nombre ?? evento.nombre_actividad;
      }
    }

    const actividad: Actividades = {
      id_actividad: uuidv4(),
      id_programa: evento.id_programa as string, // esto vendrá del back en producción
      institucional: evento.institucional ? 'S' : 'N',
      id_tipo_actividad: evento.id_tipo_actividad as string,
      id_responsable: evento.id_responsable as string,
      id_aliado: evento.id_aliado as string,
      id_sede: evento.id_sede as string,
      id_frecuencia: evento.id_frecuencia as string,
      nombre_actividad: nombreActividad as string,
      descripcion: evento.descripcion as string,
      fecha_actividad: evento.fecha_actividad as string,
      hora_inicio: evento.hora_inicio as string,
      hora_fin: evento.hora_fin as string,
      estado: 'A',
      id_creado_por: this.authService.getUserUuid(),
      fecha_creacion: new Date().toISOString().split('T')[0],
      id_modificado_por: null,
      fecha_modificacion: null,
    };

    //console.log('📤 Enviando payload al back:', payload);

    this.eventService
      .crearEvento(actividad, sesiones)
      .then((resp) => {
        //console.log('📥 Respuesta del back:', resp);
        if (resp.exitoso === 'S') {
          //console.log('✅ Evento creado correctamente');
          this.snack.success('Evento creado correctamente');
          this.eventoGuardado.emit({
            sesiones,
            editarUna: false,
            id_sesionOriginal: null,
          });
          this.loadingService.hide();
          this.resetearFormulario();
        } else {
          this.loadingService.hide();
          console.error('❌ Error al crear evento:', resp.mensaje);
          this.snack.error(
            resp.mensaje ?? 'Error desconocido al crear el evento',
          );
        }
      })
      .catch((err) => {
        console.error('❌ Excepción al crear evento:', err);
        this.snack.error('Error inesperado al crear evento');
      });
  }

  async actualizarSesion() {
    // 🚨 Ahora usamos el snapshot del grid
    this.loadingService.show();

    const payloadFinal = {
      nuevos: this.cambiosSesionesSnapshot.nuevos.map((s) => ({
        id_sesion: s.id_sesion,
        id_actividad: s.id_actividad,
        fecha_actividad: s.fecha_actividad,
        hora_inicio: s.hora_inicio,
        hora_fin: s.hora_fin,
      })),
      modificados: this.cambiosSesionesSnapshot.modificados.map((s) => ({
        id_sesion: s.id_sesion,
        id_actividad: s.id_actividad,
        fecha_actividad: s.fecha_actividad,
        hora_inicio: s.hora_inicio,
        hora_fin: s.hora_fin,
      })),
      eliminados: this.cambiosSesionesSnapshot.eliminados.map((s) => ({
        id_sesion: s.id_sesion,
      })),
    };

    //console.log('📦 Payload final a enviar al back:', payloadFinal);

    try {
      const resp =
        await this.grid_sesionesService.guardarCambiosSesiones(payloadFinal);
      //console.log('✅ Respuesta del back GRIID:', resp);
      if (resp.exitoso === 'S') {
        this.snack.success(resp.mensaje ?? 'Sesiones actualizadas');
        this.eventoEditado.emit(payloadFinal);
        this.loadingService.hide();

        this.cerrarFormulario.emit();
      } else {
        this.loadingService.hide();

        this.snack.error(
          resp.mensaje ?? 'No se pudieron actualizar las sesiones',
        );
      }
    } catch (err) {
      this.loadingService.hide();

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

  private crearSesion(
    fecha: string,
    hora_inicio: string,
    hora_fin: string,
    base: EventoSeleccionado,
  ): Sesiones {
    const idGenerado = crypto.randomUUID();
    const sesion: Sesiones = {
      id_sesion: idGenerado,
      id_actividad: base.id_actividad ?? '',
      fecha_actividad: fecha,
      hora_inicio: hora_inicio,
      hora_fin: hora_fin,
      id_creado_por: this.authService.getUserUuid(),
    };

    //console.log(`🆕 Crear sesión `, sesion);
    return sesion;
  }

  /** 🔹 Recibe cambios en tiempo real desde el grid */
  onCambiosSesiones(payload: {
    nuevos: any[];
    modificados: any[];
    eliminados: any[];
  }) {
    //console.log('🧩 Cambios recibidos del grid (snapshot actualizado):',payload);
    this.cambiosSesionesSnapshot = payload;
  }
}
