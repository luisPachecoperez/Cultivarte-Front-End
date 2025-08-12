import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class EventModalComponent {
  // 🔹 Señales para inputs
  evento = input<any>(null);

  // 🔹 Outputs con nueva API
  accionSeleccionada = output<'editar' | 'asistencia'>();
  cerrar = output<void>();

  seleccionarAccion(tipo: 'editar' | 'asistencia') {
    this.accionSeleccionada.emit(tipo);
    this.cerrar.emit(); // cerrar modal desde el padre
  }
}
