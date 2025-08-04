import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.css']
})
export class AsistenciaComponent implements OnInit {
  @Input() evento: any;
  @Output() cerrar = new EventEmitter<void>(); // Cambiado de cerrarModal → cerrar

  beneficiariosBD: any[] = [];
  asistentes: any[] = [];
  filtro = new FormControl('');

  ngOnInit(): void {
    this.beneficiariosBD = [
      { nombre: 'ANGIE RIOS', codigo: '1243' },
      { nombre: 'JUAN RODRIGUEZ', codigo: '2345' },
      { nombre: 'MARTA PÉREZ', codigo: '4321' },
      { nombre: 'LUIS MARTÍNEZ', codigo: '6789' },
      { nombre: 'CAMILA GÓMEZ', codigo: '9876' },
      { nombre: 'DIEGO LÓPEZ', codigo: '1111' },
      { nombre: 'VALENTINA RAMOS', codigo: '2222' },
      { nombre: 'CARLOS DÍAZ', codigo: '3333' },
      { nombre: 'ANA SANDOVAL', codigo: '4444' },
      { nombre: 'FERNANDO SUÁREZ', codigo: '5555' },
      { nombre: 'MARÍA JIMÉNEZ', codigo: '6666' },
      { nombre: 'PABLO RIVERA', codigo: '7777' },
      { nombre: 'DANIELA MORA', codigo: '8888' },
      { nombre: 'JORGE TORO', codigo: '9999' },
      { nombre: 'LAURA NAVARRO', codigo: '1010' },
      { nombre: 'RAFAEL MESA', codigo: '2020' },
      { nombre: 'PAOLA CÁRDENAS', codigo: '3030' },
      { nombre: 'IVÁN ARIAS', codigo: '4040' },
      { nombre: 'MELISSA MEJÍA', codigo: '5050' },
      { nombre: 'ESTEBAN GARCÍA', codigo: '6060' }
    ];
  }

  get resultadosBusqueda() {
    const texto = this.filtro.value?.toLowerCase() || '';
    if (!texto || texto.trim().length < 1) return [];
    return this.beneficiariosBD.filter(b =>
      b.nombre.toLowerCase().includes(texto) || b.codigo.includes(texto)
    );
  }

  agregarAsistente(beneficiario: any) {
    if (!this.asistentes.find(a => a.codigo === beneficiario.codigo)) {
      this.asistentes.push({ ...beneficiario });
    }
  }

  eliminarAsistente(codigo: string) {
    this.asistentes = this.asistentes.filter(a => a.codigo !== codigo);
  }

  guardarAsistencia() {
    const resumen = this.asistentes.map(a => `${a.nombre} (${a.codigo})`);
    console.log('📝 Asistencia registrada:', resumen);
    this.cerrar.emit();
  }
}
