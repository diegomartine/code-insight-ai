import { Component, Input } from '@angular/core';

@Component({
  selector: 'cia-functional-summary',
  standalone: true,
  templateUrl: './functional-summary.component.html',
  styleUrl: './functional-summary.component.scss',
})
export class FunctionalSummaryComponent {
  @Input({ required: true }) summary!: string;
}
