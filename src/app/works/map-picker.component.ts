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

const DEFAULT_CENTER: L.LatLngTuple = [-23.5505, -46.6333]; // São Paulo, só como ponto de partida do mapa

@Component({
  selector: 'app-map-picker',
  standalone: true,
  template: '<div class="map-picker" [id]="mapId"></div>',
  styles: [
    `
      .map-picker {
        height: 320px;
        width: 100%;
        border-radius: 4px;
      }
    `,
  ],
})
export class MapPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Output() positionChange = new EventEmitter<{ latitude: number; longitude: number }>();

  readonly mapId = `map-picker-${Math.random().toString(36).slice(2)}`;

  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit(): void {
    const hasInitialPosition = this.latitude != null && this.longitude != null;
    const center: L.LatLngTuple = hasInitialPosition ? [this.latitude!, this.longitude!] : DEFAULT_CENTER;

    this.map = L.map(this.mapId).setView(center, hasInitialPosition ? 15 : 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    if (hasInitialPosition) {
      this.marker = L.marker(center).addTo(this.map);
    }

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
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

  private setMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else if (this.map) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }
  }
}
