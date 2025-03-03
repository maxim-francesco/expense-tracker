import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { firebaseConfig } from '../../environment';
import { Expense2 } from './expenses-crud.service';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${firebaseConfig.geminiApiKey}`;

  constructor(private http: HttpClient) {}

  extractExpenses(ocrText: string): Observable<any> {
    const prompt = `
        Extrage toate produsele și prețurile din acest bon de cumpărături:

        ${ocrText}

        ✅ Răspunde STRICT cu un array JSON valid, fără text explicativ. Fiecare element trebuie să respecte structura:

        [
            {
                "name": "Numele produsului",
                "amount": 12.99,
                "category": "Categorie"
            }
        ]

        🔒 Categoria trebuie să fie EXACT una dintre:
        'Groceries' | 'Taxes' | 'Entertainment' | 'Education' | 'Clothing' | 'Healthcare' | 'Sports' | 'Travel' | 'Gifts' | 'Miscellaneous'

        ❗ Dacă nu se potrivește clar, pune "Miscellaneous".

        ⚠️ IMPORTANT:
        - Fără delimitatori de cod (fără \`\`\`json sau altceva).
        - Fără explicații sau comentarii.
        - Returnează DOAR array-ul JSON conform structurii.
        `;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(this.apiUrl, requestBody, { headers });
  }

  sendMessage(message: string): Observable<any> {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Ești un asistent financiar. Răspunde la întrebările despre educație financiară într-un mod clar și prietenos. Întrebarea utilizatorului este: "${message}"`,
            },
          ],
        },
      ],
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.apiUrl, requestBody, { headers });
  }

  analyzeWeeklyExpenses(expenses: Expense2[]): Observable<any> {
    const expensesText = expenses
      .map(
        (exp) =>
          `${exp.date} - ${exp.category} - ${exp.name}: ${exp.amount} RON`
      )
      .join('\n');

    const prompt = `
Am următoarele cheltuieli înregistrate pentru săptămâna aceasta:

${expensesText}

✅ Te rog să-mi faci o analiză financiară scurtă și la obiect, fără formatare fancy, fără bold, fără steluțe. Scrie doar text simplu, clar și util.
✅ Vreau să îmi spui:

1. Care sunt categoriile principale unde am cheltuit cel mai mult?
2. Observații importante - vezi ceva riscant sau problematic în aceste cheltuieli?
3. Sfaturi pentru gestionarea mai bună a banilor (maxim 3 sfaturi, nu foarte lungi).
4. Un scor financiar săptămânal pe o scară de la 1 la 10.

❗ Răspunde direct, doar cu text simplu. Evită orice introduceri, concluzii lungi sau urări de final.
`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(this.apiUrl, requestBody, { headers });
  }
}
