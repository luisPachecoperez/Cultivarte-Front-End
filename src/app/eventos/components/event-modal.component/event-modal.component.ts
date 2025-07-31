import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Modal } from 'bootstrap';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.component.html',
  // styleUrls: ['./event-modal.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class EventModalComponent {
  @Input() evento: any;
  @Output() accionSeleccionada = new EventEmitter<'editar' | 'asistencia'>();

  seleccionarAccion(tipo: 'editar' | 'asistencia') {
    this.accionSeleccionada.emit(tipo);

    const modalElement = document.getElementById('modalAcciones');
    if (modalElement) {
      const modal = Modal.getInstance(modalElement);
      modal?.hide();
    }
  }
}
