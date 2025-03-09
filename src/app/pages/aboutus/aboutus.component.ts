import { Component } from '@angular/core';

@Component({
  selector: 'app-aboutus',
  imports: [],
  templateUrl: './aboutus.component.html',
  styleUrl: './aboutus.component.css'
})
export class AboutusComponent {
  scrollToIntro(): void {
    const element = document.querySelector(".intro-text");
    if (element) {
      const offset = element.getBoundingClientRect().top + window.scrollY - 20; // Adjust for header space if needed
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }
  
}
