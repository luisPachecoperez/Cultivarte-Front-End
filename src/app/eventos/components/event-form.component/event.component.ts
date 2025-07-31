import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
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
  ValidationErrors
} from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { EventModalComponent } from '../event-modal.component/event-modal.component';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EventModalComponent],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventComponent implements OnInit, OnChanges {
  @Input() eventoSeleccionado: any = null; // recibido del abuelo
  @Output() limpiarEventoSeleccionado = new EventEmitter<void>(); // para decirle al abuelo que limpie
  @Output() eventoEditado = new EventEmitter<any>(); //
  @Output() eventoGuardado = new EventEmitter<any>();
  @Input() fechaPreseleccionada: string | null = null;
  eventoParaEditar: any = null;

  eventoForm!: FormGroup;
  get estaEditando(): boolean {
    return !!this.eventoParaEditar;
  }

  tiposEvento = ['Taller', 'Conferencia', 'Seminario'];
  responsables = ['Juan', 'Ana', 'Carlos'];
  aliados = ['Aliado A', 'Aliado B', 'Aliado C'];

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.eventoForm = this.fb.group({
      institucional: [false, Validators.required],
      tipoEvento: ['', Validators.required],
      responsable: ['', Validators.required],
      aliado: [''],
      nombreSesion: ['', [Validators.required, this.uppercaseMaxLengthValidator(30)]],
      descripcionGrupo: [''],
      fecha: [Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      repeticion: ['']
    });

    this.eventoForm.get('nombreSesion')?.valueChanges.subscribe(value => {
      const upper = value?.toUpperCase() || '';
      if (value !== upper) {
        this.eventoForm.get('nombreSesion')?.setValue(upper, { emitEvent: false });
      }
    });
  }
  // ✅ Detectar cambios en @Input y actualizar formulario
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fechaPreseleccionada'] && this.fechaPreseleccionada && !this.eventoParaEditar) {
      // Nueva creación: reset y precargar fecha
      this.eventoForm?.reset();
      this.eventoForm?.patchValue({ fecha: this.fechaPreseleccionada });
    }

    if (changes['eventoSeleccionado'] && this.eventoSeleccionado) {
      console.log('✅ RECIBIDO EN HIJO:', this.eventoSeleccionado);
      const modal = new bootstrap.Modal(document.getElementById('modalAcciones')!);
      modal.show();
    }

    if (changes['eventoParaEditar'] && this.eventoParaEditar) {
      // Edición: precargar datos
      this.eventoForm?.patchValue({
        institucional: this.eventoParaEditar.institucional,
        tipoEvento: this.eventoParaEditar.tipoEvento,
        responsable: this.eventoParaEditar.responsable,
        aliado: this.eventoParaEditar.aliado,
        nombreSesion: this.eventoParaEditar.nombreSesion,
        descripcionGrupo: this.eventoParaEditar.descripcionGrupo,
        fecha: this.eventoParaEditar.fecha,
        horaInicio: this.eventoParaEditar.horaInicio,
        horaFin: this.eventoParaEditar.horaFin,
        repeticion: this.eventoParaEditar.repeticion,
      });
    }
  }

  onAccionSeleccionada(accion: 'editar' | 'asistencia') {
    if (accion === 'editar') {
      this.eventoParaEditar = this.eventoSeleccionado;

      // Pre-cargar el formulario con los datos del evento seleccionado
      if (this.eventoParaEditar) {
        this.eventoForm.patchValue({
          institucional: this.eventoParaEditar.institucional,
          nombreSesion: this.eventoParaEditar.nombreSesion,
          tipoEvento: this.eventoParaEditar.tipoEvento,
          responsable: this.eventoParaEditar.responsable,
          aliado: this.eventoParaEditar.aliado,
          descripcionGrupo: this.eventoParaEditar.descripcionGrupo,
          fecha: this.eventoParaEditar.fecha,
          horaInicio: this.eventoParaEditar.horaInicio,
          horaFin: this.eventoParaEditar.horaFin,
          repeticion: this.eventoParaEditar.repeticion,
        });
      }

      // Cierra el modal de acciones
      const modalAcciones = bootstrap.Modal.getInstance(document.getElementById('modalAcciones')!);
      modalAcciones?.hide();

      // Abre el modal del formulario
      const modalFormulario = new bootstrap.Modal(document.getElementById('eventoModal')!);
      modalFormulario.show();
    }

    if (accion === 'asistencia') {
      console.log('Tomar asistencia aún no implementado');
    }

    this.limpiarEventoSeleccionado.emit(); // informar al padre que ya se usó el evento
  }


  guardarEvento(): void {
    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      return;
    }

    const evento = this.eventoForm.value;
    const eventosAGuardar = [];

    const fechaBase = new Date(evento.fecha);
    const finDelMes = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0); // último día del mes

    if (evento.repeticion === 'no') {
      eventosAGuardar.push(evento);
    } else if (evento.repeticion === 'diario') {
      const actual = new Date(fechaBase);
      while (actual <= finDelMes) {
        eventosAGuardar.push({
          ...evento,
          fecha: actual.toISOString().split('T')[0]
        });
        actual.setDate(actual.getDate() + 1);
      }
    } else if (evento.repeticion === 'semanal') {
      const actual = new Date(fechaBase);
      while (actual <= finDelMes) {
        eventosAGuardar.push({
          ...evento,
          fecha: actual.toISOString().split('T')[0]
        });
        actual.setDate(actual.getDate() + 7);
      }
    } else if (evento.repeticion === 'mensual') {
      const actual = new Date(fechaBase);
      const mesesFuturos = 3; // cambia si quieres más meses

      for (let i = 0; i < mesesFuturos; i++) {
        const fechaNueva = new Date(actual.getFullYear(), actual.getMonth() + i, actual.getDate());
        eventosAGuardar.push({
          ...evento,
          fecha: fechaNueva.toISOString().split('T')[0]
        });
      }
    }

    // Emitir todos los eventos
    eventosAGuardar.forEach(e => this.eventoGuardado.emit(e));

    // Cerrar modal y resetear
    const modalElement = document.getElementById('eventoModal');
    if (modalElement) {
      const instance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      instance.hide();
    }

    this.eventoForm.reset();
    this.eventoParaEditar = null;
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
