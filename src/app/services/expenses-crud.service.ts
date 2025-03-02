import { Injectable } from '@angular/core';
import { Database, push, ref, set } from '@angular/fire/database';
import { from, Observable } from 'rxjs';

export interface Expense2 {
  id?: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExpensesCrudService {
  private basePath = 'expenses/';

  constructor(private db: Database) {}

  // Create
  addExpense(expense: Expense2): Observable<void> {
    const expenseRef = push(ref(this.db, this.basePath));
    const expenseWithId = { ...expense, id: expenseRef.key };
    return from(set(expenseRef, expenseWithId));
  }
}
