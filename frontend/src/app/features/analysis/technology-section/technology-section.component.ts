import { Component, Input } from '@angular/core';
import { TechnologyInfo } from '../../../core/models/analysis.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'cia-technology-section',
  standalone: true,
  imports: [BadgeComponent, EmptyStateComponent],
  templateUrl: './technology-section.component.html',
})
export class TechnologySectionComponent {
  @Input({ required: true }) technology!: TechnologyInfo;
}
