import { Component, Input } from '@angular/core';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'cia-badge',
  standalone: true,
  template: `<span class="cia-badge cia-badge--{{ tone }}"><ng-content /></span>`,
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
}
