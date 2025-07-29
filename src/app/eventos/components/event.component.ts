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

  eventoForm!: FormGroup;

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
  if (changes['fechaPreseleccionada'] && this.fechaPreseleccionada) {
    this.eventoForm?.patchValue({
      fecha: this.fechaPreseleccionada
    });
  }
}
  guardarEvento(): void {
    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      return;
    }

    this.eventoGuardado.emit(this.eventoForm.value);

    const modalElement = document.getElementById('eventoModal');
    if (modalElement) {
      const instance = bootstrap.Modal.getInstance(modalElement)
        || new bootstrap.Modal(modalElement);
      instance.hide();
    }

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
