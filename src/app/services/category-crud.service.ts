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
  databaseInstance$,
} from '@angular/fire/database';
import { catchError, from, map, Observable, of, throwError } from 'rxjs';

export interface _Category {
  id?: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryCrudService {

  private basePath = '';

  constructor(private db: Database) {}

  // getCategoriesForUser(_userId: string): Observable<_Category[]> {
  //   const basePath = 'users/' + _userId + '/categories';
  //   const userCatRef = ref(this.db, basePath);
  //   return from(get(userCatRef)).pipe(
  //     map((snapshot) => {
  //       if (snapshot.exists()) {
  //         const data = snapshot.val();
  //         return Object.values(data) as _Category[];
  //       } else {
  //         return [];
  //       }
  //     })
  //   );
  // }

  getCategoriesForUser(_userId: string): Observable<_Category[]> {
    const basePath = 'users/' + _userId + '/categories';
    const userCatRef = ref(this.db, basePath);
    return from(get(userCatRef)).pipe(
      map((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          if (data && typeof data === 'object') {
            const categories = Object.keys(data).map(key => {
              const category = data[key];
              // console.log(`Category key: ${key}, value:`, category);
              return {
                id: key,
                name: category
              } as _Category;
            });

            // console.log('Processed categories:', categories);
            return categories;
          }
          return [];
        } else {
          return [];
        }
      }),
      catchError(error => {
        console.error('Error fetching categories:', error);
        return of([]);
      })
    );
  }

  addCategory(category: string, _userId: string): Observable<void> {
    const basePath = 'users/' + _userId + '/categories';
    const categoryRef = push(ref(this.db, basePath));
    return from(set(categoryRef, category));
  }

  updateCategory(categoryName: string, categoryId: string, _userId: string): Observable<void> {
    if (!categoryId) {
      throw new Error('Category must have an id');
    }
    const basePath = 'users/' + _userId + '/categories/';
    const updates: {[key: string]: string} = {};
    updates[`${basePath}${categoryId}`] = categoryName;
    return from(update(ref(this.db), updates)).pipe(
      catchError(error => {
        console.error('Update failed:', error);
        return throwError(() => new Error('Category update failed'));
      })
    );
  }

  deleteCategory(categoryId: string, _userId: string): Observable<void> {
    const basePath = 'users/' + _userId + '/categories/';
    const categoryRef = ref(this.db, `${basePath}${categoryId}`);
    return from(remove(categoryRef));
  }
}
