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

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventComponent implements OnInit, OnChanges {
  @Output() eventoGuardado = new EventEmitter<any>();
  @Input() fechaPreseleccionada: string | null = null; // 👈 nueva entrada
  @Input() eventoParaEditar: any = null;

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

  guardarEvento(): void {
    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      return;
    }

    const datos = this.eventoForm.value;

    // 👇 Si se está editando un evento, conservar su ID
    if (this.eventoParaEditar?.id) {
      datos.id = this.eventoParaEditar.id;
    }

    this.eventoGuardado.emit(datos);

    // Cierra el modal manualmente con Bootstrap
    const modalElement = document.getElementById('eventoModal');
    if (modalElement) {
      const instance = bootstrap.Modal.getInstance(modalElement)
        || new bootstrap.Modal(modalElement);
      instance.hide();
    }

    // Limpia el formulario
    this.eventoForm.reset();
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
