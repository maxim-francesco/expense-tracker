import { NgIf } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [NgIf],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css'
})
export class LoadingSpinnerComponent {

  public isLoading = false;

}
