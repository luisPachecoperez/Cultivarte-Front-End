import { TestBed } from '@angular/core/testing';

import { LoadingService } from '../../app/shared/services/loading.service';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

describe('🧩 LoadingService (Angular 20)', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingService],
    });
    service = TestBed.inject(LoadingService);
  });

  afterEach(() => {
    // asegurar estado limpio entre pruebas
    service.reset();
  });

  it('✅ debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('🔹 Flujo básico de loading$', () => {
    it('debe emitir false inicialmente', (done) => {
      service.loading$.pipe(take(1)).subscribe((val) => {
        expect(val).toBeFalse();
        done();
      });
    });

    it('debe emitir true al primer show()', (done) => {
      const emitted: boolean[] = [];
      service.loading$.subscribe((val) => emitted.push(val));

      service.show();

      setTimeout(() => {
        expect(emitted).toContain(true);
        expect((service as any)._requests).toBe(1);
        done();
      }, 10);
    });

    it('no debe emitir true más de una vez mientras esté activo', (done) => {
      const trueEmissions: boolean[] = [];

      service.loading$.subscribe((val) => {
        if (val === true) trueEmissions.push(val);
      });

      service.show();
      service.show();
      service.show();

      setTimeout(() => {
        expect(trueEmissions.length).toBe(1);
        expect((service as any)._requests).toBe(3);
        done();
      }, 10);
    });

    it('debe emitir false solo cuando todos los requests terminen', (done) => {
      const emissions: boolean[] = [];
      service.loading$.subscribe((val) => emissions.push(val));

      service.show(); // 1
      service.show(); // 2
      service.hide(); // → 1
      service.hide(); // → 0 → false

      setTimeout(() => {
        expect(emissions).toEqual([false, true, false]);
        expect((service as any)._requests).toBe(0);
        done();
      }, 10);
    });
  });

  describe('🔹 show() y hide()', () => {
    it('debe aumentar y disminuir el contador correctamente', () => {
      expect((service as any)._requests).toBe(0);

      service.show();
      expect((service as any)._requests).toBe(1);

      service.show();
      expect((service as any)._requests).toBe(2);

      service.hide();
      expect((service as any)._requests).toBe(1);

      service.hide();
      expect((service as any)._requests).toBe(0);
    });

    it('no debe permitir contador negativo', () => {
      (service as any)._requests = 0;
      service.hide();
      expect((service as any)._requests).toBe(0);
    });
  });

  describe('🔹 reset()', () => {
    it('debe reiniciar contador y emitir false', (done) => {
      service.show();
      service.show();

      let lastVal: boolean | undefined;
      service.loading$.subscribe((v) => (lastVal = v));

      service.reset();

      setTimeout(() => {
        expect(lastVal).toBeFalse();
        expect((service as any)._requests).toBe(0);
        done();
      }, 10);
    });
  });

  describe('🧠 Casos límite y consistencia', () => {
    it('debe mantener _loading como instancia de BehaviorSubject', () => {
      const internal = (service as any)._loading;
      expect(internal instanceof BehaviorSubject).toBeTrue();
    });

    it('debe mantener consistencia entre _requests y estado observable', (done) => {
      const emitted: boolean[] = [];
      service.loading$.subscribe((v) => emitted.push(v));

      service.show();
      service.hide();

      setTimeout(() => {
        expect((service as any)._requests).toBe(0);
        expect(emitted.at(-1)).toBeFalse();
        done();
      }, 10);
    });
  });
});
