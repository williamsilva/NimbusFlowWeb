import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { MeasurementsAdvancedFilters } from '@features/filter/measurements.filters';
import {
  MeasurementApiModel,
  MeasurementDecisionInput,
  MeasurementSubmitInput,
  MeasurementWithContextApiModel,
  MeasurementWithContextModel,
  mapMeasurementApiModel,
  mapMeasurementApiModels,
  mapMeasurementWithContextApiModels,
} from '@models/measurements.models';

@Injectable({ providedIn: 'root' })
export class MeasurementsApiService {
  private readonly http = inject(HttpClient);
  private readonly worksUrl = `${API.bff}/v1/works`;
  private readonly measurementsUrl = `${API.bff}/v1/measurements`;

  findByWork(workId: string) {
    return this.http
      .get<MeasurementApiModel[]>(`${this.worksUrl}/${workId}/measurements`)
      .pipe(map(mapMeasurementApiModels));
  }

  searchPaged(body: ListQueryDto<MeasurementsAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<MeasurementWithContextApiModel>>(`${this.measurementsUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapMeasurementWithContextApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: { ...(res?._embedded ?? {}), content },
          } as HalPagedResponse<MeasurementWithContextModel>;
        }),
      );
  }

  /** multipart/form-data: parte "data" (JSON) + partes "files" (0..n) - espelha MeasurementController.submit. */
  submit(workId: string, input: MeasurementSubmitInput) {
    const formData = new FormData();
    const data = {
      description: input.description,
      percentageCompleted: input.percentageCompleted,
      amountToPay: input.amountToPay,
      dueDate: input.dueDate,
      supersedesId: input.supersedesId,
      planPositionX: input.planPositionX,
      planPositionY: input.planPositionY,
      deviceLatitude: input.deviceLatitude,
      deviceLongitude: input.deviceLongitude,
    };
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    input.files.forEach((file) => formData.append('files', file));

    return this.http
      .post<MeasurementApiModel>(`${this.worksUrl}/${workId}/measurements`, formData)
      .pipe(map(mapMeasurementApiModel));
  }

  approve(id: string, input: MeasurementDecisionInput) {
    return this.http
      .post<MeasurementApiModel>(`${this.measurementsUrl}/${id}/approve`, input)
      .pipe(map(mapMeasurementApiModel));
  }

  reject(id: string, input: MeasurementDecisionInput) {
    return this.http
      .post<MeasurementApiModel>(`${this.measurementsUrl}/${id}/reject`, input)
      .pipe(map(mapMeasurementApiModel));
  }
}
