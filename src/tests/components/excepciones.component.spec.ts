import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExcepcionesComponent } from '../../app/excepciones/pages/excepciones.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcepcionesService } from '../../app/excepciones/services/excepciones.services';

const excepcionesServiceMock = {
  getExcepciones: jest.fn(),
  guardarCambiosExcepciones: jest.fn(),
};

describe('✅ ExcepcionesComponent', () => {
  let component: ExcepcionesComponent;
  let fixture: ComponentFixture<ExcepcionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, ExcepcionesComponent],
      providers: [
        { provide: ExcepcionesService, useValue: excepcionesServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExcepcionesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('✅ debe crear el componente', () => {
    expect(component).toBeTruthy();
    expect(component.excepciones).toBeDefined();
  });

  it('🧪 ngOnInit() debe llamar cargarExcepciones()', () => {
    const cargarSpy = jest.spyOn(component as any, 'cargarExcepciones').mockImplementation(() => Promise.resolve());
    component.ngOnInit();
    expect(cargarSpy).toHaveBeenCalled();
  });

  it('🧪 ngOnInit() debe cargar excepciones desde el servicio', async () => {
    excepcionesServiceMock.getExcepciones.mockResolvedValueOnce([
      { id_excepcion: '1', error: 'E1', mensaje: 'M1' },
    ]);
    await component['cargarExcepciones']();
    expect(component.excepciones.length).toBe(1);
    expect(component.excepciones[0].error).toBe('E1');
  });

  it('🧪 cargarExcepciones() debe dejar excepciones vacío si el servicio retorna undefined', async () => {
    excepcionesServiceMock.getExcepciones.mockResolvedValueOnce(undefined);
    await component['cargarExcepciones']();
    expect(component.excepciones).toEqual([]);
  });

  it('➕ agregarExcepcion() debe agregar a excepciones y nuevos', () => {
    component.errorInput = 'Error';
    component.mensajeInput = 'Mensaje';
    component.agregarExcepcion();
    expect(component.excepciones.length).toBe(1);
    expect(component.nuevos.length).toBe(1);
    expect(component.errorInput).toBe('');
    expect(component.mensajeInput).toBe('');
  });

  it('🗑️ eliminarExcepcion() debe eliminar de excepciones y agregar a eliminados si no es nuevo', () => {
    component.excepciones = [{ id: '1', error: 'E', mensaje: 'M' }];
    component.nuevos = [];
    component.eliminados = [];
    component.eliminarExcepcion('1');
    expect(component.excepciones.length).toBe(0);
    expect(component.eliminados[0].id_excepcion).toBe('1');
  });

  it('🗑️ eliminarExcepcion() debe eliminar de excepciones y de nuevos si es nuevo', () => {
    component.excepciones = [{ id: '2', error: 'E', mensaje: 'M' }];
    component.nuevos = [{ id: '2', error: 'E', mensaje: 'M' }];
    component.eliminados = [];
    component.eliminarExcepcion('2');
    expect(component.excepciones.length).toBe(0);
    expect(component.nuevos.length).toBe(0);
    expect(component.eliminados.length).toBe(0);
  });

  it('✏️ editarExcepcion() debe poner en modo edición y copiar datos', () => {
    const ex = { id: '3', error: 'E', mensaje: 'M' };
    component.editarExcepcion(ex);
    expect(component.editandoId).toBe('3');
    expect(component.errorInput).toBe('E');
    expect(component.mensajeInput).toBe('M');
    expect(component.excepcionBackup).toEqual(ex);
  });

  it('💾 guardarEdicionExcepcion() debe actualizar y agregar a modificados si no es nuevo', () => {
    component.excepciones = [{ id: '4', error: 'E', mensaje: 'M' }];
    component.nuevos = [];
    component.modificados = [];
    component.editandoId = '4';
    component.errorInput = 'E2';
    component.mensajeInput = 'M2';
    component.excepcionBackup = { id: '4', error: 'E', mensaje: 'M' };
    component.guardarEdicionExcepcion();
    expect(component.excepciones[0].error).toBe('E2');
    expect(component.modificados[0].id).toBe('4');
  });

  it('💾 guardarEdicionExcepcion() no agrega a modificados si es nuevo', () => {
    component.excepciones = [{ id: '5', error: 'E', mensaje: 'M' }];
    component.nuevos = [{ id: '5', error: 'E', mensaje: 'M' }];
    component.modificados = [];
    component.editandoId = '5';
    component.errorInput = 'E3';
    component.mensajeInput = 'M3';
    component.excepcionBackup = { id: '5', error: 'E', mensaje: 'M' };
    component.guardarEdicionExcepcion();
    expect(component.modificados.length).toBe(0);
  });

  it('🧪 guardarEdicionExcepcion() debe buscar correctamente en modificados usando editandoId', () => {
    component.excepciones = [{ id: '11', error: 'E', mensaje: 'M' }];
    component.nuevos = [];
    component.modificados = [{ id: '11', error: 'E', mensaje: 'M' }];
    component.editandoId = '11';
    component.errorInput = 'E11';
    component.mensajeInput = 'M11';
    component.excepcionBackup = { id: '11', error: 'E', mensaje: 'M' };

    // Ejecuta la edición
    component.guardarEdicionExcepcion();

    // Debe actualizar el objeto en modificados
    expect(component.modificados[0].error).toBe('E11');
    expect(component.modificados[0].mensaje).toBe('M11');
  });

  it('🚫 puedeActualizar() debe retornar false si no hay cambios o campos vacíos', () => {
    component.excepcionBackup = { id: '6', error: 'E', mensaje: 'M' };
    component.errorInput = '';
    component.mensajeInput = '';
    expect(component.puedeActualizar()).toBe(false);
    component.errorInput = 'E';
    component.mensajeInput = 'M';
    expect(component.puedeActualizar()).toBe(false);
  });

  it('🧪 puedeActualizar() debe retornar false si excepcionBackup es null', () => {
    component.excepcionBackup = null;
    component.errorInput = 'algo';
    component.mensajeInput = 'algo';
    expect(component.puedeActualizar()).toBe(false);
  });

  it('✅ puedeActualizar() debe retornar true si hay cambios y campos llenos', () => {
    component.excepcionBackup = { id: '7', error: 'E', mensaje: 'M' };
    component.errorInput = 'E7';
    component.mensajeInput = 'M7';
    expect(component.puedeActualizar()).toBe(true);
  });

  it('💾 guardarExcepciones() debe llamar al servicio y limpiar buffers', async () => {
    excepcionesServiceMock.guardarCambiosExcepciones.mockResolvedValueOnce({ exitoso: 'S', mensaje: 'OK' });
    component.nuevos = [{ id: '8', error: 'E', mensaje: 'M' }];
    component.modificados = [{ id: '9', error: 'E', mensaje: 'M' }];
    component.eliminados = [{ id_excepcion: '10' }];
    window.alert = jest.fn();
    await component.guardarExcepciones();
    expect(excepcionesServiceMock.guardarCambiosExcepciones).toHaveBeenCalled();
    expect(component.nuevos.length).toBe(0);
    expect(component.modificados.length).toBe(0);
    expect(component.eliminados.length).toBe(0);
  });

  it('🧪 cargarExcepciones() debe manejar error y mostrar en consola', async () => {
    const error = new Error('fallo');
    excepcionesServiceMock.getExcepciones.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component['cargarExcepciones']();
    expect(consoleSpy).toHaveBeenCalledWith('Error al cargar excepciones:', error);
    consoleSpy.mockRestore();
  });

  it('🧪 guardarExcepciones() debe mostrar alerta y loguear error si ocurre excepción', async () => {
    excepcionesServiceMock.guardarCambiosExcepciones.mockRejectedValueOnce(new Error('fallo guardar'));
    window.alert = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await component.guardarExcepciones();
    expect(window.alert).toHaveBeenCalledWith('Error al guardar excepciones');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('🧪 eliminarExcepcion() debe llamar cancelarEdicion si editandoId coincide con id', () => {
    component.excepciones = [{ id: '20', error: 'E', mensaje: 'M' }];
    component.nuevos = [];
    component.eliminados = [];
    component.editandoId = '20';
    const cancelarSpy = jest.spyOn(component, 'cancelarEdicion');
    component.eliminarExcepcion('20');
    expect(cancelarSpy).toHaveBeenCalled();
  });
});
