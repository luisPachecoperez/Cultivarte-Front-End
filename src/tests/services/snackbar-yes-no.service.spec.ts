// ✅ src/tests/services/snackbar-yes-no.service.spec.ts (versión Jest)
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SnackbarYesNoService } from '../../app/shared/services/snackbar-yes-no.service';
import { ConfirmSnackbarComponent } from '../../app/shared/components/confirm-snackbar/confirm-snackbar.component';

// 🧱 Mock de MatSnackBar con Jest
class MockMatSnackBar {
  openFromComponent = jest.fn();
}

describe('🧩 SnackbarYesNoService (Jest)', () => {
  let service: SnackbarYesNoService;
  let matSnackBar: MockMatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SnackbarYesNoService,
        { provide: MatSnackBar, useClass: MockMatSnackBar },
      ],
    });

    service = TestBed.inject(SnackbarYesNoService);
    matSnackBar = TestBed.inject(MatSnackBar) as unknown as MockMatSnackBar;
  });

  it('✅ debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  // 🔹 Simula la respuesta del usuario (como lo haría el componente confirm)
  const simulateUserResponse = (result: boolean) => {
    (service as any).confirmResult$.next(result);
  };

  // 🔹 Prueba genérica reutilizable
  const testSnackbarMethod = (
    methodName: 'success' | 'warning' | 'error' | 'confirm',
    expectedPanelClass: string[],
    expectedPosition: 'right' | 'center' = 'right'
  ) => {
    it(`🧪 debe abrir ${methodName} snackbar y retornar observable`, (done) => {
      const message = 'Test message';
      const duration = methodName === 'confirm' ? undefined : 3000;

      const obs$ =
        methodName === 'confirm'
          ? service.confirm(message)
          : (service as any)[methodName](message, duration);

      // Simulamos la interacción del usuario
      setTimeout(() => {
        simulateUserResponse(true);
      }, 0);

      obs$.subscribe((result: boolean) => {
        expect(result).toBe(true);

        // Verifica que openFromComponent fue llamado correctamente
        expect(matSnackBar.openFromComponent).toHaveBeenCalled();
        const [component, config] = matSnackBar.openFromComponent.mock.lastCall;

        expect(component).toBe(ConfirmSnackbarComponent);
        expect(config.data.message).toBe(message);
        expect(config.panelClass).toEqual(expectedPanelClass);
        expect(config.horizontalPosition).toBe(expectedPosition);
        expect(config.verticalPosition).toBe('top');
        if (methodName !== 'confirm') {
          expect(config.duration).toBe(duration);
        }
        done();
      });
    });
  };

  describe('✅ success()', () => {
    testSnackbarMethod('success', ['success-snackbar'], 'right');
  });

  describe('⚠️ warning()', () => {
    testSnackbarMethod('warning', ['warning-snackbar'], 'right');
  });

  describe('❌ error()', () => {
    testSnackbarMethod('error', ['error-snackbar'], 'right');
  });

  describe('🟡 confirm()', () => {
    testSnackbarMethod('confirm', ['warning-snackbar'], 'center');
  });

  describe('🧠 comportamiento observable', () => {
    it('debe completar después de la primera emisión (take(1))', (done) => {
      const obs$ = service.confirm('Test');
      let emissionCount = 0;

      obs$.subscribe(() => {
        emissionCount++;
      });

      simulateUserResponse(true);
      simulateUserResponse(false); // segunda emisión no debe contar

      setTimeout(() => {
        expect(emissionCount).toBe(1);
        done();
      }, 20);
    });
  });
});
