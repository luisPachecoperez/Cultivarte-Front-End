import {
  Component,
  EventEmitter,
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
import { GridSesionesComponent } from '../../../grid.sesiones/grid.sesiones.component';
import { EventService } from './event.services';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GridSesionesComponent],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventComponent implements OnInit, OnChanges {
  // Inputs convertidos a señales
  eventoSeleccionado = input<any>(null);
  fechaPreseleccionada = input<string | null>(null);
  mostrarFormulario = input<boolean>(false);

  private _fechaPreseleccionada: string | null = null;
  actualizarSesionEnCalendario: any;

  constructor(private fb: FormBuilder, private eventService: EventService) {
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
      if (evento && this.eventoForm) {
        // 🔴 ANTES: precargábamos directo con lo que venía del calendario (incompleto)
        // ✅ AHORA: si viene idEvento, consultamos al "backend" mock y luego precargamos
        if (evento.idEvento) {
          this.cargarEdicionDesdeBackend(evento.idEvento);
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
  sedes: any[] = [];
  tiposDeEvento: any[] = [];
  aliados: any[] = [];
  responsables: any[] = [];
  nombreDeEventos: any[] = [];
  frecuencias: any[] = [];

  // Variables para el autocomplete de aliados
  aliadoTexto: string = '';
  aliadosFiltrados: any[] = [];
  mostrarSugerencias: boolean = false;

  // Filtra aliados cada vez que el usuario escribe
  onAliadoInput(event: any) {
    const texto = event.target.value.toLowerCase();
    this.aliadoTexto = texto;

    // Filtra por coincidencia en nombre
    this.aliadosFiltrados = this.aliados.filter(a =>
      a.nombre.toLowerCase().includes(texto)
    );

    // Mostrar lista si hay coincidencias
    this.mostrarSugerencias = this.aliadosFiltrados.length > 0;
  }

  // Selecciona un aliado de la lista
  seleccionarAliado(aliado: any) {
    this.aliadoTexto = aliado.nombre;
    this.eventoForm.patchValue({ aliado: aliado.id });
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

    // 🔹 Cargar datos desde el backend simulado
    this.cargarConfiguracionFormulario();

    // Pre-cargar si es edición (si llega algo ya en el primer render)
    const evento = this.eventoSeleccionado();
    if (evento) {
      this.eventoParaEditar = evento;
      if (evento.idEvento) {
        this.cargarEdicionDesdeBackend(evento.idEvento);
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
          if (evento.idEvento) {
            this.cargarEdicionDesdeBackend(evento.idEvento);
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

  // 🔹 Lógica para saber si nombreEvento es select o input
  esListaNombreEvento(): boolean {
    const tipoId = this.eventoForm.get('tipoEvento')?.value;
    const tipo = this.tiposDeEvento.find(t => t.id === tipoId)?.nombre;
    return tipo === 'Contenido del ciclo' || tipo === 'Actividad general';
  }

  cargarConfiguracionFormulario(parametros?: any): void {
    const idUsuario = 'mock-user-123'; // por ahora fijo
    // 👇 Si ya vienen parámetros desde la consulta de edición, úsalos
    if (parametros) {
      this.sedes = parametros.sedes || [];
      this.tiposDeEvento = parametros.tiposDeEvento || [];
      this.aliados = parametros.aliados || [];
      this.responsables = parametros.responsables || [];
      this.nombreDeEventos = parametros.nombreDeEventos || [];
      this.frecuencias = parametros.frecuencias || [];
      return;
    }

    // Si no, carga los "globales" mock
    this.eventService.obtenerConfiguracionEvento(idUsuario).subscribe(data => {
      this.sedes = data.sedes;
      this.tiposDeEvento = data.tiposDeEvento;
      this.aliados = data.aliados;
      this.responsables = data.responsables;
      this.nombreDeEventos = data.nombreDeEventos;
      this.frecuencias = data.frecuencias;
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

  // onAccionSeleccionada(accion: 'editar' | 'asistencia') {
  //   if (accion === 'editar') {
  //     const idEvento = this.eventoSeleccionado()?.idEvento || this.eventoSeleccionado()?.id_evento;
  //     if (!idEvento) {
  //       console.error('❌ No se encontró idEvento para edición');
  //       return;
  //     }

  //     // 📡 Consultar al servicio (mock GraphQL)
  //     this.eventService.obtenerEventoPorId(idEvento).subscribe(resp => {
  //       console.log('📥 Datos recibidos del back para editar (mock):', resp);

  //       // Guardar en eventoParaEditar para que sepamos que es edición
  //       this.eventoParaEditar = resp.evento;

  //       // Guardar listas en memoria para los selects
  //       this.sedes = resp.parametros.sedes;
  //       this.tiposDeEvento = resp.parametros.tiposDeEvento;
  //       this.aliados = resp.parametros.aliados;
  //       this.responsables = resp.parametros.responsables;
  //       this.nombreDeEventos = resp.parametros.nombreDeEventos;
  //       this.frecuencias = resp.parametros.frecuencias;

  //       // Precargar con IDs y mapear valores
  //       this.eventoForm.patchValue({
  //         institucional: resp.evento.institucional,
  //         sede: resp.evento.id_sede,
  //         tipoEvento: resp.evento.id_tipo_actividad,
  //         responsable: resp.evento.id_responsable,
  //         aliado: resp.evento.id_aliado,
  //         nombreEvento: resp.evento.nombre_actividad,
  //         descripcionGrupo: resp.evento.descripcion,
  //         fecha: resp.evento.fecha_sesion,
  //         horaInicio: resp.evento.hora_inicio,
  //         horaFin: resp.evento.hora_fin,
  //         frecuencia: resp.evento.id_frecuencia
  //       });

  //       // Cargar sesiones
  //       this.sesiones.clear();
  //       resp.sesiones.forEach((s: any) => {
  //         this.sesiones.push(this.fb.group({
  //           fecha: [s.fecha_sesion],
  //           horaInicio: [s.hora_inicio],
  //           horaFin: [s.hora_fin]
  //         }));
  //       });

  //       // Si es edición, poner en solo lectura los campos del evento
  //       this.eventoForm.disable();
  //     });
  //   }

  //   if (accion === 'asistencia') {
  //     console.log('Tomar asistencia aún no implementado');
  //   }

  //   this.limpiarEventoSeleccionado.emit();
  // }

  onAccionSeleccionada(accion: 'editar' | 'asistencia') {
    if (accion === 'editar') {
      this.eventoParaEditar = this.eventoSeleccionado;
      console.log('Editar evento', this.eventoParaEditar);
      if (this.eventoParaEditar?.idEvento) {
        this.cargarEdicionDesdeBackend(this.eventoParaEditar.idEvento);
      } else {
        this.precargarFormulario(this.eventoParaEditar);
      }
    }

    if (accion === 'asistencia') {
      console.log('Tomar asistencia aún no implementado');
    }

    this.limpiarEventoSeleccionado.emit();
  }

   // ⬇️⬇️⬇️ CAMBIO CLAVE: cuando hay idEvento, traemos TODO del mock y recién precargamos
   private cargarEdicionDesdeBackend(idEvento: string): void {
    this.eventService.obtenerEventoPorId(idEvento).subscribe(resp => {
      // 1) listas / parámetros
      this.cargarConfiguracionFormulario(resp.parametros);

      // 2) armar objeto "eventoParaEditar" con ids del backend (y boolean institucional)
      const eventoBackend = resp.evento;
      const sesionesBackend = resp.sesiones || [];

      const eventoAdaptado = {
        id: eventoBackend.id_evento,
        institucional: eventoBackend.institucional === 'S',
        id_sede: eventoBackend.id_sede,
        id_tipo_actividad: eventoBackend.id_tipo_actividad,
        id_responsable: eventoBackend.id_responsable,
        id_aliado: eventoBackend.id_aliado,
        nombre_actividad: eventoBackend.nombre_actividad,
        descripcion: eventoBackend.descripcion,
        id_frecuencia: eventoBackend.id_frecuencia,
        fecha_sesion: eventoBackend.fecha_sesion,
        hora_inicio: eventoBackend.hora_inicio,
        hora_fin: eventoBackend.hora_fin,
        sesiones: sesionesBackend.map((s: any) => ({
          id: s.id_sesion,
          fecha: s.fecha_sesion,
          horaInicio: s.hora_inicio,
          horaFin: s.hora_fin,
          asistentes_sesion: s.asistentes_sesion
        }))
      };

      this.eventoParaEditar = eventoAdaptado;

      // 3) pintar formulario
      this.precargarFormulario(this.eventoParaEditar);

      // 4) poner el texto visible del autocomplete de aliado (solo para mostrar nombre)
      const aliado = this.aliados.find(a => a.id === eventoBackend.id_aliado);
      this.aliadoTexto = aliado?.nombre || '';
    });
  }


  // ✅ Ajustado para aceptar tanto campos "id_*" del backend como los antiguos del mock
  precargarFormulario(evento: any): void {
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
      fecha: evento.fecha_sesion || evento.fecha,
      horaInicio: evento.hora_inicio || evento.horaInicio,
      horaFin: evento.hora_fin || evento.horaFin,
      frecuencia: evento.id_frecuencia || evento.frecuencia || 'no'
    });

    // En edición, dejamos el form en solo lectura (si quieres permitir edición, comenta esto)
    if (this.estaEditando) {
      this.eventoForm.disable();
    }

    this.sesiones.clear();
    if (evento.sesiones && Array.isArray(evento.sesiones)) {
      evento.sesiones.forEach((s: any) => {
        this.sesiones.push(this.fb.group({
          fecha: [s.fecha_sesion || s.fecha],
          horaInicio: [s.hora_inicio || s.horaInicio],
          horaFin: [s.hora_fin || s.horaFin],
          asistentes_sesion: [s.asistentes_sesion ?? 0]   // 👈 nuevo
        }));
      });
    }
  }


  guardarEvento(): void {
    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      console.log('⚠️ Formulario inválido.');
      return;
    }

    if (this.estaEditando && this.eventoParaEditar?.id) {
      this.actualizarSesion();
    } else {
      this.crearEvento();
    }
  }

  private crearEvento(): void {
    const evento = this.eventoForm.value;
    let sesiones: any[] = [];

    console.log('📋 Evento base:', evento);

    const fechaBase = new Date(evento.fecha);
    const finMes = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
    const actual = new Date(fechaBase);

    const nombreFrecuencia = this.frecuencias.find(f => f.id === evento.frecuencia)?.nombre || '';

    // Frecuencias
    if (nombreFrecuencia.toLowerCase() === 'a diario') {
      while (actual <= finMes) {
        if (actual.getDay() >= 1 && actual.getDay() <= 6) {
          sesiones.push(this.crearSesion(this.formatearFechaLocal(actual), evento.horaInicio, evento.horaFin, evento));
        }
        actual.setDate(actual.getDate() + 1);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'todos los dias de la semana') {
      while (actual <= finMes) {
        if (actual.getDay() >= 1 && actual.getDay() <= 5) {
          sesiones.push(this.crearSesion(this.formatearFechaLocal(actual), evento.horaInicio, evento.horaFin, evento));
        }
        actual.setDate(actual.getDate() + 1);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'semanalmente') {
      while (actual <= finMes) {
        sesiones.push(this.crearSesion(this.formatearFechaLocal(actual), evento.horaInicio, evento.horaFin, evento));
        actual.setDate(actual.getDate() + 7);
      }
    }

    if (nombreFrecuencia.toLowerCase() === 'mensualmente') {
      for (let i = 0; i < 3; i++) {
        const nuevaFecha = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + i, fechaBase.getDate());
        sesiones.push(this.crearSesion(this.formatearFechaLocal(nuevaFecha), evento.horaInicio, evento.horaFin, evento));
      }
    }

    // Evitar duplicados y solapamientos
    this.sesiones.controls.forEach(control => {
      const s = control.value;
      const nueva = this.crearSesion(s.fecha, s.horaInicio, s.horaFin, evento);

      const yaExiste = sesiones.some(ev =>
        ev.fecha === nueva.fecha && ev.horaInicio === nueva.horaInicio && ev.horaFin === nueva.horaFin
      );

      const haySolape = this.haySuperposicion(sesiones, nueva);

      if (!yaExiste && !haySolape) {
        sesiones.push(nueva);
      }
    });

    console.log('📦 Sesiones creadas:', sesiones);

    // 📤 Construir payload para el back
    const payload = {
      id_programa: '550e8400-e29b-41d4-a716-446655440000', // esto vendrá del back en producción
      institucional: evento.institucional ? 'S' : 'N',
      id_tipo_actividad: evento.tipoEvento,
      id_responsable: evento.responsable,
      id_aliado: evento.aliado,
      id_sede: evento.sede,
      id_frecuencia: evento.frecuencia,
      nombre_actividad: evento.nombreEvento,
      descripcion: evento.descripcionGrupo,
      fecha_actividad: evento.fecha,
      hora_inicio: evento.horaInicio,
      hora_fin: evento.horaFin,
      id_usuario: '550e8400-e29b-41d4-a716-446655440006'
    };

    console.log('📤 Enviando payload al back:', payload);

    this.eventService.crearEvento(payload).subscribe(resp => {
      console.log('📥 Respuesta del back:', resp);
      if (resp.exitoso === 'S') {
        console.log('✅ Evento creado correctamente');
        this.eventoGuardado.emit({ sesiones, editarUna: false, idSesionOriginal: null });
        this.resetearFormulario();
      } else {
        console.error('❌ Error al crear evento:', resp.mensaje);
      }
    });
  }

  actualizarSesion() {
    const sesiones = this.eventoForm.get('sesiones') as FormArray;

    if (sesiones.length === 0) {
      console.warn('⚠️ No hay sesiones para actualizar. Cerrando formulario...');

      // 🔁 Si es edición múltiple (repetido), eliminamos por nombre
      if (this.eventoParaEditar?.idSesion) {
        this.sesionEliminada.emit(this.eventoParaEditar.idSesion);
      } else if (this.eventoParaEditar?.nombreSesion) {
        this.sesionEliminada.emit(this.eventoParaEditar.nombreSesion); // <-- importantísimo
      }

      this.cerrarFormulario.emit();
      return;
    }

    const nuevasSesiones = sesiones.controls.map((control, i) => ({
      ...this.eventoParaEditar,
      ...control.value,
      id: this.eventoParaEditar?.sesiones?.[i]?.id || crypto.randomUUID() // mantener o crear ID
    }));

    console.log('📦 Sesiones a guardar (actualización múltiple):', nuevasSesiones);

    const editarUna = nuevasSesiones.length === 1;
    const idSesionOriginal = editarUna ? this.eventoParaEditar?.id : null;

    this.eventoEditado.emit({
      sesiones: nuevasSesiones,
      editarUna,
      idSesionOriginal
    });

    this.cerrarFormulario.emit();
  }



  private resetearFormulario(): void {
    this.eventoForm.reset();
    this.sesiones.clear();
    this.eventoParaEditar = null;
    this.cerrarFormulario.emit();
    this.limpiarEventoSeleccionado.emit();
  }

  private crearSesion(fecha: string, horaInicio: string, horaFin: string, base: any) {
    const idGenerado = crypto.randomUUID();
    const sesion = {
      ...base,
      fecha,
      horaInicio,
      horaFin,
      id: idGenerado
    };

    console.log(`🆕 Crear sesión → ID: ${idGenerado}, Fecha: ${fecha}, ${horaInicio} - ${horaFin}`);
    return sesion;
  }

  private haySuperposicion(sesiones: any[], nuevaSesion: any): boolean {
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
