import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisBeneficiarioComponent } from '../../app/beneficiarios/registro/page/regis_beneficiario.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BeneficiariosService } from '../../app/beneficiarios/registro/services/beneficiarios.service';
import { AuthService } from '../../app/shared/services/auth.service';
import { of } from 'rxjs';

// ---- Mock Services ----
const beneficiariosServiceMock = {
  getPreBeneficiarios: jest.fn(),
  getPersonasParams: jest.fn(),
  guardarCambiosBeneficiarios: jest.fn(),
};
const authServiceMock = {
  getUserUuid: jest.fn(),
};

describe('✅ RegisBeneficiarioComponent', () => {
  let component: RegisBeneficiarioComponent;
  let fixture: ComponentFixture<RegisBeneficiarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RegisBeneficiarioComponent,
      ],
      providers: [
        { provide: BeneficiariosService, useValue: beneficiariosServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisBeneficiarioComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('✅ debe crear el componente', () => {
    expect(component).toBeTruthy();
    expect(component.beneficiarioForm).toBeDefined();
  });

  it('📥 ngOnInit() debe cargar datos iniciales y asignar selects', async () => {
    component.usuarioLogueado = { id: 'user1', nombre: 'Tester' };
    const mockData = [
      {
        id_programa: 'P1',
        id_grupo_interes: 'G1',
        sedes: [{ id_sede: '1', nombre: 'Sede 1' }],
        tiposIdentificacion: [{ id_tipo_identificacion: 'CC', nombre: 'Cédula' }],
        tiposPersona: [{ id_tipo_identificacion: 'NAT', nombre: 'Natural' }],
        sexo: [{ id_sexo: 'M', nombre: 'Masculino' }],
        ubicaciones: [{ id_ubicacion: 'U', nombre: 'Urbano' }],
        paises: [],
      },
    ];
    beneficiariosServiceMock.getPreBeneficiarios.mockResolvedValueOnce(mockData);

    await component.cargarDatosIniciales();

    expect(component.sedesUsuario.length).toBe(1);
    expect(component.tiposIdentificacion.length).toBe(1);
    expect(component.tiposPersona.length).toBe(1);
    expect(component.sexos.length).toBe(1);
    expect(component.ubicaciones.length).toBe(1);
  });

  it('🔍 filtrarBeneficiarios() debe filtrar por nombre, apellido o identificación', () => {
    component.ninosSedeActual = [
      { nombres: 'Ana', apellidos: 'Pérez', identificacion: '123' } as any,
      { nombres: 'Luis', apellidos: 'Díaz', identificacion: '456' } as any,
    ];
    component.filtrarBeneficiarios('ana');
    expect(component.ninosFiltrados.length).toBe(1);
    expect(component.ninosFiltrados[0].nombres).toBe('Ana');

    component.filtrarBeneficiarios('díaz');
    expect(component.ninosFiltrados.length).toBe(1);
    expect(component.ninosFiltrados[0].apellidos).toBe('Díaz');

    component.filtrarBeneficiarios('456');
    expect(component.ninosFiltrados.length).toBe(1);
    expect(component.ninosFiltrados[0].identificacion).toBe('456');
  });

  it('🔍 filtrarBeneficiarios() debe devolver todos si filtro vacío', () => {
    component.ninosSedeActual = [
      { nombres: 'Ana', apellidos: 'Pérez', identificacion: '123' } as any,
      { nombres: 'Luis', apellidos: 'Díaz', identificacion: '456' } as any,
    ];
    component.filtrarBeneficiarios('');
    expect(component.ninosFiltrados.length).toBe(2);
  });

  it('🧪 filtrarBeneficiarios() no debe incluir beneficiarios si nombres no coincide (debe devolver array vacío)', () => {
    component.ninosSedeActual = [
      { nombres: 'Ana', apellidos: 'Pérez', identificacion: '123' } as any,
      { nombres: 'Luis', apellidos: 'Díaz', identificacion: '456' } as any,
    ];
    // Filtro que no coincide con ningún nombre
    component.filtrarBeneficiarios('zzzzzz');
    expect(component.ninosFiltrados.length).toBe(0);
  });

  it('🧪 filtrarBeneficiarios() no debe incluir beneficiarios si nombres es undefined (debe devolver array vacío)', () => {
    component.ninosSedeActual = [
      { apellidos: 'Pérez', identificacion: '123' } as any, // nombres es undefined
      { apellidos: 'Díaz', identificacion: '456' } as any,
    ];
    component.filtrarBeneficiarios('ana'); // filtro que no coincide con nada en nombres
    expect(component.ninosFiltrados.length).toBe(0);
  });

  it('🧪 filtrarBeneficiarios() no debe incluir beneficiarios si apellidos es undefined (debe devolver array vacío)', () => {
    component.ninosSedeActual = [
      { nombres: 'Ana', identificacion: '123' } as any, // apellidos es undefined
      { nombres: 'Luis', identificacion: '456' } as any,
    ];
    component.filtrarBeneficiarios('perez'); // filtro que no coincide con nada en apellidos
    expect(component.ninosFiltrados.length).toBe(0);
  });

  it('🧪 filtrarBeneficiarios() no debe incluir beneficiarios si identificacion es undefined (debe devolver array vacío)', () => {
    component.ninosSedeActual = [
      { nombres: 'Ana', apellidos: 'Pérez' } as any, // identificacion es undefined
      { nombres: 'Luis', apellidos: 'Díaz' } as any,
    ];
    component.filtrarBeneficiarios('123'); // filtro que no coincide con nada en identificacion
    expect(component.ninosFiltrados.length).toBe(0);
  });

  it('➕ agregarBeneficiario() debe agregar un nuevo beneficiario', () => {
    component.beneficiarioForm.setValue({
      sede: '1',
      tipoIdentificacion: 'CC',
      tipoPersona: 'Natural',
      identificacion: '999',
      nombres: 'Nuevo',
      apellidos: 'Beneficiario',
      fechaNacimiento: '2000-01-01',
      sexo: 'M',
      ubicacion: 'U',
      discapacidad: '',
      acudienteTipoIdentificacion: '',
      acudienteIdentificacion: '',
      acudienteNombres: '',
      acudienteApellidos: '',
      acudienteCorreo: '',
      acudienteCelular: '',
      habeasArchivo: null,
      fechaHabeas: '',
    });
    component.sedeSeleccionada = { id_sede: '1', nombre: 'Sede 1' };
    component.ninosSedeActual = [];
    component.beneficiariosNuevos = [];

    component.agregarBeneficiario();

    expect(component.beneficiariosNuevos.length).toBe(1);
    expect(component.ninosSedeActual.length).toBe(1);
    expect(component.beneficiarioForm.value.nombres).toBeNull();
  });

  it('🗑️ eliminarBeneficiario() debe eliminar y agregar a eliminados', () => {
    component.ninosSedeActual = [
      { id_persona: '1' } as any,
      { id_persona: '2' } as any,
    ];
    component.beneficiariosEliminados = [];
    component.eliminarBeneficiario(0);
    expect(component.ninosSedeActual.length).toBe(1);
    expect(component.beneficiariosEliminados[0]).toBe('1');
  });

  it('🧪 eliminarBeneficiario ignora índices sin beneficiario', () => {
    component.ninosSedeActual = [
      { id_persona: '1', identificacion: '123' } as any,
    ];
    component.beneficiariosNuevos = [{ id_persona: '2' } as any];
    component.beneficiariosEliminados = [];

    component.eliminarBeneficiario(999);

    expect(component.ninosSedeActual.length).toBe(1);
    expect(component.beneficiariosNuevos.length).toBe(1);
    expect(component.beneficiariosEliminados.length).toBe(0);
  });

  it('💾 guardarCambiosBeneficiarios() debe limpiar buffers tras guardar', async () => {
    beneficiariosServiceMock.guardarCambiosBeneficiarios.mockResolvedValueOnce({
      success: true,
      mensaje: 'Guardado',
      exitoso: 'S',
    });

    component.idPrograma = 'P1';
    component.idGrupoInteres = 'G1';
    component.beneficiariosNuevos = [{ id_persona: '1' } as any];
    component.beneficiariosModificados = [{ id_persona: '2' } as any];
    component.beneficiariosEliminados = ['3'];

    const compAny = component as any;
    await compAny.guardarCambiosBeneficiarios();

    expect(component.beneficiariosNuevos.length).toBe(0);
    expect(component.beneficiariosModificados.length).toBe(0);
    expect(component.beneficiariosEliminados.length).toBe(0);
  });

  it('❌ guardarCambiosBeneficiarios() debe manejar error', async () => {
    beneficiariosServiceMock.guardarCambiosBeneficiarios.mockRejectedValueOnce(
      new Error('Error'),
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    component.beneficiariosNuevos = [{ id_persona: '1' } as any];
    component.idPrograma = 'P1';
    component.idGrupoInteres = 'G1';

    const compAny = component as any;
    await compAny.guardarCambiosBeneficiarios();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error al guardar beneficiarios:',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it('🟢 ngOnInit() debe llamar cargarDatosIniciales, cargarUsuarioYSedes y asignar ninosFiltrados', async () => {
    const cargarDatosInicialesSpy = jest
      .spyOn(component, 'cargarDatosIniciales')
      .mockResolvedValue(undefined);
    const cargarUsuarioYSedesSpy = jest
      .spyOn(component, 'cargarUsuarioYSedes')
      .mockResolvedValue(undefined);
    component.ninosSedeActual = [{ nombres: 'Test', apellidos: 'Uno', identificacion: '1' } as any];

    await component.ngOnInit();

    expect(cargarDatosInicialesSpy).toHaveBeenCalled();
    expect(cargarUsuarioYSedesSpy).toHaveBeenCalled();
    expect(component.ninosFiltrados).toBe(component.ninosSedeActual);
  });

  it('🧪 mapFormToPersonaParams() debe mapear correctamente los valores del formulario', () => {
    const formMock = {
      id_persona: '123',
      tipoPersona: 'NAT',
      sexo: 'M',
      ubicacion: 'U',
      tipoIdentificacion: 'CC',
      identificacion: '999',
      nombres: 'Juan',
      apellidos: 'Pérez',
      fechaNacimiento: '2000-01-01',
      acudienteNombres: 'Ana',
      acudienteApellidos: 'Gómez',
      acudienteCorreo: 'ana@email.com',
      acudienteCelular: '3001234567',
      habeasArchivo: 'archivo.pdf',
      fechaHabeas: '2024-01-01',
      acudienteTipoIdentificacion: 'CC',
      acudienteIdentificacion: '888',
      sede: '1',
    };

    const compAny = component as any;
    const result = compAny.mapFormToPersonaParams(formMock);

    expect(result.id_persona).toBe('123');
    expect(result.id_tipo_persona).toBe('NAT');
    expect(result.id_sexo).toBe('M');
    expect(result.id_ubicacion).toBe('U');
    expect(result.id_tipo_identificacion).toBe('CC');
    expect(result.identificacion).toBe('999');
    expect(result.nombres).toBe('Juan');
    expect(result.apellidos).toBe('Pérez');
    expect(result.fecha_nacimiento).toBe('2000-01-01');
    expect(result.nombre_acudiente).toBe('Ana');
    expect(result.apellidos_acudiente).toBe('Gómez');
    expect(result.correo_acudiente).toBe('ana@email.com');
    expect(result.celular_acudiente).toBe('3001234567');
    expect(result.archivo_habeas_data).toBe('archivo.pdf');
    expect(result.habeasArchivo).toBe('archivo.pdf');
    expect(result.fechaHabeas).toBe('2024-01-01');
    expect(result.id_tipo_identificacion_acudiente).toBe('CC');
    expect(result.identificacion_acudiente).toBe('888');
    expect(result.id_sede).toBe('1');
    expect(result.id_colegio).toBe('');
    expect(result.id_pais).toBe('');
    expect(result.id_departamento).toBe('');
    expect(result.id_ciudad).toBe('');
    expect(result.razon_social).toBe('');
    expect(result.acepta_habeas_data).toBe('');
    expect(result.canal_habeas_data).toBe('');
    expect(result.soporte_habeas_data).toBe('');
    expect(result.dir_ip_habeas_data).toBe('');
    expect(result.email).toBe('');
    expect(result.email_contacto).toBe('');
    expect(result.telefono_movil_contacto).toBe('');
    expect(result.telefono_movil).toBe('');
    expect(result.eliminado).toBe('');
    expect(result.fecha_creacion).toBe('');
    expect(result.id_modificado_por).toBe('');
    expect(result.fecha_modificacion).toBe('');
    expect(result.estado).toBe('');
    expect(result.r).toBe('');
  });

  it('🧪 mapFormToPersonaParams() debe mapear campos vacíos como string vacío', () => {
    const formMock = {
      // Solo algunos campos definidos, el resto deben quedar como ''
      id_persona: '321',
      tipoPersona: 'NAT',
      nombres: 'Maria',
      apellidos: 'Lopez',
      // No se definen: id_colegio, id_pais, id_departamento, id_ciudad, razon_social, etc.
    };

    const compAny = component as any;
    const result = compAny.mapFormToPersonaParams(formMock);

    expect(result.id_persona).toBe('321');
    expect(result.id_tipo_persona).toBe('NAT');
    expect(result.nombres).toBe('Maria');
    expect(result.apellidos).toBe('Lopez');
    // Campos no definidos deben ser string vacío
    expect(result.id_colegio).toBe('');
    expect(result.id_pais).toBe('');
    expect(result.id_departamento).toBe('');
    expect(result.id_ciudad).toBe('');
    expect(result.razon_social).toBe('');
    expect(result.acepta_habeas_data).toBe('');
    expect(result.canal_habeas_data).toBe('');
    expect(result.soporte_habeas_data).toBe('');
    expect(result.dir_ip_habeas_data).toBe('');
    expect(result.email).toBe('');
    expect(result.email_contacto).toBe('');
    expect(result.telefono_movil_contacto).toBe('');
    expect(result.telefono_movil).toBe('');
    expect(result.eliminado).toBe('');
    expect(result.fecha_creacion).toBe('');
    expect(result.id_modificado_por).toBe('');
    expect(result.fecha_modificacion).toBe('');
    expect(result.estado).toBe('');
    expect(result.r).toBe('');
  });

  it('🧪 mapFormToPersonaParams() debe mapear id_tipo_persona correctamente y dejar string vacío si no existe', () => {
    const compAny = component as any;

    const formMockConTipoPersona = { tipoPersona: 'NAT' };
    const resultCon = compAny.mapFormToPersonaParams(formMockConTipoPersona);
    expect(resultCon.id_tipo_persona).toBe('NAT');

    const formMockSinTipoPersona = {};
    const resultSin = compAny.mapFormToPersonaParams(formMockSinTipoPersona);
    expect(resultSin.id_tipo_persona).toBe('');
  });

  it('🧪 mapFormToPersonaParams() debe mapear id_creado_por correctamente y dejar string vacío si no existe usuarioLogueado.id', () => {
    const compAny = component as any;

    component.usuarioLogueado = { nombre: 'Juan', id: 'user123' };
    const formMock = {};
    const result = compAny.mapFormToPersonaParams(formMock);
    expect(result.id_creado_por).toBe('user123');

    component.usuarioLogueado = { nombre: 'Juan' } as any;
    const resultSin = compAny.mapFormToPersonaParams(formMock);
    expect(resultSin.id_creado_por).toBe('');
  });

  it('🧪 habeasData() debe mostrar alerta con el mensaje esperado', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const compAny = component as any;

    compAny.habeasData();

    expect(alertSpy).toHaveBeenCalledWith('Información de Habeas Data');
    alertSpy.mockRestore();
  });

  it('🧪 editarHabeasData() debe mostrar alerta con el mensaje esperado', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const compAny = component as any;

    compAny.editarHabeasData();

    expect(alertSpy).toHaveBeenCalledWith('Editar Habeas Data');
    alertSpy.mockRestore();
  });

  it('🧪 onBuscarBeneficiario() debe actualizar busquedaBeneficiario y llamar filtrarBeneficiarios', () => {
    const filtrarSpy = jest.spyOn(component, 'filtrarBeneficiarios');
    component.busquedaBeneficiario = '';
    component.onBuscarBeneficiario('ana');
    expect(component.busquedaBeneficiario).toBe('ana');
    expect(filtrarSpy).toHaveBeenCalledWith('ana');
  });

  it('🧪 onHabeasFileChange() debe asignar archivo y fecha en modo edición de niño', async () => {
    component.editandoNino = true;
    component.ninoEditando = { habeasArchivo: null, fechaHabeas: '', _originalId: '123' } as any;
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as unknown as Event;

    await component.onHabeasFileChange(event);

    const archivo = component.ninoEditando?.habeasArchivo;
    expect(typeof archivo).toBe('string');
    expect(archivo).not.toBe('');
    expect(component.ninoEditando?.fechaHabeas).toBe(new Date().toISOString().slice(0, 10));
  });

  it('🧪 onHabeasFileChange() debe asignar archivo y fecha en el formulario si no está editando niño', async () => {
    component.editandoNino = false;
    component.ninoEditando = null;
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const event = {
      target: { files: [file] }
    } as unknown as Event;

    component.beneficiarioForm.patchValue({ habeasArchivo: null, fechaHabeas: '' });

    await component.onHabeasFileChange(event);

    const archivo = component.beneficiarioForm.value.habeasArchivo;
    expect(typeof archivo).toBe('string');
    expect(archivo).not.toBe('');
    const fechaForm = component.beneficiarioForm.get('fechaHabeas')?.value;
    expect(fechaForm).toBe(new Date().toISOString().slice(0, 10));
  });

  it('🧪 onHabeasFileChange() no debe asignar si el archivo no es PDF', () => {
    component.editandoNino = false;
    component.ninoEditando = null;
    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    const event = {
      target: { files: [file] }
    } as unknown as Event;

    component.beneficiarioForm.patchValue({ habeasArchivo: null, fechaHabeas: '' });

    component.onHabeasFileChange(event);

    expect(component.beneficiarioForm.value.habeasArchivo).toBeNull();
    const fechaForm = component.beneficiarioForm.get('fechaHabeas')?.value;
    expect(fechaForm).toBe('');
  });

  it('🧪 onHabeasFileChange() limpia datos cuando no hay archivo en modo edición', async () => {
    component.editandoNino = true;
    component.ninoEditando = {
      habeasArchivo: 'prev',
      archivo_habeas_data: 'prev',
      fechaHabeas: '2024-01-01',
      fecha_habeas_data: '2024-01-01',
      _originalId: '1',
    } as any;
    const event = {
      target: { files: undefined, value: 'mock' },
    } as unknown as Event;

    await component.onHabeasFileChange(event);

    expect(component.ninoEditando?.habeasArchivo).toBeNull();
    expect(component.ninoEditando?.archivo_habeas_data).toBe('');
    expect(component.ninoEditando?.fechaHabeas).toBe('');
    expect(component.ninoEditando?.fecha_habeas_data).toBe('');
  });

  it('🧪 onHabeasFileChange() limpia formulario cuando no hay archivo y no está editando', async () => {
    component.editandoNino = false;
    component.ninoEditando = null;
    component.beneficiarioForm.patchValue({ habeasArchivo: 'prev' });
    const event = {
      target: { files: undefined, value: 'mock' },
    } as unknown as Event;

    const updateSpy = jest.spyOn(component as any, 'updateFechaHabeasControl');

    await component.onHabeasFileChange(event);

    expect(component.beneficiarioForm.value.habeasArchivo).toBeNull();
    expect(updateSpy).toHaveBeenCalledWith('');
  });

  it('🧪 cargarDatosIniciales() deshabilita formulario cuando sedes es undefined', async () => {
    component.usuarioLogueado = { id: 'user1', nombre: 'Tester' };
    beneficiariosServiceMock.getPreBeneficiarios.mockResolvedValueOnce([
      {
        id_programa: 'P1',
        id_grupo_interes: 'G1',
        sedes: undefined,
        tiposIdentificacion: undefined,
        tiposPersona: undefined,
        sexo: undefined,
        ubicaciones: undefined,
        paises: undefined,
      } as any,
    ]);

    await component.cargarDatosIniciales();

    expect(component.sedesUsuario.length).toBe(0);
    expect(component.tiposIdentificacion.length).toBe(0);
    expect(component.tiposPersona.length).toBe(0);
    expect(component.sexos.length).toBe(0);
    expect(component.ubicaciones.length).toBe(0);
    expect(component.paises.length).toBe(0);
  });

  it('🧪 cargarDatosIniciales() deshabilita formulario cuando hay más de una sede', async () => {
    component.usuarioLogueado = { id: 'user1', nombre: 'Tester' };
    beneficiariosServiceMock.getPreBeneficiarios.mockResolvedValueOnce([
      {
        id_programa: 'P1',
        id_grupo_interes: 'G1',
        sedes: [
          { id_sede: '1', nombre: 'Sede 1' },
          { id_sede: '2', nombre: 'Sede 2' },
        ],
        tiposIdentificacion: [],
        tiposPersona: [],
        sexo: [],
        ubicaciones: [],
        paises: [],
      },
    ]);

    await component.cargarDatosIniciales();

    expect(component.sedesUsuario.length).toBe(2);
  });

  it('🧪 cargarDatosIniciales() maneja error y limpia estado', async () => {
    component.usuarioLogueado = { id: 'user1', nombre: 'Tester' };
    component.beneficiarioForm.enable();
    component.sedeSeleccionada = { id_sede: '1', nombre: 'Prev' };
    component.ninosSedeActual = [{ nombres: 'Test' } as any];

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    beneficiariosServiceMock.getPreBeneficiarios.mockRejectedValueOnce(new Error('Fallo'));

    await component.cargarDatosIniciales();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error al cargar datos iniciales de beneficiarios:',
      expect.any(Error),
    );
    expect(component.sedeSeleccionada).toBeNull();
    expect(component.beneficiarioForm.disabled).toBe(true);
    expect(component.ninosSedeActual).toEqual([]);
    consoleSpy.mockRestore();
  });

  it('🧪 onSeleccionarSede() selecciona sede válida, habilita formulario y carga personas', async () => {
    component.sedesLigadas = [
      { id_sede: '1', nombre: 'Sede 1' },
      { id_sede: '2', nombre: 'Sede 2' },
    ];
    component.beneficiarioForm.disable();
    const cargarSpy = jest
      .spyOn(component, 'cargarPersonasPorSede')
      .mockResolvedValue(undefined);

    await component.onSeleccionarSede('1');

    expect(component.sedeSeleccionada).toEqual({ id_sede: '1', nombre: 'Sede 1' });
    expect(component.beneficiarioForm.enabled).toBe(true);
    expect(component.beneficiarioForm.value.sede).toBe('1');
    expect(cargarSpy).toHaveBeenCalledWith('1');
  });

  it('🧪 onSeleccionarSede() limpia selección y deshabilita formulario cuando la sede no existe', async () => {
    component.sedesLigadas = [{ id_sede: '2', nombre: 'Sede 2' }];
    component.ninosSedeActual = [{ identificacion: '123' } as any];
    component.beneficiarioForm.enable();
    const cargarSpy = jest
      .spyOn(component, 'cargarPersonasPorSede')
      .mockResolvedValue(undefined);

    await component.onSeleccionarSede('1');

    expect(component.sedeSeleccionada).toBeNull();
    expect(component.beneficiarioForm.disabled).toBe(true);
    expect(component.beneficiarioForm.value.sede).toBe('');
    expect(component.ninosSedeActual).toEqual([]);
    expect(cargarSpy).not.toHaveBeenCalled();
  });

  it('🧪 editarNino() activa modo edición, clona datos y deshabilita formulario', () => {
    component.beneficiarioForm.enable();
    const nino = {
      identificacion: '123',
      nombres: 'Ana',
      apellidos: 'Gómez',
    } as any;

    component.editarNino(nino);

    expect(component.editandoNino).toBe(true);
    expect(component.ninoEditando).toMatchObject({
      identificacion: '123',
      nombres: 'Ana',
      apellidos: 'Gómez',
      _originalId: '123',
    });
    expect(component.beneficiarioForm.disabled).toBe(true);
  });

  it('🧪 actualizarNino() actualiza lista y buffers', () => {
    component.ninosSedeActual = [
      { identificacion: '123', nombres: 'Ana', apellidos: 'Gómez' } as any,
      { identificacion: '456', nombres: 'Luis', apellidos: 'Pérez' } as any,
    ];
    component.beneficiariosModificados = [];
    component.ninoEditando = {
      identificacion: '123',
      nombres: 'Ana Editada',
      apellidos: 'Gómez Editada',
      _originalId: '123',
    } as any;
    component.editandoNino = true;
    component.beneficiarioForm.disable();

    component.actualizarNino();

    expect(component.ninosSedeActual[0].nombres).toBe('Ana Editada');
    expect(component.beneficiariosModificados).toContainEqual(
      expect.objectContaining({ identificacion: '123', _originalId: '123' }),
    );
    expect(component.editandoNino).toBe(false);
    expect(component.ninoEditando).toBeNull();
    expect(component.beneficiarioForm.enabled).toBe(true);
  });

  it('🧪 actualizarNino() finaliza sin cambios cuando ninoEditando es inválido', () => {
    component.editandoNino = true;
    component.ninoEditando = null;
    component.beneficiarioForm.disable();

    component.actualizarNino();

    expect(component.editandoNino).toBe(false);
    expect(component.ninoEditando).toBeNull();
    expect(component.beneficiarioForm.enabled).toBe(true);
  });

  it('🧪 cancelarEdicion() restablece estados y habilita formulario', () => {
    component.editandoNino = true;
    component.ninoEditando = { identificacion: '999', _originalId: '999' } as any;
    component.beneficiarioForm.disable();

    component.cancelarEdicion();

    expect(component.editandoNino).toBe(false);
    expect(component.ninoEditando).toBeNull();
    expect(component.beneficiarioForm.enabled).toBe(true);
  });

  it('🧪 onEditarIdentificacion() soporta target sin valor', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const event = { target: {} } as unknown as Event;

    component.onEditarIdentificacion(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Editando identificación:',
      undefined,
    );
    consoleSpy.mockRestore();
  });

  it('🧪 onKeydownIdentificacion() bloquea Enter, Tab y Escape', () => {
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    const event = {
      key: 'Enter',
      preventDefault,
      stopPropagation,
    } as unknown as KeyboardEvent;

    component.onKeydownIdentificacion(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('🧪 onKeydownIdentificacion() deja pasar otras teclas', () => {
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    const event = {
      key: 'a',
      preventDefault,
      stopPropagation,
    } as unknown as KeyboardEvent;

    component.onKeydownIdentificacion(event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it('🧪 tipoPersonaLabel devuelve el nombre configurado', () => {
    component.tipoPersonaDefaultId = 'NAT';
    component.tipoPersonaDefaultNombre = 'Natural';
    component.tiposPersona = [
      { id_tipo_persona: 'NAT', nombre: 'Natural' },
      { id_tipo_persona: 'JUR', nombre: 'Jurídica' },
    ];

    component.beneficiarioForm.patchValue({ tipoPersona: 'JUR' });

    expect(component.tipoPersonaLabel).toBe('Jurídica');
  });

  it('🧪 tipoPersonaLabel usa el fallback cuando no hay coincidencia', () => {
    component.tipoPersonaDefaultId = 'NAT';
    component.tipoPersonaDefaultNombre = 'Natural';
    component.tiposPersona = [{ id_tipo_persona: 'NAT', nombre: 'Natural' }];

    component.beneficiarioForm.patchValue({ tipoPersona: 'DESCONOCIDO' });

    expect(component.tipoPersonaLabel).toBe('Natural');
  });

  it('🧪 tipoPersonaLabel usa fallback vacío cuando no hay default', () => {
    component.tipoPersonaDefaultId = null;
    component.tipoPersonaDefaultNombre = 'Natural';
    component.tiposPersona = [];
    const control = component.beneficiarioForm.get('tipoPersona');
    control?.enable({ emitEvent: false });
    control?.setValue(null);
    const spy = jest.spyOn(component, 'nombreTipoPersona');

    const result = component.tipoPersonaLabel;

    expect(spy).toHaveBeenCalledWith('', 'Natural');
    expect(result).toBe('Natural');
  });

  it('🧪 cargarUsuarioYSedes llena datos cuando el servicio responde', async () => {
    authServiceMock.getUserUuid.mockReturnValue('user-1');
    beneficiariosServiceMock.getPreBeneficiarios.mockResolvedValueOnce([
      {
        id_programa: 'P1',
        id_grupo_interes: 'G1',
        nombre_usuario: 'Tester',
        sedes: [{ id_sede: '1', nombre: 'Sede 1' }],
      },
    ]);

    await component.cargarUsuarioYSedes();

    expect(authServiceMock.getUserUuid).toHaveBeenCalled();
    expect(component.usuarioLogueado).toEqual({ nombre: 'Tester', id: 'user-1' });
    expect(component.idPrograma).toBe('P1');
    expect(component.idGrupoInteres).toBe('G1');
    expect(component.sedesLigadas.length).toBe(1);
    expect(component.beneficiarioForm.disabled).toBe(true);
  });

  it('🧪 cargarUsuarioYSedes llama reset cuando no hay datos', async () => {
    const resetSpy = jest.spyOn(component as any, 'resetEstadoBeneficiarios');
    authServiceMock.getUserUuid.mockReturnValue('user-1');
    beneficiariosServiceMock.getPreBeneficiarios.mockResolvedValueOnce([]);

    await component.cargarUsuarioYSedes();

    expect(resetSpy).toHaveBeenCalled();
    expect(component.usuarioLogueado).toBeNull();
  });

  it('🧪 cargarUsuarioYSedes usa defaults cuando faltan nombre e id_grupo_interes', async () => {
    authServiceMock.getUserUuid.mockReturnValue('user-2');
    beneficiariosServiceMock.getPreBeneficiarios.mockResolvedValueOnce([
      {
        id_programa: 'P2',
        id_grupo_interes: undefined,
        nombre_usuario: undefined,
        sedes: [],
      },
    ]);

    await component.cargarUsuarioYSedes();

    expect(component.idPrograma).toBe('P2');
    expect(component.idGrupoInteres).toBeNull();
    expect(component.usuarioLogueado).toEqual({ nombre: 'Usuario', id: 'user-2' });
  });

  it('🧪 cargarUsuarioYSedes limpia el estado cuando ocurre un error', async () => {
    authServiceMock.getUserUuid.mockReturnValue('user-err');
    beneficiariosServiceMock.getPreBeneficiarios.mockRejectedValueOnce(
      new Error('Fallo'),
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await component.cargarUsuarioYSedes();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error al cargar usuario y sedes:',
      expect.any(Error),
    );
    expect(component.usuarioLogueado).toBeNull();
    expect(component.sedesLigadas).toEqual([]);
    expect(component.sedeSeleccionada).toBeNull();
    expect(component.idPrograma).toBeNull();
    expect(component.idGrupoInteres).toBeNull();
    expect(component.beneficiarioForm.disabled).toBe(true);
    consoleSpy.mockRestore();
  });

  it('🧪 cargarDatosIniciales reinicia estado cuando no hay datos', async () => {
    component.usuarioLogueado = { id: 'user-empty', nombre: 'Tester' };
    const resetSpy = jest.spyOn(component as any, 'resetEstadoBeneficiarios');
    beneficiariosServiceMock.getPreBeneficiarios.mockResolvedValueOnce([]);

    await component.cargarDatosIniciales();

    expect(resetSpy).toHaveBeenCalled();
    expect(component.idGrupoInteres).toBeNull();
  });

  it('🧪 cargarPersonasPorSede limpia listas si faltan idPrograma o idGrupoInteres', async () => {
    component.idPrograma = null;
    component.idGrupoInteres = null;
    component.ninosSedeActual = [{ identificacion: '1' } as any];
    component.ninosFiltrados = [{ identificacion: '1' } as any];
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await component.cargarPersonasPorSede('1');

    expect(warnSpy).toHaveBeenCalledWith('ID de programa o grupo de interés indefinido.');
    expect(component.ninosSedeActual).toEqual([]);
    expect(component.ninosFiltrados).toEqual([]);
    warnSpy.mockRestore();
  });

  it('🧪 cargarPersonasPorSede obtiene personas y aplica filtro', async () => {
    component.idPrograma = 'P1';
    component.idGrupoInteres = 'G1';
    component.busquedaBeneficiario = '';
    component.tiposIdentificacion = [{ id_tipo_identificacion: 'CC', nombre: 'Cédula' }];
    component.sexos = [{ id_sexo: 'M', nombre: 'Masculino' }];
    component.ubicaciones = [{ id_ubicacion: 'U', nombre: 'Urbana' }];
    component.sedesUsuario = [{ id_sede: '1', nombre: 'Sede 1' }];
    const persona = {
      id_persona: '1',
      id_sede: '1',
      id_tipo_persona: 'NAT',
      id_colegio: '',
      id_sexo: 'M',
      id_ubicacion: 'U',
      id_pais: '',
      id_departamento: '',
      id_ciudad: '',
      id_tipo_identificacion: 'CC',
      identificacion: '123',
      nombres: 'Ana',
      apellidos: 'Pérez',
      razon_social: '',
      fecha_nacimiento: '2000-01-01',
      nombre_acudiente: '',
      apellidos_acudiente: '',
      correo_acudiente: '',
      celular_acudiente: '',
      archivo_habeas_data: '',
      acepta_habeas_data: '',
      fecha_habeas_data: '',
      canal_habeas_data: '',
      soporte_habeas_data: '',
      dir_ip_habeas_data: '',
      email: '',
      email_contacto: '',
      telefono_movil_contacto: '',
      telefono_movil: '',
      id_creado_por: '',
      fecha_creacion: '',
      id_modificado_por: '',
      fecha_modificacion: '',
      estado: '',
      id_tipo_identificacion_acudiente: '',
      identificacion_acudiente: '',
      eliminado: '',
    };
    beneficiariosServiceMock.getPersonasParams.mockResolvedValueOnce([persona as any]);
    const filtrarSpy = jest.spyOn(component, 'filtrarBeneficiarios');

    await component.cargarPersonasPorSede('1');

    expect(beneficiariosServiceMock.getPersonasParams).toHaveBeenCalledWith('1', 'P1', 'G1', 50, 0);
    expect(component.ninosSedeActual.length).toBe(1);
    expect(filtrarSpy).toHaveBeenCalledWith('');
  });

  it('🧪 cargarPersonasPorSede limpia listas si el servicio falla', async () => {
    component.idPrograma = 'P1';
    component.idGrupoInteres = 'G1';
    component.ninosSedeActual = [{ identificacion: '1' } as any];
    component.ninosFiltrados = [{ identificacion: '1' } as any];
    beneficiariosServiceMock.getPersonasParams.mockRejectedValueOnce(new Error('Fallo'));

    await component.cargarPersonasPorSede('1');

    expect(component.ninosSedeActual).toEqual([]);
    expect(component.ninosFiltrados).toEqual([]);
  });

  it('🧪 actualizarNino actualiza entrada existente en beneficiariosNuevos', () => {
    component.ninosSedeActual = [
      {
        id_persona: 'temp1',
        identificacion: '999',
        nombres: 'Ana',
        apellidos: 'Gómez',
      } as any,
    ];
    component.beneficiariosNuevos = [
      {
        id_persona: 'temp1',
        identificacion: '999',
        fecha_nacimiento: '',
        fecha_habeas_data: '',
      } as any,
    ];
    component.beneficiariosModificados = [];
    component.ninoEditando = {
      id_persona: 'temp1',
      identificacion: '999',
      _originalId: '999',
      fechaNacimiento: '2020-02-02',
      fechaHabeas: '2024-04-04',
      discapacitado: 'SI',
    } as any;
    component.editandoNino = true;
    component.beneficiarioForm.disable();
    const upsertSpy = jest.spyOn(component as any, 'upsertBeneficiarioModificado');

    component.actualizarNino();

    expect(component.beneficiariosNuevos[0].fecha_nacimiento).toBe('2020-02-02');
    expect(component.beneficiariosNuevos[0].fecha_habeas_data).toBe('2024-04-04');
    expect(component.beneficiariosNuevos[0].discapacitado).toBe('SI');
    expect(upsertSpy).not.toHaveBeenCalled();
    expect(component.beneficiariosModificados.length).toBe(0);
  });

  it('🧪 agregarBeneficiario usa tipoPersonaDefaultId antes de mapear', () => {
    component.tipoPersonaDefaultId = 'NAT';
    component.sedeSeleccionada = { id_sede: '1', nombre: 'Sede 1' };
    component.tiposPersona = [{ id_tipo_persona: 'NAT', nombre: 'Natural' }];
    component.tiposIdentificacion = [{ id_tipo_identificacion: 'CC', nombre: 'Cédula' }];
    component.sexos = [{ id_sexo: 'M', nombre: 'Masculino' }];
    component.ubicaciones = [{ id_ubicacion: 'U', nombre: 'Urbano' }];
    component.beneficiarioForm.setValue({
      sede: '1',
      tipoIdentificacion: 'CC',
      tipoPersona: 'JUR',
      identificacion: '123',
      nombres: 'Test',
      apellidos: 'User',
      fechaNacimiento: '2010-01-01',
      sexo: 'M',
      ubicacion: 'U',
      discapacidad: '',
      acudienteTipoIdentificacion: '',
      acudienteIdentificacion: '',
      acudienteNombres: '',
      acudienteApellidos: '',
      acudienteCorreo: '',
      acudienteCelular: '',
      habeasArchivo: null,
      fechaHabeas: '',
    });
    const patchSpy = jest.spyOn(component.beneficiarioForm, 'patchValue');

    component.agregarBeneficiario();

    expect(patchSpy).toHaveBeenNthCalledWith(1, { tipoPersona: 'NAT' }, { emitEvent: false });
  });

  it('🧪 agregarBeneficiario setea sede vacía cuando no hay sedeSeleccionada', () => {
    component.tipoPersonaDefaultId = null;
    component.sedeSeleccionada = null;
    component.tiposIdentificacion = [{ id_tipo_identificacion: 'CC', nombre: 'Cédula' }];
    component.sexos = [{ id_sexo: 'M', nombre: 'Masculino' }];
    component.ubicaciones = [{ id_ubicacion: 'U', nombre: 'Urbano' }];
    component.beneficiarioForm.setValue({
      sede: '1',
      tipoIdentificacion: 'CC',
      tipoPersona: '',
      identificacion: '123',
      nombres: 'Test',
      apellidos: 'User',
      fechaNacimiento: '2010-01-01',
      sexo: 'M',
      ubicacion: 'U',
      discapacidad: '',
      acudienteTipoIdentificacion: '',
      acudienteIdentificacion: '',
      acudienteNombres: '',
      acudienteApellidos: '',
      acudienteCorreo: '',
      acudienteCelular: '',
      habeasArchivo: null,
      fechaHabeas: '',
    });
    const patchSpy = jest.spyOn(component.beneficiarioForm, 'patchValue');

    component.agregarBeneficiario();

    expect(patchSpy).toHaveBeenLastCalledWith({
      tipoPersona: '',
      sede: '',
    });
  });

  it('🧪 eliminarBeneficiario() quita nuevos sin marcar eliminados', () => {
    component.ninosSedeActual = [
      { id_persona: 'temp-1', identificacion: '001' } as any,
    ];
    component.beneficiariosNuevos = [
      { id_persona: 'temp-1' } as any,
      { id_persona: 'temp-2' } as any,
    ];
    component.beneficiariosModificados = [
      { id_persona: 'temp-1' } as any,
      { id_persona: 'temp-3' } as any,
    ];
    const filtrarSpy = jest.spyOn(component, 'filtrarBeneficiarios');

    component.eliminarBeneficiario(0);

    expect(component.beneficiariosNuevos).toEqual([{ id_persona: 'temp-2' }]);
    expect(component.beneficiariosEliminados).toEqual([]);
    expect(component.beneficiariosModificados).toEqual([{ id_persona: 'temp-3' }]);
    expect(component.ninosSedeActual).toEqual([]);
    expect(filtrarSpy).toHaveBeenCalledWith(component.busquedaBeneficiario);
  });

  it('🧪 eliminarBeneficiario agrega id a eliminados sin duplicar', () => {
    component.ninosSedeActual = [
      { id_persona: 'persist-1', identificacion: '111' } as any,
    ];
    component.beneficiariosNuevos = [];
    component.beneficiariosEliminados = ['persist-2'];
    component.beneficiariosModificados = [{ id_persona: 'persist-1' } as any];

    component.eliminarBeneficiario(0);

    expect(component.beneficiariosEliminados).toEqual(['persist-2', 'persist-1']);
    expect(component.beneficiariosModificados).toEqual([]);
    expect(component.ninosSedeActual).toEqual([]);
  });

  it('🧪 eliminarBeneficiario cancela edición activa del mismo beneficiario', () => {
    component.editandoNino = true;
    component.ninoEditando = {
      id_persona: 'persist-3',
      identificacion: '222',
      _originalId: '222',
    } as any;
    component.ninosSedeActual = [
      { id_persona: 'persist-3', identificacion: '222' } as any,
    ];
    const cancelarSpy = jest
      .spyOn(component, 'cancelarEdicion')
      .mockImplementation(() => {});
    const filtrarSpy = jest.spyOn(component, 'filtrarBeneficiarios');

    component.eliminarBeneficiario(0);

    expect(cancelarSpy).toHaveBeenCalled();
    expect(filtrarSpy).toHaveBeenCalledWith(component.busquedaBeneficiario);
  });

  it('🧪 eliminarBeneficiarioPorPersona delega al índice encontrado', () => {
    component.ninosSedeActual = [
      { id_persona: '1', identificacion: '001' } as any,
      { id_persona: '2', identificacion: '002' } as any,
    ];
    const eliminarSpy = jest
      .spyOn(component, 'eliminarBeneficiario')
      .mockImplementation(() => {});

    component.eliminarBeneficiarioPorPersona({ id_persona: '2', identificacion: '002' } as any);
    expect(eliminarSpy).toHaveBeenCalledWith(1);

    eliminarSpy.mockClear();
    component.eliminarBeneficiarioPorPersona({ id_persona: '3', identificacion: '003' } as any);
    expect(eliminarSpy).not.toHaveBeenCalled();
  });

  it('🧪 getNombre convierte valores no string usando String()', () => {
    const compAny = component as any;
    const lista = [{ id: '1', nombre: 999 }];

    const resultado = compAny.getNombre(lista, '1', 'id', 'nombre');

    expect(resultado).toBe('999');
  });

  it('🧪 guardarCambiosBeneficiarios() no continua sin ids requeridos', async () => {
    component.idPrograma = null;
    component.idGrupoInteres = null;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const guardarSpy = beneficiariosServiceMock.guardarCambiosBeneficiarios;

    const compAny = component as any;
    await compAny.guardarCambiosBeneficiarios();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'No hay id_programa o id_grupo_interes definidos.',
    );
    expect(guardarSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('🧪 enrichPersonaForView normaliza datos de acudiente y fechas', () => {
    component.sedesUsuario = [{ id_sede: '1', nombre: 'Principal' }];
    component.tiposIdentificacion = [
      { id_tipo_identificacion: 'CC', nombre: 'Cédula' },
      { id_tipo_identificacion: 'TI', nombre: 'Tarjeta' },
    ];
    component.sexos = [{ id_sexo: 'M', nombre: 'Masculino' }];
    component.ubicaciones = [{ id_ubicacion: 'U', nombre: 'Urbana' }];
    const compAny = component as any;
    const persona = {
      id_persona: '1',
      id_sede: '1',
      id_tipo_persona: 'NAT',
      id_colegio: '',
      id_sexo: 'M',
      id_ubicacion: 'U',
      id_pais: '',
      id_departamento: '',
      id_ciudad: '',
      id_tipo_identificacion: 'CC',
      identificacion: '123',
      nombres: 'Juan',
      apellidos: 'Pérez',
      razon_social: '',
      fecha_nacimiento: '2000-01-01T00:00:00Z',
      nombre_acudiente: 'Ana',
      apellidos_acudiente: 'Lopez',
      correo_acudiente: 'ana@email.com',
      celular_acudiente: '300',
      archivo_habeas_data: 'pdf',
      acepta_habeas_data: '',
      fecha_habeas_data: '2024-01-01T00:00:00Z',
      canal_habeas_data: '',
      soporte_habeas_data: '',
      dir_ip_habeas_data: '',
      email: '',
      email_contacto: '',
      telefono_movil_contacto: '',
      telefono_movil: '',
      id_creado_por: '',
      fecha_creacion: '',
      id_modificado_por: '',
      fecha_modificacion: '',
      estado: '',
      // --- CORRIGE AQUÍ ---
      id_tipo_identificacion_acudiente: 'TI',
      identificacion_acudiente: 987,
      // --------------------
      eliminado: '',
      discapacitado: 'SI',
    } as any;

    const result = compAny.enrichPersonaForView(persona);

    expect(result.sede).toBe('Principal');
    expect(result.tipoIdentificacion).toBe('Cédula');
    expect(result.acudienteTipoIdentificacion).toBe('Tarjeta');
    expect(result.acudienteIdentificacion).toBe('987');
    expect(result.discapacidad).toBe('Sí');
    expect(result.fechaNacimiento).toBe('2000-01-01');
    expect(result.fechaHabeas).toBe('2024-01-01');
    expect(result.habeasArchivo).toBe('pdf');
  });

  it('🧪 enrichPersonaForView usa el valor del record cuando falta id_tipo_identificacion_acudiente', () => {
    component.sedesUsuario = [{ id_sede: '1', nombre: 'Principal' }];
    component.tiposIdentificacion = [
      { id_tipo_identificacion: 'CC', nombre: 'Cédula' },
      { id_tipo_identificacion: 'TI', nombre: 'Tarjeta' },
    ];
    component.sexos = [{ id_sexo: 'M', nombre: 'Masculino' }];
    component.ubicaciones = [{ id_ubicacion: 'U', nombre: 'Urbana' }];
    const compAny = component as any;
    const persona = {
      id_persona: '1',
      id_sede: '1',
      id_tipo_persona: 'NAT',
      id_tipo_identificacion: 'CC',
      identificacion: '123',
      nombres: 'Juan',
      apellidos: 'Pérez',
      fecha_nacimiento: '2000-01-01',
      nombre_acudiente: '',
      apellidos_acudiente: '',
      correo_acudiente: '',
      celular_acudiente: '',
      archivo_habeas_data: '',
      fecha_habeas_data: '',
      id_tipo_identificacion_acudiente: undefined,
      acudienteTipoIdentificacion: 'TI',
      acudienteIdentificacion: '456',
      id_sexo: 'M',
      id_ubicacion: 'U',
      id_colegio: '',
      id_pais: '',
      id_departamento: '',
      id_ciudad: '',
      razon_social: '',
      acepta_habeas_data: '',
      canal_habeas_data: '',
      soporte_habeas_data: '',
      dir_ip_habeas_data: '',
      email: '',
      email_contacto: '',
      telefono_movil_contacto: '',
      telefono_movil: '',
      id_creado_por: '',
      fecha_creacion: '',
      id_modificado_por: '',
      fecha_modificacion: '',
      estado: '',
      eliminado: '',
    } as any;

    const result = compAny.enrichPersonaForView(persona);

    expect(result.acudienteTipoIdentificacion).toBe('Tarjeta');
  });

  it('🧪 enrichPersonaForView retorna vacío si no hay id_tipo_identificacion_acudiente ni acudienteTipoIdentificacion', () => {
    component.sedesUsuario = [{ id_sede: '1', nombre: 'Principal' }];
    component.tiposIdentificacion = [
      { id_tipo_identificacion: 'CC', nombre: 'Cédula' },
      { id_tipo_identificacion: 'TI', nombre: 'Tarjeta' },
    ];
    component.sexos = [{ id_sexo: 'M', nombre: 'Masculino' }];
    component.ubicaciones = [{ id_ubicacion: 'U', nombre: 'Urbana' }];
    const compAny = component as any;
    const persona = {
      id_persona: '1',
      id_sede: '1',
      id_tipo_persona: 'NAT',
      id_tipo_identificacion: 'CC',
      identificacion: '123',
      nombres: 'Juan',
      apellidos: 'Pérez',
      fecha_nacimiento: '2000-01-01',
      // No id_tipo_identificacion_acudiente ni acudienteTipoIdentificacion
      // ...otros campos omitidos...
    } as any;

    const result = compAny.enrichPersonaForView(persona);

    expect(result.acudienteTipoIdentificacion).toBe('');
  });

  it('🧪 enrichPersonaForView prioriza fechaNacimiento sobre fecha_nacimiento', () => {
    component.sedesUsuario = [{ id_sede: '1', nombre: 'Principal' }];
    component.tiposIdentificacion = [
      { id_tipo_identificacion: 'CC', nombre: 'Cédula' },
    ];
    component.sexos = [{ id_sexo: 'M', nombre: 'Masculino' }];
    component.ubicaciones = [{ id_ubicacion: 'U', nombre: 'Urbana' }];
    const compAny = component as any;
    const persona = {
      id_persona: '1',
      id_sede: '1',
      id_tipo_persona: 'NAT',
      id_tipo_identificacion: 'CC',
      identificacion: '123',
      nombres: 'Juan',
      apellidos: 'Pérez',
      fecha_nacimiento: '2000-01-01',
      fechaNacimiento: '2020-12-31',
    } as any;

    const result = compAny.enrichPersonaForView(persona);

    expect(result.fechaNacimiento).toBe('2020-12-31');
    expect(result.fecha_nacimiento).toBe('2020-12-31');
  });

  it('🧪 enrichPersonaForView retorna discapacitado vacío si no hay flag normalizado', () => {
    component.sedesUsuario = [{ id_sede: '1', nombre: 'Principal' }];
    component.tiposIdentificacion = [
      { id_tipo_identificacion: 'CC', nombre: 'Cédula' },
    ];
    component.sexos = [{ id_sexo: 'M', nombre: 'Masculino' }];
    component.ubicaciones = [{ id_ubicacion: 'U', nombre: 'Urbana' }];
    const compAny = component as any;
    const persona = {
      id_persona: '1',
      id_sede: '1',
      id_tipo_persona: 'NAT',
      id_tipo_identificacion: 'CC',
      identificacion: '123',
      nombres: 'Juan',
      apellidos: 'Pérez',
      fecha_nacimiento: '2000-01-01',
      discapacitado: 'OTRO_VALOR',
    } as any;

    const result = compAny.enrichPersonaForView(persona);

    expect(result.discapacitado).toBe('');
  });

  it('🧪 toFlag retorna "S" para valores verdaderos y "N" para falsos o desconocidos', () => {
    const compAny = component as any;
    expect(compAny.toFlag('SI')).toBe('S');
    expect(compAny.toFlag('si')).toBe('S');
    expect(compAny.toFlag('S')).toBe('S');
    expect(compAny.toFlag(true)).toBe('S');
    expect(compAny.toFlag(1)).toBe('S');
    expect(compAny.toFlag('NO')).toBe('N');
    expect(compAny.toFlag('no')).toBe('N');
    expect(compAny.toFlag('N')).toBe('N');
    expect(compAny.toFlag(false)).toBe('N');
    expect(compAny.toFlag(0)).toBe('N');
    expect(compAny.toFlag('OTRO')).toBe('N');
    expect(compAny.toFlag(undefined)).toBe('N');
    expect(compAny.toFlag(null)).toBe('N');
  });

  it('🧪 formatFechaISO normaliza fechas en distintos formatos', () => {
    const compAny = component as any;
    // Date objeto
    expect(compAny.formatFechaISO(new Date('2023-05-10'))).toBe('2023-05-10');
    // String ISO
    expect(compAny.formatFechaISO('2023-05-10')).toBe('2023-05-10');
    // String con hora
    expect(compAny.formatFechaISO('2023-05-10T12:00:00Z')).toBe('2023-05-10');
    // Timestamp numérico (milisegundos)
    const ts = Date.UTC(2023, 4, 10); // 2023-05-10
    expect(compAny.formatFechaISO(ts)).toBe('2023-05-10');
    // Timestamp string
    expect(compAny.formatFechaISO(String(ts))).toBe('2023-05-10');
    // String vacía
    expect(compAny.formatFechaISO('')).toBe('');
    // null y undefined
    expect(compAny.formatFechaISO(null)).toBe('');
    expect(compAny.formatFechaISO(undefined)).toBe('');
    // Fecha inválida
    expect(compAny.formatFechaISO('no-fecha')).toBe('');
    // Número inválido
    expect(compAny.formatFechaISO(NaN)).toBe('');
  });

  it('🧪 configurarTipoPersonaDefault usa fallback si no hay tipo "Natural"', () => {
    const compAny = component as any;
    component.tiposPersona = [
      { id_tipo_persona: 'JUR', nombre: 'Jurídica' },
      { id_tipo_persona: 'EXT', nombre: 'Extranjero' },
    ];
    component.tipoPersonaDefaultId = null;
    component.tipoPersonaDefaultNombre = 'Natural';
    const patchSpy = jest.spyOn(component.beneficiarioForm, 'patchValue');

    compAny.configurarTipoPersonaDefault();

    expect(component.tipoPersonaDefaultId).toBe('JUR');
    expect(component.tipoPersonaDefaultNombre).toBe('Jurídica');
    expect(patchSpy).toHaveBeenCalledWith(
      { tipoPersona: 'JUR' },
      { emitEvent: false },
    );
  });

  it('🧪 configurarTipoPersonaDefault usa id_tipo_identificacion del fallback si no hay id_tipo_persona', () => {
    const compAny = component as any;
    component.tiposPersona = [
      { id_tipo_identificacion: 'EXTID', nombre: 'Extranjero' },
    ];
    component.tipoPersonaDefaultId = null;
    component.tipoPersonaDefaultNombre = 'Natural';
    const patchSpy = jest.spyOn(component.beneficiarioForm, 'patchValue');

    compAny.configurarTipoPersonaDefault();

    expect(component.tipoPersonaDefaultId).toBe('EXTID');
    expect(component.tipoPersonaDefaultNombre).toBe('Extranjero');
    expect(patchSpy).toHaveBeenCalledWith(
      { tipoPersona: 'EXTID' },
      { emitEvent: false },
    );
  });

  it('🧪 configurarTipoPersonaDefault mantiene tipoPersonaDefaultId si tiposPersona está vacío', () => {
    const compAny = component as any;
    component.tiposPersona = [];
    component.tipoPersonaDefaultId = 'PREV';
    component.tipoPersonaDefaultNombre = 'Natural';
    const patchSpy = jest.spyOn(component.beneficiarioForm, 'patchValue');

    compAny.configurarTipoPersonaDefault();

    expect(component.tipoPersonaDefaultId).toBe('PREV');
    expect(component.tipoPersonaDefaultNombre).toBe('Natural');
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it('🧪 nombreTipoPersona retorna el nombre si encuentra por id_tipo_persona', () => {
    component.tiposPersona = [
      { id_tipo_persona: 'NAT', nombre: 'Natural' },
      { id_tipo_persona: 'JUR', nombre: 'Jurídica' },
    ];
    component.tipoPersonaDefaultNombre = 'Natural';
    const compAny = component as any;
    expect(compAny.nombreTipoPersona('JUR')).toBe('Jurídica');
    expect(compAny.nombreTipoPersona('NAT')).toBe('Natural');
  });

  it('🧪 nombreTipoPersona retorna el nombre si encuentra por id_tipo_identificacion', () => {
    component.tiposPersona = [
      { id_tipo_identificacion: 'EXTID', nombre: 'Extranjero' },
    ];
    component.tipoPersonaDefaultNombre = 'Natural';
    const compAny = component as any;
    expect(compAny.nombreTipoPersona('EXTID')).toBe('Extranjero');
  });

  it('🧪 nombreTipoPersona retorna el fallback si no encuentra id', () => {
    component.tiposPersona = [
      { id_tipo_persona: 'NAT', nombre: 'Natural' },
    ];
    component.tipoPersonaDefaultNombre = 'Natural';
    const compAny = component as any;
    expect(compAny.nombreTipoPersona('NOEXISTE', 'Fallback')).toBe('Fallback');
  });

  it('🧪 nombreTipoPersona retorna tipoPersonaDefaultNombre si tiposPersona está vacío y no hay id ni fallback', () => {
    component.tiposPersona = [];
    component.tipoPersonaDefaultNombre = 'MiDefault';
    const compAny = component as any;
    expect(compAny.nombreTipoPersona(undefined)).toBe('MiDefault');
    expect(compAny.nombreTipoPersona(null)).toBe('MiDefault');
    expect(compAny.nombreTipoPersona('')).toBe('MiDefault');
  });

  it('🧪 upsertBeneficiarioModificado agrega si no existe y actualiza si ya existe', () => {
    const compAny = component as any;
    const persona1 = { id_persona: '1', nombres: 'Ana' };
    const persona2 = { id_persona: '2', nombres: 'Luis' };
    component.beneficiariosModificados = [];

    // Agrega nuevo
    compAny.upsertBeneficiarioModificado(persona1);
    expect(component.beneficiariosModificados).toEqual([persona1]);

    // Agrega otro nuevo
    compAny.upsertBeneficiarioModificado(persona2);
    expect(component.beneficiariosModificados).toEqual([persona1, persona2]);

    // Actualiza existente
    const persona1Edit = { id_persona: '1', nombres: 'Ana Editada' };
    compAny.upsertBeneficiarioModificado(persona1Edit);
    expect(component.beneficiariosModificados).toEqual([persona1Edit, persona2]);
  });

  it('🧪 resolveIdTipoPersona retorna el id si coincide por id_tipo_persona', () => {
    const compAny = component as any;
    component.tiposPersona = [
      { id_tipo_persona: 'NAT', nombre: 'Natural' },
      { id_tipo_persona: 'JUR', nombre: 'Jurídica' },
    ];
    component.tipoPersonaDefaultId = 'DEF';
    expect(compAny.resolveIdTipoPersona('JUR')).toBe('JUR');
    expect(compAny.resolveIdTipoPersona('NAT')).toBe('NAT');
  });

  it('🧪 resolveIdTipoPersona retorna el id si coincide por id_tipo_identificacion', () => {
    const compAny = component as any;
    component.tiposPersona = [
      { id_tipo_identificacion: 'EXTID', nombre: 'Extranjero' },
    ];
    component.tipoPersonaDefaultId = 'DEF';
    expect(compAny.resolveIdTipoPersona('EXTID')).toBe('EXTID');
  });

  it('🧪 resolveIdTipoPersona retorna el id si coincide por nombre', () => {
    const compAny = component as any;
    component.tiposPersona = [
      { id_tipo_persona: 'NAT', nombre: 'Natural' },
      { id_tipo_persona: 'JUR', nombre: 'Jurídica' },
    ];
    component.tipoPersonaDefaultId = 'DEF';
    expect(compAny.resolveIdTipoPersona('natural')).toBe('NAT');
    expect(compAny.resolveIdTipoPersona('Jurídica')).toBe('JUR');
  });

  it('🧪 resolveIdTipoPersona retorna tipoPersonaDefaultId si no hay coincidencia', () => {
    const compAny = component as any;
    component.tiposPersona = [
      { id_tipo_persona: 'NAT', nombre: 'Natural' },
    ];
    component.tipoPersonaDefaultId = 'DEF';
    expect(compAny.resolveIdTipoPersona('NOEXISTE')).toBe('DEF');
  });

  it('🧪 resolveIdTipoPersona retorna tipoPersonaDefaultId si valor es undefined', () => {
    const compAny = component as any;
    component.tiposPersona = [
      { id_tipo_persona: 'NAT', nombre: 'Natural' },
    ];
    component.tipoPersonaDefaultId = 'DEF';
    expect(compAny.resolveIdTipoPersona(undefined)).toBe('DEF');
  });

  it('🧪 soloNumeros() solo deja números en el input', () => {
    const input = { value: 'abc123def456' } as HTMLInputElement;
    const event = { target: input } as unknown as Event;

    component.soloNumeros(event);

    expect(input.value).toBe('123456');
  });

  it('🧪 soloNumeros() no falla si input es null', () => {
    const event = { target: null } as unknown as Event;
    expect(() => component.soloNumeros(event)).not.toThrow();
  });

  it('🧪 readFileAsBase64() resuelve el base64 del archivo', async () => {
    // Simula un File y FileReader
    const fakeFile = new Blob(['dummy']) as File;
    const fakeResult = 'data:application/pdf;base64,ZmFrZUJhc2U2NA==';

    // Espía el FileReader global
    const originalFileReader = (global as any).FileReader;
    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public readAsDataURL = jest.fn(() => {
        this.result = fakeResult;
        if (this.onload) this.onload();
      });
    }
    (global as any).FileReader = MockFileReader;

    const compAny = component as any;
    const base64 = await compAny.readFileAsBase64(fakeFile);

    expect(base64).toBe('ZmFrZUJhc2U2NA==');

    // Restaura FileReader original
    (global as any).FileReader = originalFileReader;
  });

  it('🧪 readFileAsBase64() resuelve string vacío si no hay base64', async () => {
    const fakeFile = new Blob(['dummy']) as File;
    const fakeResult = 'data:application/pdf;base64,';

    const originalFileReader = (global as any).FileReader;
    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public readAsDataURL = jest.fn(() => {
        this.result = fakeResult;
        if (this.onload) this.onload();
      });
    }
    (global as any).FileReader = MockFileReader;

    const compAny = component as any;
    const base64 = await compAny.readFileAsBase64(fakeFile);

    expect(base64).toBe('');

    (global as any).FileReader = originalFileReader;
  });

  it('🧪 readFileAsBase64() rechaza si hay error de lectura', async () => {
    const fakeFile = new Blob(['dummy']) as File;
    const fakeError = new Error('Error al leer el archivo PDF');

    const originalFileReader = (global as any).FileReader;
    class MockFileReader {
      public result: string | ArrayBuffer | null = null;
      public error: Error = fakeError;
      public onload: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public readAsDataURL = jest.fn(() => {
        if (this.onerror) this.onerror();
      });
    }
    (global as any).FileReader = MockFileReader;

    const compAny = component as any;
    await expect(compAny.readFileAsBase64(fakeFile)).rejects.toThrow('Error al leer el archivo PDF');

    (global as any).FileReader = originalFileReader;
  });

});
