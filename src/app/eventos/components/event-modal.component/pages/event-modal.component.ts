import { Component, input, output, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventModalService } from '../services/event-modal.services';
import { Tooltip } from 'bootstrap';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarService } from '../../../../shared/services/snackbar.service'; // ajusta la ruta

@Component({
  selector: 'app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.css'],
  standalone: true,
  imports: [CommonModule, MatSnackBarModule]
})
export class EventModalComponent implements AfterViewInit {
  evento = input<any>(null);
  accionSeleccionada = output<'editar' | 'asistencia'>();
  cerrar = output<void>();

  mensajeResultado: string | null = null;
  exitoAccion = false;

  constructor(
    private eventModalService: EventModalService,
    private snack: SnackbarService
  ) {}

  ngAfterViewInit(): void {
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(el => new Tooltip(el));
  }

  seleccionarAccion(tipo: 'editar' | 'asistencia') {
    this.accionSeleccionada.emit(tipo);
    this.cerrar.emit();
  }

  eliminarEvento() {
    const e = this.evento();
    if (!e) return;

    this.snack
      .confirm(`¿Deseas eliminar el evento "${e?.nombreSesion?? 'sin nombre'}"?`)
      .subscribe((ok) => {
        if (!ok) return;

        this.eventModalService.eliminarEvento(e.id_actividad).subscribe({
          next: (res) => {
            const success = res.exitoso === 'S';
            success
              ? this.snack.success(res.mensaje ?? 'Eliminado correctamente')
              : this.snack.error(res.mensaje ?? 'No se pudo eliminar');

            if (success) this.cerrar.emit();
          },
          error: (err) => {
            this.snack.error(err?.mensaje ?? 'Error eliminando el evento');
          }
        });
      });
  }
}
