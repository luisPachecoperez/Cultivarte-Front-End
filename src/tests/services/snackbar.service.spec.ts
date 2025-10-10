// ✅ src/tests/services/snackbar.service.spec.ts (versión Jest)
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { ConfirmSnackbarComponent } from '../../app/shared/components/confirm-snackbar/confirm-snackbar.component';

// Mock de MatSnackBar
class MockMatSnackBar {
  open = jest.fn();
  openFromComponent = jest.fn();
}

describe('🧩 SnackbarService (Jest)', () => {
  let service: SnackbarService;
  let matSnackBar: MockMatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SnackbarService,
        { provide: MatSnackBar, useClass: MockMatSnackBar },
      ],
    });

    service = TestBed.inject(SnackbarService);
    matSnackBar = TestBed.inject(MatSnackBar) as unknown as MockMatSnackBar;
  });

  it('✅ debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  // --- Pruebas para success, warning, error ---
  ['success', 'warning', 'error'].forEach((method) => {
    it(`✅ debe abrir snackbar para ${method}`, () => {
      (service as any)[method]('Test message');
      expect(matSnackBar.open).toHaveBeenCalledWith(
        'Test message',
        'Cerrar',
        expect.any(Object)
      );
    });
  });

  // --- Prueba para confirm (mock dinámico del componente) ---
  it('✅ debe emitir resultado al confirmar', (done) => {
    // Mock dinámico del import si existe el método loadConfirmComponent
    if ((service as any).loadConfirmComponent) {
      jest
        .spyOn(service as any, 'loadConfirmComponent')
        .mockResolvedValue({ ConfirmSnackbarComponent });
    }

    const confirm$ = service.confirm('¿Seguro?');

    // Simulamos resolución del observable (como si el usuario confirmara)
    setTimeout(() => {
      service.resolveConfirm(true);
    }, 10);

    confirm$.subscribe((result: boolean) => {
      expect(result).toBe(true);

      if ((service as any).loadConfirmComponent) {
        expect(matSnackBar.openFromComponent).toHaveBeenCalledWith(
          ConfirmSnackbarComponent,
          expect.any(Object)
        );
      }
      done();
    });
  });
});
