export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type Category = 'Groceries' | 'Taxes' | 'Entertainment' | 'Education' | 'Clothing' | 'Healthcare' | 'Sports' | 'Travel' | 'Gifts' | 'Miscellaneous';

export interface Expense {
  id: string;
  name: string;
  category: Category;
  amount: number;
  userId: string;
}

export interface CreateExpenseDTO extends Omit<Expense, 'id'> {
  userId: string;
}

export type UpdateExpenseDTO = Partial<CreateExpenseDTO>;

export interface FirestoreExpenseDoc {
  name: string;
  category: Category;
  amount: number;
  userId: string;
}
