import { Component, Input } from '@angular/core';
import { Finding, Recommendation, Risk } from '../../../core/models/analysis.model';

@Component({
  selector: 'cia-insights-section',
  standalone: true,
  templateUrl: './insights-section.component.html',
  styleUrl: './insights-section.component.scss',
})
export class InsightsSectionComponent {
  @Input({ required: true }) findings!: Finding[];
  @Input({ required: true }) risks!: Risk[];
  @Input({ required: true }) recommendations!: Recommendation[];
}
