import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = new BehaviorSubject<boolean>(false);
  private _requests = 0; // 👈 contador de requests en curso

  readonly loading$: Observable<boolean> = this._loading.asObservable();

  show(): void {
    console.log('LoadingService: show() called');
    this._requests++;
    if (this._requests === 1) {
      this._loading.next(true); // solo muestra si es el primer request
    }
  }

  hide(): void {
    console.log('LoadingService: hide() called');
    if (this._requests > 0) {
      this._requests--;
    }
    if (this._requests === 0) {
      this._loading.next(false); // oculta solo cuando ya no hay requests
    }
  }

  reset(): void {
    this._requests = 0;
    this._loading.next(false);
  }
}
