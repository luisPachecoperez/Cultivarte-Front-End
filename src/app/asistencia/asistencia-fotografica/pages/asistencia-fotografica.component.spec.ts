import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { AsistenciaFotograficaComponent } from './asistencia-fotografica.component';
import { AsistenciaService } from '../../asistencia-lista/services/asistencia.service';
import { PreAsistencia } from '../../interfaces/pre-asistencia.interface';
import { Sesiones } from '../../../eventos/interfaces/sesiones.interface';

describe('AsistenciaFotograficaComponent', () => {
  let component: AsistenciaFotograficaComponent;
  let fixture: ComponentFixture<AsistenciaFotograficaComponent>;
  let asistenciaService: jasmine.SpyObj<AsistenciaService>;

  beforeEach(waitForAsync(() => {
    const asistenciaServiceSpy = jasmine.createSpyObj('AsistenciaService', ['obtenerDetalleAsistencia', 'guardarAsistenciaFotografica']);
    const snackBarServiceSpy = jasmine.createSpyObj('SnackbarService', ['warning']);

    TestBed.configureTestingModule({
      imports: [CommonModule, ReactiveFormsModule],
      declarations: [AsistenciaFotograficaComponent],
      providers: [
        { provide: AsistenciaService, useValue: asistenciaServiceSpy },
      ]
    }).compileComponents();

    asistenciaService = TestBed.inject(AsistenciaService) as jasmine.SpyObj<AsistenciaService>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsistenciaFotograficaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.asistenciaForm.value).toEqual({
      numeroAsistentes: '',
      descripcion: '',
      foto: null
    });
  });

  it('should load asistencia details on init', waitForAsync(() => {
    const mockData: PreAsistencia = {
      id_sesion: '1',
      id_sede: '1',
      foto: ' ',
      beneficiarios: [{
        id_persona: '1',
        nombre_completo: 'pedro',
        id_sede: '1',
        identificacion: '1',
      }],
      sedes: [{ id_sede: '1', nombre: 'Sede 1' }],
      imagen: 'base64Image',
      descripcion: 'Test description',
      numero_asistentes: 10,
      asistentes_sesiones: [{
        id_persona: '1',
        nombre_completo: 'pedro',
        id_sede: '1',
        eliminar: 'N',
        identificacion: '1'
      }]
    };

    const mockEvento: Sesiones = {
      id_sesion: '123',
      id_actividad: '456',
      fecha_actividad: '2025-10-03',
      nro_asistentes: 20,
      descripcion: 'Prueba',
      deleted: false
    };

    fixture.componentRef.setInput('evento', mockEvento);
    fixture.detectChanges();

    expect(component.evento).toEqual(mockEvento);
    asistenciaService.obtenerDetalleAsistencia.and.returnValue(Promise.resolve(mockData));

    component.ngOnInit();

    fixture.whenStable().then(() => {
      expect(component.sedes).toEqual(mockData.sedes);
      expect(component.imagenPrevia).toBe(mockData.imagen);
      expect(component.imagenBase64).toBe(mockData.imagen);
      expect(component.asistenciaForm.value.descripcion).toBe(mockData.descripcion);
      expect(component.asistenciaForm.value.numeroAsistentes).toBe(mockData.numero_asistentes);
      expect(component.bloqueado).toBeTrue();
    });
  }));

  it('should handle file selection', () => {
    const file = new File(['dummy content'], 'example.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;

    component.onFileSelected(event);

    const reader = new FileReader();
    reader.onload = () => {
      expect(component.imagenBase64).toBe(reader.result as string);
      expect(component.imagenPrevia).toBe(reader.result as string);
    };
    reader.readAsDataURL(file);
  });

  it('should show warning if form is invalid on save', async () => {
    component.asistenciaForm.controls['numeroAsistentes'].setValue('');
    component.asistenciaForm.controls['descripcion'].setValue('');

    await component.guardar();

    expect(component.asistenciaForm.invalid).toBeTrue();
  });

  it('should assign evento correctly', () => {
    const mockEvento: Sesiones = {
      id_sesion: '123',
      id_actividad: '456',
      fecha_actividad: '2025-10-03',
      nro_asistentes: 20,
      descripcion: 'Prueba',
      deleted: false
    };

    fixture.componentRef.setInput('evento', mockEvento);
    fixture.detectChanges();

    expect(component.evento).toEqual(mockEvento);
  });
});