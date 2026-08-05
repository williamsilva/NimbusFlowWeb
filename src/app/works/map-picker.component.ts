import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

// Leaflet's default marker icon URLs are built relative to the bundler's asset resolution, which
// breaks under Angular's build - point them at the copies angular.json copies into /leaflet/.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'leaflet/marker-icon-2x.png',
  iconUrl: 'leaflet/marker-icon.png',
  shadowUrl: 'leaflet/marker-shadow.png',
});

// Localização real do parque aquático Acquamania (Guarapari/ES), confirmada via geocodificação
// no OpenStreetMap/Nominatim (POI "Acquamania" tipo "Water Park"). Cadastro de obra é exclusivo
// para dentro do parque, então o mapa fica restrito a essa área em vez de permitir o mundo todo.
// Bounding box exato do polígono do parque no OSM - usado só para desenhar o contorno visual.
const ACQUAMANIA_BOUNDS: L.LatLngBoundsExpression = [
  [-20.5374944, -40.4568807],
  [-20.5344663, -40.4545204],
];

// Mesma área com uma margem (~90m) para tolerar imprecisão de clique/GPS perto da borda (portaria,
// estacionamento) - é o limite realmente usado para restringir pan/zoom e validar cliques.
const ALLOWED_BOUNDS: L.LatLngBounds = L.latLngBounds(
  [-20.5383, -40.4577],
  [-20.5337, -40.4537],
);

@Component({
  selector: 'app-map-picker',
  standalone: true,
  template: `
    <div class="map-picker" [id]="mapId"></div>
    <p class="map-hint" [class.map-hint--error]="lastClickOutOfBounds">
      @if (lastClickOutOfBounds) {
        Ponto fora da área do Acquamania - clique não registrado.
      } @else {
        Selecione a localização dentro da área do parque Acquamania (Guarapari/ES).
      }
    </p>
  `,
  styles: [
    `
      .map-picker {
        height: 320px;
        width: 100%;
        border-radius: 4px;
      }

      .map-hint {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--nf-text-secondary, #6b7280);
      }

      .map-hint--error {
        color: #d32f2f;
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

  ngAfterViewInit(): void {
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
      .bindTooltip('Área do Acquamania');

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
    this.map?.remove();
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
