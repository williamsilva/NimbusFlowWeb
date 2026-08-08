import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';

import { I18nService } from '@core/i18n/i18n.service';

// A URL padrão do ícone do Leaflet é resolvida em relação ao bundler, o que quebra no build do
// Angular - aponta pras cópias que o angular.json copia pra /leaflet/ (ver assets em angular.json).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'leaflet/marker-icon-2x.png',
  iconUrl: 'leaflet/marker-icon.png',
  shadowUrl: 'leaflet/marker-shadow.png',
});

// Localização real do parque aquático Acquamania (Guarapari/ES), confirmada via geocodificação no
// OpenStreetMap/Nominatim (POI "Acquamania" tipo "Water Park") - mesmos limites usados no
// map-picker original do NimbusFlowWeb (src/app/works/map-picker.component.ts), portados aqui pra
// manter a mesma regra de negócio (cadastro de obra é exclusivo pra dentro do parque).
const ACQUAMANIA_BOUNDS: L.LatLngBoundsExpression = [
  [-20.5374944, -40.4568807],
  [-20.5344663, -40.4545204],
];

// Mesma área com uma margem (~90m) pra tolerar imprecisão de clique/GPS perto da borda (portaria,
// estacionamento) - é o limite realmente usado pra restringir pan/zoom e validar cliques.
const ALLOWED_BOUNDS: L.LatLngBounds = L.latLngBounds([-20.5383, -40.4577], [-20.5337, -40.4537]);

@Component({
  standalone: true,
  selector: 'app-map-picker',
  imports: [TranslatePipe],
  template: `
    <div class="map-picker" [id]="mapId"></div>
    <p class="map-hint" [class.map-hint--error]="lastClickOutOfBounds">
      @if (lastClickOutOfBounds) {
        {{ 'works.mapPicker.outOfBounds' | translate }}
      } @else {
        {{ 'works.mapPicker.hint' | translate }}
      }
    </p>
  `,
  styles: [
    `
      .map-picker {
        height: 320px;
        width: 100%;
        border-radius: 6px;
      }

      .map-hint {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--p-text-muted-color, #6b7280);
      }

      .map-hint--error {
        color: var(--p-red-500, #d32f2f);
      }
    `,
  ],
})
export class MapPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Output() positionChange = new EventEmitter<{ latitude: number; longitude: number }>();

  readonly mapId = `map-picker-${Math.random().toString(36).slice(2)}`;
  lastClickOutOfBounds = false;

  private map?: L.Map;
  private marker?: L.Marker;
  private destroyed = false;
  private initAttempts = 0;

  constructor(private readonly i18n: I18nService) {}

  ngAfterViewInit(): void {
    // O componente é criado dentro de um p-dialog (works-create-dialog) que fica sempre montado
    // no template (só escondido enquanto `visible=false`, ver works-list.component.html) - então
    // ngAfterViewInit roda muito antes do usuário de fato abrir o diálogo pela 1ª vez, com o
    // container ainda com tamanho 0 (ou, em alguns navegadores/versões do PrimeNG, nem
    // completamente "conectado" ao document ainda). Chamar L.map(...) nesse estado falha
    // silenciosamente (ou inicializa com _size=(0,0) e nunca mais desenha nada, mesmo depois de
    // invalidateSize()). Solução robusta: só inicializar o Leaflet quando o elemento existir E
    // tiver tamanho real - faz polling via requestAnimationFrame em vez de confiar num delay fixo
    // ou no timing exato do (onShow) do dialog (mantido como reforço, não como única defesa).
    this.waitForContainerAndInit();
  }

  private waitForContainerAndInit(): void {
    if (this.destroyed || this.map) {
      return;
    }

    const el = document.getElementById(this.mapId);
    const ready = !!el && el.offsetWidth > 0 && el.offsetHeight > 0;

    if (!ready) {
      this.initAttempts++;
      if (this.initAttempts > 600) {
        // ~10s a 60fps - desiste e loga, pra não ficar num loop silencioso pra sempre se o
        // container nunca ficar visível por algum outro motivo (ex.: dialog nunca abre de verdade).
        console.error('MapPickerComponent: container nunca ficou visível/com tamanho - abortando inicialização do Leaflet.');
        return;
      }
      requestAnimationFrame(() => this.waitForContainerAndInit());
      return;
    }

    try {
      this.initMap();
    } catch (err) {
      console.error('MapPickerComponent: falha ao inicializar o Leaflet.', err);
    }
  }

  private initMap(): void {
    const hasInitialPosition = this.latitude != null && this.longitude != null;

    this.map = L.map(this.mapId, {
      maxBounds: ALLOWED_BOUNDS,
      maxBoundsViscosity: 1, // impede o pan de "escapar" da área permitida
      minZoom: 15,
    });

    if (hasInitialPosition) {
      this.map.setView([this.latitude!, this.longitude!], 17);
      this.marker = L.marker([this.latitude!, this.longitude!]).addTo(this.map);
    } else {
      this.map.fitBounds(ACQUAMANIA_BOUNDS, { padding: [24, 24] });
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    L.rectangle(ACQUAMANIA_BOUNDS, {
      color: '#1976d2',
      weight: 2,
      dashArray: '6 4',
      fillOpacity: 0.05,
    })
      .addTo(this.map)
      .bindTooltip(this.i18n.tUi('works.mapPicker.areaTooltip' as never));

    // Reforço: se o container mudar de tamanho depois (ex.: dialog ainda terminando a transição
    // de abertura mesmo já com offsetWidth/Height > 0), recalcula de novo pra garantir.
    setTimeout(() => this.map?.invalidateSize(), 300);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      if (!this.isWithinAllowedArea(lat, lng)) {
        this.lastClickOutOfBounds = true;
        return;
      }
      this.lastClickOutOfBounds = false;
      this.setMarker(lat, lng);
      this.positionChange.emit({ latitude: lat, longitude: lng });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map || this.latitude == null || this.longitude == null) {
      return;
    }
    if (changes['latitude'] || changes['longitude']) {
      this.setMarker(this.latitude, this.longitude);
      this.map.setView([this.latitude, this.longitude], this.map.getZoom());
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.map?.remove();
  }

  /** Exposto pro pai (ex.: works-create-dialog, no (onShow) do p-dialog) forçar o recálculo do
   *  tamanho quando souber com certeza que a transição de abertura já terminou - ver comentário
   *  em ngAfterViewInit sobre o porquê disso ser necessário dentro de um dialog. */
  invalidateSize(): void {
    this.map?.invalidateSize();
  }

  private isWithinAllowedArea(lat: number, lng: number): boolean {
    return ALLOWED_BOUNDS.contains([lat, lng]);
  }

  private setMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else if (this.map) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }
  }
}
