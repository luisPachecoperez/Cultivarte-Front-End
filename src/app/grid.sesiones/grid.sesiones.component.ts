import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-grid-sesiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grid.sesiones.component.html'
})
export class GridSesionesComponent {
  @Input() sesiones: any[] = [];
  @Output() sesionesChange = new EventEmitter<any[]>();

  nuevaSesion = {
    fecha: '',
    horaInicio: '',
    horaFin: ''
  };

  agregarSesion(): void {
    if (this.nuevaSesion.fecha && this.nuevaSesion.horaInicio && this.nuevaSesion.horaFin) {
      this.sesiones.push({ ...this.nuevaSesion });
      this.sesionesChange.emit(this.sesiones);
      this.nuevaSesion = { fecha: '', horaInicio: '', horaFin: '' };
    }
  }

  eliminarSesion(index: number): void {
    this.sesiones.splice(index, 1);
    this.sesionesChange.emit(this.sesiones);
  }
}
