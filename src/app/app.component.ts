import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf, AsyncPipe } from '@angular/common'; // 👈 importa NgIf y AsyncPipe
import { DataSyncService } from './indexdb/services/data-sync.service';
import { AuthService } from './shared/services/auth.service';
import { LoadIndexDBService } from './indexdb/services/load-index-db.service';
import { LoadingService } from './shared/services/loading.service';
import { LoadingComponent } from './shared/components/loading/loading';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, AsyncPipe, LoadingComponent], // 👈 agrega AsyncPipe
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private dataSyncService = inject(DataSyncService);
  private loadIndexDBService = inject(LoadIndexDBService);
  private authService = inject(AuthService);
  protected loadingService = inject(LoadingService); // 👈 usado en el template
  public title: string = 'CultiApp';
  async ngOnInit() {
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
