import { Injectable } from '@angular/core';
import {
  Database,
  ref,
  set,
  remove,
  get,
  update,
  child,
  push,
} from '@angular/fire/database';
import { from, map, Observable } from 'rxjs';

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

  // Read All for User
  getExpensesForUser(userId: string): Observable<Expense2[]> {
    const userExpensesRef = ref(this.db, `${this.basePath}`);
    return from(get(userExpensesRef)).pipe(
      map((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const expenses = Object.values(data) as Expense2[];
          return expenses.filter((expense) => expense.userId === userId);
        } else {
          return [];
        }
      })
    );
  }

  //Read All for User by an certain date
  loadExpensesForUserOnDate(
    userId: string,
    targetDate: string
  ): Observable<Expense2[]> {
    const userExpensesRef = ref(this.db, `${this.basePath}`);
    return from(get(userExpensesRef)).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) {
          return [];
        }

        const data = snapshot.val();
        const expenses = Object.values(data) as Expense2[];

        return expenses.filter((expense) => {
          return (
            expense.userId === userId &&
            this.isSameDay(expense.date, targetDate)
          );
        });
      })
    );
  }

  private isSameDay(expenseDate: string, targetDate: string): boolean {
    const expenseDay = expenseDate.split('T')[0];
    return expenseDay === targetDate;
  }

  // Update
  updateExpense(expense: Expense2): Observable<void> {
    if (!expense.id) {
      throw new Error('Expense must have an id');
    }
    const expenseRef = ref(this.db, `${this.basePath}${expense.id}`);
    return from(update(expenseRef, expense));
  }

  // Delete
  deleteExpense(expenseId: string): Observable<void> {
    const expenseRef = ref(this.db, `${this.basePath}${expenseId}`);
    return from(remove(expenseRef));
  }
}
