import { Component } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ChatbotComponent {
  messages: Message[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isOpen: boolean = false; // Pentru collapsable chat

  constructor(private geminiChatService: GeminiService) {}

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    const userMessage: Message = { sender: 'user', text: this.userInput };
    this.messages.push(userMessage);
    this.isLoading = true;

    this.geminiChatService.sendMessage(this.userInput).subscribe({
      next: (response) => {
        let botResponse =
          response.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Eroare: Nu am putut procesa mesajul.';

        // Curățăm textul primit (Markdown, caractere inutile etc.)
        botResponse = this.cleanBotResponse(botResponse);

        const botMessage: Message = { sender: 'bot', text: botResponse };
        this.messages.push(botMessage);
        this.isLoading = false;
      },
      error: () => {
        const errorMessage: Message = {
          sender: 'bot',
          text: 'Eroare de comunicare cu Gemini.',
        };
        this.messages.push(errorMessage);
        this.isLoading = false;
      },
    });

    this.userInput = '';
  }

  private cleanBotResponse(response: string): string {
    return response
      .replace(/\*\*/g, '') // Elimină bold (**text**)
      .replace(/\*/g, '') // Elimină marcatorii de listă (* item)
      .replace(/`/g, '') // Elimină backticks (`text`)
      .replace(/```json/g, '') // Elimină blocurile de cod JSON
      .replace(/```/g, '') // Elimină orice alt bloc de cod
      .replace(/\n/g, '<br>'); // Înlocuiește newline cu <br> (poți înlocui cu '\n' dacă vrei plain text)
  }
}
