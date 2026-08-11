import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { ProjectsFacade } from '@features/facade/projects.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { ProjectsPermissionPolicy } from '@features/projects/projects-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { ProjectModel } from '@models/projects.models';
import { projectStatusTone } from '@models/enums/project-status.enum';
import { ProjectsUpsertDialogComponent } from '@features/projects/projects-upsert-dialog.component';

@Component({
  standalone: true,
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  imports: [
    DecimalPipe,
    TableModule,
    ButtonModule,
    CsCurrencyPipe,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    ProjectsUpsertDialogComponent,
  ],
})
export class ProjectsListComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly facade = inject(ProjectsFacade);
  readonly policy = inject(ProjectsPermissionPolicy);

  readonly upsertVisible = signal(false);
  readonly selectedProject = signal<ProjectModel | null>(null);

  readonly items = computed<ProjectModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  ngOnInit(): void {
    this.facade.loadAll();
  }

  refresh(): void {
    this.facade.loadAll(true);
  }

  tone(status: string): ReturnType<typeof projectStatusTone> {
    return projectStatusTone(status);
  }

  goNew(): void {
    if (!this.policy.canManage()) return;
    this.selectedProject.set(null);
    this.upsertVisible.set(true);
  }

  edit(row: ProjectModel): void {
    if (!this.policy.canManage()) return;
    this.selectedProject.set(row);
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(v: boolean): void {
    this.upsertVisible.set(v);
    if (!v) this.selectedProject.set(null);
  }
}
