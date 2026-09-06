import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisResponse } from '../../../core/models/analysis.model';

@Component({
  selector: 'cia-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.component.html',
  styleUrl: './summary-card.component.scss',
})
export class SummaryCardComponent {
  @Input({ required: true }) result!: AnalysisResponse;

  get confidencePercent(): number {
    return Math.round((this.result.architecture.confidence ?? 0) * 100);
  }
}
