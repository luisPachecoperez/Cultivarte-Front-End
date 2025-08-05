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

  tiposEvento = ['Taller', 'Conferencia', 'Seminario'];
  responsables = ['Juan', 'Ana', 'Carlos'];
  aliados = ['Aliado A', 'Aliado B', 'Aliado C'];

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.eventoForm = this.fb.group({
      institucional: [null, Validators.required],
      tipoEvento: ['', Validators.required],
      responsable: ['', Validators.required],
      aliado: [''],
      nombreSesion: ['', [Validators.required, this.uppercaseMaxLengthValidator(30)]],
      descripcionGrupo: [''],
      fecha: [this._fechaPreseleccionada ?? '', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      repeticion: ['no'],
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
      descripcionGrupo: evento.descripcionGrupo,
      fecha: evento.fecha,
      horaInicio: evento.horaInicio,
      horaFin: evento.horaFin,
      repeticion: evento.repeticion || 'no'
    });

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
      return;
    }

    const evento = this.eventoForm.value;
    let sesiones: any[] = [];

    // Si NO se repite, creamos una sola sesión base
    if (evento.repeticion === 'no') {
      sesiones.push(this.crearSesion(evento.fecha, evento.horaInicio, evento.horaFin, evento));
    }

    // Si tiene repetición (diaria, semanal, mensual)
    else {
      const fechaBase = new Date(evento.fecha);
      const finMes = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
      const actual = new Date(fechaBase);

      if (evento.repeticion === 'diario') {
        while (actual <= finMes) {
          const fechaStr = actual.toISOString().split('T')[0];
          sesiones.push(this.crearSesion(fechaStr, evento.horaInicio, evento.horaFin, evento));
          actual.setDate(actual.getDate() + 1);
        }
      }

      if (evento.repeticion === 'semanal') {
        while (actual <= finMes) {
          const fechaStr = actual.toISOString().split('T')[0];
          sesiones.push(this.crearSesion(fechaStr, evento.horaInicio, evento.horaFin, evento));
          actual.setDate(actual.getDate() + 7);
        }
      }

      if (evento.repeticion === 'mensual') {
        for (let i = 0; i < 3; i++) {
          const nuevaFecha = new Date(
            fechaBase.getFullYear(),
            fechaBase.getMonth() + i,
            fechaBase.getDate()
          );
          const fechaStr = nuevaFecha.toISOString().split('T')[0];
          sesiones.push(this.crearSesion(fechaStr, evento.horaInicio, evento.horaFin, evento));
        }
      }
    }

    // Agregar todas las sesiones modificadas manualmente desde el grid
    this.sesiones.controls.forEach(control => {
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

    this.eventoGuardado.emit({
      sesiones,
      editarUna: this.estaEditando && sesiones.length === 1,
      idSesionOriginal: this.eventoParaEditar?.id || null
    });

    this.eventoForm.reset();
    this.sesiones.clear();
    this.eventoParaEditar = null;
    this.cerrarFormulario.emit();
    this.limpiarEventoSeleccionado.emit();
  }

  private crearSesion(fecha: string, horaInicio: string, horaFin: string, base: any) {
    return {
      ...base,
      fecha,
      horaInicio,
      horaFin,
      id: `${base.nombreSesion}-${fecha}-${horaInicio}`
    };
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
