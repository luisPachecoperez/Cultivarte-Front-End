import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common'; // 👈 importa NgIf y AsyncPipe
import { DataSyncService } from './indexdb/services/data-sync.service';
import { AuthService } from './shared/services/auth.service';
import { LoadIndexDBService } from './indexdb/services/load-index-db.service';
import { LoadingService } from './shared/services/loading.service';
import { LoadingComponent } from './shared/components/loading/loading';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, LoadingComponent], // 👈 agrega AsyncPipe
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly dataSyncService = inject(DataSyncService);
  private readonly loadIndexDBService = inject(LoadIndexDBService);
  private readonly authService = inject(AuthService);
  protected readonly loadingService = inject(LoadingService); // 👈 usado en el template
  public readonly title: string = 'CultiApp';
  async ngOnInit() {
    console.log('ngoninit del app.component.ts');
    this.loadingService.show(); // 🔄 mostrar
    try {
      await this.dataSyncService.startSync();
      this.loadIndexDBService.cargarDatosIniciales(
        this.authService.getUserUuid(),
      );
    } finally {
      this.loadingService.hide(); // 🔄 ocultar
    }
  }
}
