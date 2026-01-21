import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcepcionesService } from '../services/excepciones.services';

interface Excepcion {
  id: string;
  error: string;
  mensaje: string;
}

@Component({
  selector: 'app-excepciones',
  standalone: true,
  templateUrl: './excepciones.component.html',
  imports: [CommonModule, FormsModule],
})
export class ExcepcionesComponent implements OnInit {
  errorInput: string = '';
  mensajeInput: string = '';
  excepciones: Excepcion[] = [];
  editandoId: string | null = null;
  excepcionBackup: Excepcion | null = null;

  nuevos: Excepcion[] = [];
  modificados: Excepcion[] = [];
  eliminados: { id_excepcion: string }[] = [];

  private readonly excepcionesService = inject(ExcepcionesService);

  ngOnInit(): void {
    // Llama a la función async pero no retorna la promesa
    void this.cargarExcepciones();
  }

  private async cargarExcepciones() {
    try {
      const data = await this.excepcionesService.getExcepciones();
      this.excepciones = (data ?? []).map((e) => ({
        id: e.id_excepcion,
        error: e.error,
        mensaje: e.mensaje,
      }));
    } catch (err) {
      console.error('Error al cargar excepciones:', err);
    }
  }

  agregarExcepcion() {
    if (this.errorInput.trim() && this.mensajeInput.trim()) {
      const nueva: Excepcion = {
        id: crypto.randomUUID(),
        error: this.errorInput.trim(),
        mensaje: this.mensajeInput.trim(),
      };
      this.excepciones.push(nueva);
      this.nuevos.push(nueva);
      this.errorInput = '';
      this.mensajeInput = '';
    }
  }

  eliminarExcepcion(id: string) {
    this.excepciones = this.excepciones.filter((e) => e.id !== id);
    // Si es nuevo, lo quitamos de nuevos, si no, lo agregamos a eliminados
    const idxNuevo = this.nuevos.findIndex((e) => e.id === id);
    if (idxNuevo !== -1) {
      this.nuevos.splice(idxNuevo, 1);
    } else {
      this.eliminados.push({ id_excepcion: id });
    }
    if (this.editandoId === id) {
      this.cancelarEdicion();
    }
  }

  editarExcepcion(excepcion: Excepcion) {
    this.editandoId = excepcion.id;
    this.errorInput = excepcion.error;
    this.mensajeInput = excepcion.mensaje;
    this.excepcionBackup = { ...excepcion };
  }

  guardarEdicionExcepcion() {
    if (this.editandoId) {
      const idx = this.excepciones.findIndex((e) => e.id === this.editandoId);
      if (idx !== -1 && this.errorInput.trim() && this.mensajeInput.trim()) {
        this.excepciones[idx] = {
          ...this.excepciones[idx],
          error: this.errorInput.trim(),
          mensaje: this.mensajeInput.trim(),
        };
        // Si no es nuevo, lo agregamos a modificados (si no está ya)
        if (!this.nuevos.find((e) => e.id === this.editandoId)) {
          const yaModificado = this.modificados.find(
            (e) => e.id === this.editandoId,
          );
          if (!yaModificado) {
            this.modificados.push(this.excepciones[idx]);
          } else {
            // Actualiza el modificado si ya estaba
            Object.assign(yaModificado, this.excepciones[idx]);
          }
        }
      }
      this.cancelarEdicion();
    }
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.errorInput = '';
    this.mensajeInput = '';
    this.excepcionBackup = null;
  }

  puedeActualizar(): boolean {
    // Solo permite actualizar si ambos campos tienen texto y han cambiado respecto al backup
    if (!this.excepcionBackup) return false;
    // Forzar a boolean usando doble negación (!!)
    return (
      !!this.errorInput.trim() &&
      !!this.mensajeInput.trim() &&
      (this.errorInput.trim() !== this.excepcionBackup.error ||
        this.mensajeInput.trim() !== this.excepcionBackup.mensaje)
    );
  }

  async guardarExcepciones() {
    // Mapea los arrays al formato esperado por el backend
    const nuevosPayload = this.nuevos.map((e) => ({
      // Usa undefined en vez de null para id_excepcion
      id_excepcion: undefined,
      error: e.error,
      mensaje: e.mensaje,
      id_creado_por: undefined,
      fecha_creacion: undefined,
      id_modificado_por: undefined,
      fecha_modificacion: undefined,
    }));

    const modificadosPayload = this.modificados.map((e) => ({
      id_excepcion: e.id,
      error: e.error,
      mensaje: e.mensaje,
      id_creado_por: undefined,
      fecha_creacion: undefined,
      id_modificado_por: undefined,
      fecha_modificacion: undefined,
    }));

    const eliminadosPayload = this.eliminados.map((e) => ({
      id_excepcion: e.id_excepcion,
    }));

    const payload = {
      nuevos: nuevosPayload,
      modificados: modificadosPayload,
      eliminados: eliminadosPayload,
    };

    try {
      const resp =
        await this.excepcionesService.guardarCambiosExcepciones(payload);
      alert(resp.mensaje);
      // Limpia los buffers después de guardar
      this.nuevos = [];
      this.modificados = [];
      this.eliminados = [];
    } catch (err) {
      alert('Error al guardar excepciones');
      console.error(err);
    }
  }
}
