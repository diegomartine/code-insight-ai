import { Component, Input } from '@angular/core';

@Component({
  selector: 'cia-empty-state',
  standalone: true,
  template: `<p class="cia-empty">{{ message }}</p>`,
})
export class EmptyStateComponent {
  @Input() message = 'No se detectó información suficiente.';
}
