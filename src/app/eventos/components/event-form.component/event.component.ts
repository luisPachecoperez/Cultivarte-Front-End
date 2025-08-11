import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  OnChanges,
  inject
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

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GridSesionesComponent],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventComponent implements OnInit, OnChanges {
  @Input() eventoSeleccionado: any = null;

  private _fechaPreseleccionada: string | null = null;
  actualizarSesionEnCalendario: any;
  @Input() set fechaPreseleccionada(value: string | null) {
    this._fechaPreseleccionada = value;
    if (value && this.eventoForm) {
      this.eventoForm.patchValue({ fecha: value });
    }
  }
  get fechaPreseleccionada(): string | null {
    return this._fechaPreseleccionada;
  }

  @Input() mostrarFormulario: boolean = false;

  @Output() limpiarEventoSeleccionado = new EventEmitter<void>();
  @Output() eventoEditado = new EventEmitter<any>();
  @Output() eventoGuardado = new EventEmitter<any>();
  @Output() cerrarFormulario = new EventEmitter<void>();

  eventoForm!: FormGroup;
  eventoParaEditar: any = null;

  get estaEditando(): boolean {
    return !!this.eventoParaEditar;
  }
  get modoSoloLectura(): boolean {
    // Solo es readonly cuando se está editando UNA sesión (no el evento completo)
    return this.estaEditando && this.eventoParaEditar?.idSesion;
  }
  tiposEvento: string[] = [
    'Contenido del ciclo',
    'Local',
    'Actividad general',
    'Actividad institucional',
    'Actividad',
    'Ludoteca Viajera'
  ];
  responsables = ['Coordinador', 'Ludotecario', 'Aliado', 'Voluntario'];
  aliados = ['Aliado A', 'Aliado B', 'Aliado C'];

  // Listas de nombres según tipo de evento
  nombresContenidoCiclo = ['Nombre A', 'Nombre B', 'Nombre C'];
  nombresActividadGeneral = ['Nombre D', 'Nombre E', 'Nombre F'];
  sedes = ['Sede A', 'Sede B', 'Sede C'];

  // Getter para obtener la lista correcta
  get nombresSegunTipo(): string[] {
    const tipo = this.eventoForm.get('tipoEvento')?.value;
    if (tipo === 'Contenido del ciclo') return this.nombresContenidoCiclo;
    if (tipo === 'Actividad general') return this.nombresActividadGeneral;
    return [];
  }


  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.eventoForm = this.fb.group({
      institucional: [{ value: null, disabled: this.estaEditando }, Validators.required],
      tipoEvento: [{ value: '', disabled: this.estaEditando }, Validators.required],
      responsable: [{ value: '', disabled: this.estaEditando }, Validators.required],
      aliado: [{ value: '', disabled: this.estaEditando }],
      sedes: [{ value: '', disabled: this.estaEditando }],
      nombreSesion: [{ value: '', disabled: this.estaEditando }, [Validators.required, this.uppercaseMaxLengthValidator(30)]],
      descripcionGrupo: [{ value: '', disabled: this.estaEditando }],
      fecha: [{ value: this._fechaPreseleccionada ?? '', disabled: this.estaEditando }, Validators.required],
      horaInicio: [{ value: '', disabled: this.estaEditando }, Validators.required],
      horaFin: [{ value: '', disabled: this.estaEditando }, Validators.required],
      repeticion: [{ value: 'no', disabled: this.estaEditando }],
      sesiones: this.fb.array([])
    });

    this.eventoForm.get('nombreSesion')?.valueChanges.subscribe(value => {
      const upper = value?.toUpperCase() || '';
      if (value !== upper) {
        this.eventoForm.get('nombreSesion')?.setValue(upper, { emitEvent: false });
      }
    });

    if (this.eventoSeleccionado) {
      this.eventoParaEditar = this.eventoSeleccionado;
      this.precargarFormulario(this.eventoSeleccionado);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventoSeleccionado'] && this.eventoSeleccionado && this.eventoForm) {
      this.eventoParaEditar = this.eventoSeleccionado;
      this.precargarFormulario(this.eventoSeleccionado);
    }
  }

  get sesiones(): FormArray {
    return this.eventoForm?.get('sesiones') as FormArray;
  }

  onAccionSeleccionada(accion: 'editar' | 'asistencia') {
    if (accion === 'editar') {
      this.eventoParaEditar = this.eventoSeleccionado;
      console.log('Editar evento', this.eventoParaEditar);
      this.precargarFormulario(this.eventoParaEditar);
    }

    if (accion === 'asistencia') {
      console.log('Tomar asistencia aún no implementado');
    }

    this.limpiarEventoSeleccionado.emit();
  }

  precargarFormulario(evento: any): void {
    if (!this.eventoForm) return;

    this.eventoForm.patchValue({
      institucional: evento.institucional,
      tipoEvento: evento.tipoEvento,
      responsable: evento.responsable,
      aliado: evento.aliado,
      nombreSesion: evento.nombreSesion,
      sedes: evento.sedes,
      descripcionGrupo: evento.descripcionGrupo,
      fecha: evento.fecha,
      horaInicio: evento.horaInicio,
      horaFin: evento.horaFin,
      repeticion: evento.repeticion || 'no'
    });

    if (this.estaEditando) {
      this.eventoForm.get('institucional')?.disable();
      this.eventoForm.get('tipoEvento')?.disable();
      this.eventoForm.get('responsable')?.disable();
      this.eventoForm.get('aliado')?.disable();
      this.eventoForm.get('nombreSesion')?.disable();
      this.eventoForm.get('sedes')?.disable();
      this.eventoForm.get('descripcionGrupo')?.disable();
      this.eventoForm.get('fecha')?.disable();
      this.eventoForm.get('horaInicio')?.disable();
      this.eventoForm.get('horaFin')?.disable();
      this.eventoForm.get('repeticion')?.disable();
    }


    this.sesiones.clear();
    if (evento.sesiones && Array.isArray(evento.sesiones)) {
      evento.sesiones.forEach((s: any) => {
        this.sesiones.push(this.fb.group({
          fecha: [s.fecha],
          horaInicio: [s.horaInicio],
          horaFin: [s.horaFin]
        }));
      });
    }
  }

  guardarEvento(): void {
    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      console.log('⚠️ Formulario inválido. Revisa los campos.');
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
    console.log('📅 Fecha base:', evento.fecha);
    console.log('📅 Hora fin:', evento.horaFin);
    console.log('📅 Hora inicio:', evento.horaInicio);

    if (evento.repeticion === 'no') {
      sesiones.push(this.crearSesion(evento.fecha, evento.horaInicio, evento.horaFin, evento));
    }

    if (evento.repeticion === 'diario') {
      while (actual <= finMes) {
        sesiones.push(this.crearSesion(actual.toISOString().split('T')[0], evento.horaInicio, evento.horaFin, evento));
        actual.setDate(actual.getDate() + 1);
      }
    }

    if (evento.repeticion === 'semanal') {
      while (actual <= finMes) {
        sesiones.push(this.crearSesion(actual.toISOString().split('T')[0], evento.horaInicio, evento.horaFin, evento));
        actual.setDate(actual.getDate() + 7);
      }
    }

    if (evento.repeticion === 'mensual') {
      for (let i = 0; i < 3; i++) {
        const nuevaFecha = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + i, fechaBase.getDate());
        sesiones.push(this.crearSesion(nuevaFecha.toISOString().split('T')[0], evento.horaInicio, evento.horaFin, evento));
      }
    }

    this.sesiones.controls.forEach((control, i) => {
      const s = control.value;
      const nueva = this.crearSesion(s.fecha, s.horaInicio, s.horaFin, evento);

      const yaExiste = sesiones.some(ev =>
        ev.fecha === nueva.fecha &&
        ev.horaInicio === nueva.horaInicio &&
        ev.horaFin === nueva.horaFin
      );

      const haySolape = this.haySuperposicion(sesiones, nueva);

      if (!yaExiste && !haySolape) {
        sesiones.push(nueva);
      }
    });

    console.log('📦 Sesiones creadas:', sesiones);
    sesiones.forEach((s, i) =>
      console.log(`   #${i + 1}: ${s.id} → ${s.fecha} ${s.horaInicio}-${s.horaFin}`)
    );

    this.eventoGuardado.emit({
      sesiones,
      editarUna: false,
      idSesionOriginal: null
    });

    this.resetearFormulario();
  }

  @Output() sesionEliminada = new EventEmitter<string>();

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
