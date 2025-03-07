import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-notification',
  imports: [NgClass],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' = 'success';

  isVisible: boolean = true;

  closeNotification() {
    this.isVisible = false;
  }

}
