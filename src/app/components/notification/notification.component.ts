import { CommonModule, NgClass, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true, 
  imports: [CommonModule, NgIf, NgClass],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
  message: string = '';
  type: 'success' | 'error' | 'warning' = 'success';
  isVisible: boolean = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notification$.subscribe((notification) => {
      if (notification) {
        this.message = notification.message;
        this.type = notification.type;
        this.isVisible = true;

        setTimeout(() => {
          this.isVisible = false;
        }, 3000);
      }
    });
  }
}
