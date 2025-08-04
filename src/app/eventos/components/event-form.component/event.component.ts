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
import { EventModalComponent } from '../event-modal.component/event-modal.component';
import { GridSesionesComponent } from '../../../grid.sesiones/grid.sesiones.component';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EventModalComponent, GridSesionesComponent],
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

    // Si ya hay un evento seleccionado al iniciar, precargarlo
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
    const sesiones: any[] = [];

    const fechaBase = new Date(evento.fecha);
    const finMes = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);

    if (evento.repeticion === 'no') {
      sesiones.push({
        ...evento,
        fecha: evento.fecha,
        horaInicio: evento.horaInicio,
        horaFin: evento.horaFin,
        id: `${evento.nombreSesion}-${evento.fecha}-${evento.horaInicio}`
      });
    } else if (evento.repeticion === 'diario') {
      const actual = new Date(fechaBase);
      while (actual <= finMes) {
        const fechaStr = actual.toISOString().split('T')[0];
        sesiones.push({
          ...evento,
          fecha: fechaStr,
          horaInicio: evento.horaInicio,
          horaFin: evento.horaFin,
          id: `${evento.nombreSesion}-${fechaStr}-${evento.horaInicio}`
        });
        actual.setDate(actual.getDate() + 1);
      }
    } else if (evento.repeticion === 'semanal') {
      const actual = new Date(fechaBase);
      while (actual <= finMes) {
        const fechaStr = actual.toISOString().split('T')[0];
        sesiones.push({
          ...evento,
          fecha: fechaStr,
          horaInicio: evento.horaInicio,
          horaFin: evento.horaFin,
          id: `${evento.nombreSesion}-${fechaStr}-${evento.horaInicio}`
        });
        actual.setDate(actual.getDate() + 7);
      }
    } else if (evento.repeticion === 'mensual') {
      for (let i = 0; i < 3; i++) {
        const fechaNueva = new Date(
          fechaBase.getFullYear(),
          fechaBase.getMonth() + i,
          fechaBase.getDate()
        );
        const fechaStr = fechaNueva.toISOString().split('T')[0];
        sesiones.push({
          ...evento,
          fecha: fechaStr,
          horaInicio: evento.horaInicio,
          horaFin: evento.horaFin,
          id: `${evento.nombreSesion}-${fechaStr}-${evento.horaInicio}`
        });
      }
    }

    const totalAntes = sesiones.length;

    this.sesiones.controls.forEach(control => {
      const s = control.value;
      const nueva = {
        ...evento,
        fecha: s.fecha,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        id: `${evento.nombreSesion}-${s.fecha}-${s.horaInicio}`
      };

      const duplicadoExacto = sesiones.some(ev =>
        ev.fecha === nueva.fecha &&
        ev.horaInicio === nueva.horaInicio &&
        ev.horaFin === nueva.horaFin
      );

      const solapa = this.haySuperposicion(sesiones, nueva);

      if (!duplicadoExacto && !solapa) {
        sesiones.push(nueva);
      }
    });

    const totalDespues = sesiones.length;
    if (totalDespues < totalAntes + this.sesiones.length) {
      alert('⚠️ Algunas sesiones fueron descartadas por superposición de horarios.');
    }

    // En vez de emitir simplemente `sesiones`, emite metadatos
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
