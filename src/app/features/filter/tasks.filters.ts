import { PeriodEnum } from '@models/enums/period.enum';

export interface TasksAdvancedFilters {
  title?: string;

  status?: string[] | null;
  assigneeIds?: string[] | null;
  actionPlanIds?: string[] | null;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;
}
