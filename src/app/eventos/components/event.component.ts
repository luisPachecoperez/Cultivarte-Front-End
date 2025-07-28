import { Component, ElementRef, ViewChild,EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-event',
  templateUrl: './events.component.html',
  imports: [FormsModule, CommonModule],
})
export class EventComponent {

  private fb = inject(FormBuilder);
  @ViewChild('eventoModal') modalRef!: ElementRef;

  @Output() eventoGuardado = new EventEmitter<any>();

  evento: any = {
    institucional: null,
    tipoEvento: '',
    responsable: '',
    aliado: '',
    nombreSesion: '',
    descripcionGrupo: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    repeticion: ''
  };

  tiposEvento: string[] = ['Conferencia', 'Taller', 'Seminario', 'Reunión'];
  responsables: string[] = ['Juan', 'María', 'Pedro'];
  aliados: string[] = ['Aliado A', 'Aliado B', 'Aliado C'];

  // myForm:FormGroup = this.fb.group({
  //   nombreSesion:['',[Validators.required, Validators.]],
  // })

  abrirModal(fecha: string) {
    this.evento.fecha = fecha;
    const modal = new (window as any).bootstrap.Modal(this.modalRef.nativeElement);
    modal.show();
  }
  setFecha(fecha: string) {
    this.evento.fecha = fecha;
  }
  guardarEvento() {
    const start = `${this.evento.fecha}T${this.evento.horaInicio}`;
    const end = `${this.evento.fecha}T${this.evento.horaFin}`;
    const nuevoEvento = {
      title: this.evento.nombreSesion,
      start,
      end
    };

    this.eventoGuardado.emit(nuevoEvento);

    // Cierra el modal
    const modal = document.getElementById('eventoModal');
    if (modal) {
      (window as any).bootstrap.Modal.getOrCreateInstance(modal).hide();
    }

    // Limpia el formulario
    this.evento = {};
  }
}
