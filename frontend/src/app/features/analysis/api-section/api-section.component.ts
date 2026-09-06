import { Component, Input } from '@angular/core';
import { ApiInfo } from '../../../core/models/analysis.model';
import { BadgeComponent, BadgeTone } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

const METHOD_TONES: Record<string, BadgeTone> = {
  GET: 'brand',
  POST: 'success',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'danger',
};

@Component({
  selector: 'cia-api-section',
  standalone: true,
  imports: [BadgeComponent, EmptyStateComponent],
  templateUrl: './api-section.component.html',
  styleUrl: './api-section.component.scss',
})
export class ApiSectionComponent {
  @Input({ required: true }) apis!: ApiInfo;

  methodTone(method: string): BadgeTone {
    return METHOD_TONES[method.toUpperCase()] ?? 'neutral';
  }
}
