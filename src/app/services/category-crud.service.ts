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

export interface _Category {
  id?: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryCrudService {

  private basePath = '/categories';

  constructor(private db: Database) {}

  addCategory(category: _Category): Observable<void> {
    const categoryRef = push(ref(this.db, this.basePath));
    const categoryWithId = { ...category, id: categoryRef.key };
    return from(set(categoryRef, categoryWithId));
  }

  // getExpensesForUser(userId: string): Observable<_Category[]> {
  //   const userExpensesRef = ref(this.db, `${this.basePath}`);
  //   return from(get(userExpensesRef)).pipe(
  //     map((snapshot) => {
  //       if (snapshot.exists()) {
  //         const data = snapshot.val();
  //         const expenses = Object.values(data) as _Category[];
  //         return expenses.filter((expense) => expense.userId === userId);
  //       } else {
  //         return [];
  //       }
  //     })
  //   );
  // }

  updateCategory(category: _Category): Observable<void> {
    if (!category.id) {
      throw new Error('Category must have an id');
    }
    const categoryRef = ref(this.db, `${this.basePath}${category.id}`);
    return from(update(categoryRef, category));
  }

  deleteCategory(categoryId: string): Observable<void> {
    const categoryRef = ref(this.db, `${this.basePath}${categoryId}`);
    return from(remove(categoryRef));
  }
}
