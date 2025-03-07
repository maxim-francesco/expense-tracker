import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { firebaseConfig } from '../../environment';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${firebaseConfig.googleVisionApiKey}`;

  constructor(private http: HttpClient, private notificationService: NotificationService) {}

  extractText(imageBase64: string): Observable<any> {
    const requestBody = {
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: 'TEXT_DETECTION' }],
        },
      ],
    };

    // return this.http.post<any>(this.apiUrl, requestBody);
    return this.http.post<any>(this.apiUrl, requestBody).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing the image.';

    if (error.status === 400) {
      errorMessage = 'Invalid image format. Please try again.';
      this.notificationService.showNotification(errorMessage, 'error');
    } else if (error.status === 403) {
      errorMessage = 'Google Vision API key is invalid or has exceeded its limit.';
      //user has no business here
      console.log('OCR API Error:', errorMessage);
    } else if (error.status === 500) {
      errorMessage = 'Google Vision API is temporarily unavailable.';
      this.notificationService.showNotification(errorMessage, 'error');
    }

    return throwError(() => new Error(errorMessage));
  }
}
