import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class EventModalComponent {
  @Input() evento: any;

  @Output() accionSeleccionada = new EventEmitter<'editar' | 'asistencia'>();
  @Output() cerrar = new EventEmitter<void>();

  seleccionarAccion(tipo: 'editar' | 'asistencia') {
    this.accionSeleccionada.emit(tipo);
    this.cerrar.emit(); // cerrar modal desde el padre
  }
}
