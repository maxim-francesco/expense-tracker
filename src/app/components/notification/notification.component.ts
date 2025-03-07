import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-notification',
  standalone: true, 
  imports: [CommonModule, NgIf, NgClass],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'warning' = 'success';

  isVisible: boolean = true;

  closeNotification() {
    this.isVisible = false;
  }
  
}
