import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import {
  TrackerConfigService,
  TrackerConfig,
} from '../../services/tracker-config.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../services/crud.service';
import {
  CreateExpenseDTO,
  DayOfWeek,
  Expense,
  UpdateExpenseDTO,
  Category,
} from '../../models/expense.model';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { PieComponent } from '../../components/pie/pie.component';
import { ExcelService } from '../../services/excel.service';
import { GeminiService } from '../../services/gemini.service';
import { OcrService } from '../../services/ocr.service';
import { ChatbotComponent } from '../../components/chatbot/chatbot.component';
import { ExpensesCrudService } from '../../services/expenses-crud.service';
import { Expense2 } from '../../services/expenses-crud.service';
import { AuthService } from '../../services/auth.service';
import { _Category, CategoryCrudService } from '../../services/category-crud.service';

interface DaySpending {
  date: string;
  dayName: string;
  expenses: Expense2[];
  total: number;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, PieComponent, ChatbotComponent],
  templateUrl: './tracker.component.html',
  styleUrls: ['./tracker.component.css'],
})
export class TrackerComponent implements OnInit {

  categories: _Category[] = [];
  filteredCategories: _Category[] = [];


  //Services---------------------------------------------------------
  constructor(
    private authService: AuthService,
    //private trackerConfigService: TrackerConfigService,
    //private crudService: CrudService,
    private cdr: ChangeDetectorRef,
    private confirmDialogService: ConfirmDialogService,
    private excelService: ExcelService,
    private ocrService: OcrService,
    private geminiService: GeminiService,
    private expensesCrudService: ExpensesCrudService,
    private categoryCrudService: CategoryCrudService,
  ) {}


  ngOnInit() {
    this.loadTodayExpenses();
    this.loadWeekDays();
    this.loadExpensesForWeek(this.week);
    this.loadCategories();
    this.filteredCategories = [...this.categories];
    const { startDate, endDate } = this.getWeekInterval(new Date().toISOString().split('T')[0]);
    this.currentWeekStart = startDate.toISOString().split('T')[0];
    this.currentWeekEnd = endDate.toISOString().split('T')[0];
  }

  //------------------------------------------------------------------

  //Excel-------------------------------------------------------------

  exportToExcel(): void {
    const dataForExcel = this.weeklySpending.flatMap((day) =>
      day.expenses.map((expense) => ({
        Date: day.date,
        Day: day.dayName,
        Name: expense.name,
        Category: expense.category,
        Amount: expense.amount,
      }))
    );

    this.excelService.generateExcel(dataForExcel, 'Weekly_Expenses');
  }

  //------------------------------------------------------------------

  //Extracting from photo----------------------------------------------------------

  imageUrl: string | ArrayBuffer | null = null;
  extractedText: string = '';
  extractedExpenses: Expense2[] = [];
  selectedFile: File | null = null;

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];

      const reader = new FileReader();
      reader.onload = (e) => (this.imageUrl = e.target!.result);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  processImage(): void {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = (reader.result as string).split(',')[1];
      this.ocrService.extractText(base64Image).subscribe((response) => {
        if (response.responses && response.responses.length > 0) {
          this.extractedText =
            response.responses[0].fullTextAnnotation?.text || '';
          this.scanReceiptAndExtractExpenses(this.extractedText);
        }
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }

  scanReceiptAndExtractExpenses(ocrText: string): void {
    const userId = this.authService.getId()!;
    const today = new Date().toISOString().split('T')[0];

    this.geminiService.extractExpenses(ocrText).subscribe((response) => {
      let rawText = response.candidates[0]?.content?.parts[0]?.text || '[]';

      const cleanedText = rawText
        .replace(/^```json\s*/, '')
        .replace(/```$/, '');

      const extractedExpenses = JSON.parse(cleanedText);

      this.extractedExpenses = extractedExpenses.map((expense: any) => ({
        ...expense,
        date: today,
        userId: userId,
      }));

      this.addExtractedExpensesToDatabase(this.extractedExpenses);
    });
  }

  addExtractedExpensesToDatabase(expenses: Expense2[]) {
    expenses.forEach((expense) => {
      this.addExpense(expense);
    });
  }

  //------------------------------------------------------------------

  //AI Analysis

  weeklyAnalysis: string = '';

  sendWeeklyExpensesToGemini(): void {
    const allExpenses = this.weeklySpending.flatMap((day) => day.expenses);

    this.geminiService
      .analyzeWeeklyExpenses(allExpenses)
      .subscribe((response) => {
        const analysis = response.candidates[0]?.content?.parts[0]?.text;
        console.log('Gemini Analysis:', analysis);

        this.weeklyAnalysis = analysis;
      });
  }

  //------------------------------------------------------------------

  //UI Expenses--------------------------------------------------------

  // categories: Category[] = [
  //   'Groceries',
  //   'Taxes',
  //   'Entertainment',
  //   'Education',
  //   'Clothing',
  //   'Healthcare',
  //   'Sports',
  //   'Travel',
  //   'Gifts',
  //   'Miscellaneous',
  // ];

  selectedDay: { date: string; dayName: string } | undefined = undefined;

  week: { date: string; dayName: string }[] = [];

  // 1️⃣ Funcție existentă: intervalul complet al săptămânii pe baza unei date
  getWeekInterval(dateString: string): { startDate: Date; endDate: Date } {
    const date = new Date(dateString);

    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // dacă e duminică, ne întoarcem 6 zile
    const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // până la final de săptămână

    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToMonday);

    const sunday = new Date(date);
    sunday.setDate(date.getDate() + daysToSunday);

    return { startDate: monday, endDate: sunday };
  }

  // 2️⃣ Funcție nouă: vector cu 7 zile - nume + dată (Luni-Duminică)
  getCurrentWeekWithDays(startDate: string = new Date().toISOString().split('T')[0]): { date: string; dayName: string }[] {
    const date = new Date(startDate);

    // Get the first day of the week (Monday)
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    if (dayOfWeek === 0) {
      // If today is Sunday, move back 6 days to Monday
      monday.setDate(date.getDate() - 6);
    } else {
      // Otherwise, move back (dayOfWeek - 1) days
      monday.setDate(date.getDate() - (dayOfWeek - 1));
    }

    // Generate the week (Monday - Sunday)
    const week: { date: string; dayName: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);

      week.push({
        date: currentDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        dayName: this.getDayOfWeek(currentDate.toISOString().split('T')[0]),
      });
    }

    return week;
  }

  // Helper: ziua săptămânii pentru o dată dată (folosită și în ambele metode)
  private getDayOfWeek(dateString: string): string {
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const date = new Date(dateString);
    return daysOfWeek[date.getDay()];
  }

  isDateInFutureOrPast(dateString: string): boolean {
    const today = new Date();
    const inputDate = new Date(dateString);
    return inputDate > today; // true = viitor, false = trecut sau azi
  }

  findDayByDate(date: string): { date: string; dayName: string } | undefined {
    return this.week.find((day) => day.date === date);
  }

  loadWeekDays(startDate: string = new Date().toISOString().split('T')[0]) {
    this.displayedWeekStart = startDate;
    this.week = this.getCurrentWeekWithDays(startDate);
    this.selectedDay = this.findDayByDate(startDate);
    this.expenses2 = [];
    this.loadExpensesForWeek(this.week);  // Load expenses for the selected week
  }

  //------------------------------------------------------------------

  //CRUD EXPENSES------------------------------------------------------

  expenses2: Expense2[] = [];

  //CREATE

  private createNewItem() {
    const newExpense: Expense2 = {
      name: this.expenseName,
      amount: this.expenseAmount!,
      date: this.selectedDay!.date,
      category: this.selectedCategory,
      userId: this.authService.getId()!,
    };
    return newExpense;
  }

  private resetSavingForm() {
    this.resetForm();
    this.showExpenseForm = false;
  }

  addExpenseFromForm(): void {
    const newExpense = this.createNewItem();
    this.resetSavingForm();
    this.addExpense(newExpense);
  }

  addExpense(newExpense: Expense2) {
    this.expensesCrudService.addExpense(newExpense).subscribe((response) => {
      this.loadExpensesForUserOnDate(this.selectedDay!.date);
    });
  }

  //READ

  loadTodayExpenses() {
    this.loadExpensesForUserOnDate(new Date().toISOString().split('T')[0]);
  }

  loadExpenses(): void {
    this.expensesCrudService
      .getExpensesForUser(this.authService.getId()!)
      .subscribe((expenses) => {
        this.expenses2 = expenses;
      });
  }

  loadExpensesForUserOnDate(date: string) {
    this.expensesCrudService
      .loadExpensesForUserOnDate(this.authService.getId()!, date)
      .subscribe((expenses) => {
        this.expenses2 = expenses;
      });
  }

  weeklySpending: DaySpending[] = [];

  loadExpensesForWeek(week: { date: string; dayName: string }[]): void {
    this.expensesCrudService
      .getExpensesForUser(this.authService.getId()!)
      .subscribe((expenses) => {
        this.expenses2 = [];
        this.weeklySpending = week.map((day) => {
          const expensesForDay = expenses.filter(
            (exp) => exp.date === day.date
          );
          const total = expensesForDay.reduce(
            (sum, exp) => sum + exp.amount,
            0
          );

          return {
            date: day.date,
            dayName: day.dayName,
            expenses: expensesForDay,
            total: total,
            isExpanded: true
          };
        });

        this.selectedDay = this.week[0];

        this.loadExpensesForUserOnDate(this.selectedDay.date);
      });
  }

  getWeeklyTotal(): number {
    return this.weeklySpending.reduce((sum, day) => sum + day.total, 0);
  }

  getWeeklyCategoryTotals(): { category: string; total: number }[] {
    const categoryMap = new Map<string, number>();

    for (const day of this.weeklySpending) {
      for (const expense of day.expenses) {
        const currentAmount = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, currentAmount + expense.amount);
      }
    }

    return Array.from(categoryMap.entries()).map(([category, total]) => ({
      category,
      total,
    }));
  }

  //UPDATE

  private updateModeForm(expense: Expense2) {
    if (!expense) return;

    this.isEditing = true;
    this.showExpenseForm = true;
    this.isSaveDisabled = true;
  }

  private showDataForUpdateMode(expense: Expense2) {
    this.expenseName = expense.name;
    this.selectedCategory = expense.category;
    this.expenseAmount = expense.amount;
    this.editingExpenseId = expense.id!;
  }

  turnOnUpdateMode(expense: Expense2) {
    this.updateModeForm(expense);
    this.showDataForUpdateMode(expense);
  }

  private updatedItem() {
    const updatedItem = this.createNewItem();
    updatedItem.id = this.editingExpenseId!;
    return updatedItem;
  }

  updateExpense2(): void {
    const updatedExpense = this.updatedItem();
    this.resetSavingForm();
    this.expensesCrudService.updateExpense(updatedExpense).subscribe(() => {
      this.loadExpensesForUserOnDate(this.selectedDay!.date);
    });
  }

  //DELETE

  private verifyDeletion() {
    return this.confirmDialogService.confirm({
      message: 'Are you sure you want to delete this expense?',
    });
  }

  private delete(expense: Expense2) {
    if (expense.id) {
      this.expensesCrudService.deleteExpense(expense.id).subscribe(() => {
        this.loadExpensesForUserOnDate(this.selectedDay!.date);
      });
    }
  }

  deleteExpense2(expense: Expense2): void {
    this.verifyDeletion().subscribe(() => {
      this.delete(expense);
    });
  }

  //--------------------------------------------------------------------

  //UI -----------------------------------------------------------------

  onKeyPress(event: KeyboardEvent): boolean {
    const charCode = event.which || event.keyCode;
    const inputValue = (event.target as HTMLInputElement).value;

    if (
      [46, 8, 9, 27, 13].indexOf(charCode) !== -1 ||
      (charCode === 65 && event.ctrlKey === true) ||
      (charCode === 67 && event.ctrlKey === true) ||
      (charCode === 86 && event.ctrlKey === true) ||
      (charCode === 88 && event.ctrlKey === true)
    ) {
      return true;
    }

    if (charCode === 46 && inputValue.includes('.')) {
      return false;
    }

    if (charCode === 46 || (charCode >= 48 && charCode <= 57)) {
      return true;
    }

    return false;
  }

  validateAmount(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    this.errorMessage = '';

    if (!value) {
      return;
    }

    const numValue = parseFloat(value);

    if (numValue <= 0) {
      this.errorMessage = 'Amount must be greater than 0';
      return;
    }

    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) {
        input.value = numValue.toFixed(2);
      }
    }
  }

  validateFormAtSave() {
    this.isSaveDisabled =
      !this.selectedCategory ||
      !this.expenseName ||
      !this.expenseAmount ||
      this.expenseAmount <= 0;
  }
  validateFormAtUpdate() {
    this.isSaveDisabled = false;
  }

  resetForm() {
    this.expenseName = '';
    this.selectedCategory = '';
    this.expenseAmount = null;
    this.isEditing = false;
    this.editingExpenseId = null;
  }

  errorMessage: string = '';
  selectedCategory: string = '';
  isSaveDisabled: boolean = true;
  expenseName: string = '';
  expenseAmount: number | null = null;

  showCategoryPopup = false;
  showExpenseForm = false;
  showWeeklyOverview = false;
  showAnalysisOverview = false;
  showAIExpertiseOverview = false;
  isEditing = false;
  editingExpenseId: string | null = null;

  expendedDay: { date: string; dayName: string } | null = null;
  expendedDayExpenses: Expense2[] = [];

  newCategory = '';

  editingCategory: string | undefined = undefined;
  editedCategory: string = '';

  loadCategories() {
    const userId = this.authService.getId();
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    this.categoryCrudService.getCategoriesForUser(userId)
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.filteredCategories = categories;
        },
        error: (err) => {
          console.error('Error loading categories:', err);
        },
        complete: () => {}
      });
  }

  toggleCategoryPopup() {
    this.showCategoryPopup = !this.showCategoryPopup;
    this.newCategory = '';
    this.filterCategories();
  }

  addCategory() {
    this.categoryCrudService.addCategory(this.newCategory, this.authService.getId()!).subscribe((response) => {});
    this.newCategory = '';
    this.loadCategories();
    // this.filterCategories();
  }

  deleteCategory(categoryId: string) {
    this.categoryCrudService.deleteCategory(categoryId, this.authService.getId()!);
    this.loadCategories();
  }

  editCategory(category: _Category) {
    this.editingCategory = category.id;
    this.editedCategory = category.name;
  }

  saveEditedCategory(categoryId: string) {
    this.categoryCrudService.updateCategory(this.editedCategory, categoryId, this.authService.getId()!);
    this.editingCategory = undefined;
    this.loadCategories();
  }

  filterCategories() {
    if (!this.newCategory.trim()) {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = this.categories.filter(category =>
        category.name.toLowerCase().includes(this.newCategory.toLowerCase())
      );
    }
  }

  toggleExpenseForm() {
    this.showExpenseForm = !this.showExpenseForm;
    if (!this.showExpenseForm) {
      this.resetForm();
    }
  }

  toggleWeeklyOverview() {
    this.showWeeklyOverview = !this.showWeeklyOverview;
    this.showExpenseForm = false;
    this.showAnalysisOverview = false;
    this.loadExpensesForWeek(this.week);
  }

  toggleAnalysisOverview() {
    this.showAnalysisOverview = !this.showAnalysisOverview;
    this.showExpenseForm = false;
    this.showWeeklyOverview = false;
  }

  toggleAIExpertiseOverview() {
    this.showAIExpertiseOverview = !this.showAIExpertiseOverview;
    this.showAnalysisOverview = !this.showAnalysisOverview;
    this.sendWeeklyExpensesToGemini();
  }

  // async toggleDayExpenses(day: { date: string; dayName: string }) {
  //   if (this.expendedDay === day) {
  //     this.expendedDay = null;
  //     this.expendedDayExpenses = [];
  //   } else {
  //     this.expendedDay = day;
  //     this.expensesCrudService
  //       .loadExpensesForUserOnDate(this.authService.getId()!, day.date)
  //       .subscribe((expenses) => {
  //         this.expendedDayExpenses = expenses;
  //       });
  //     this.cdr.detectChanges();
  //   }
  // }

  async toggleDayExpenses(day: DaySpending) {
    day.isExpanded = !day.isExpanded;
    if (day.isExpanded && (!day.expenses || day.expenses.length === 0)) {
      this.expensesCrudService
        .loadExpensesForUserOnDate(this.authService.getId()!, day.date)
        .subscribe((expenses) => {
          day.expenses = expenses;
          this.cdr.detectChanges();
        });
    }
    this.cdr.detectChanges();
  }
  //Category

  // async addCategory() {
  //   if (this.newCategory.trim() === '') return;
  //   const existingCategory = this.categories.find(
  //     (cat) => cat.name.toLowerCase() === this.newCategory.toLowerCase()
  //   );
  //   if (existingCategory) {
  //     //alert('Category already exists!');
  //     return;
  //   }

  //   const newCategoryId = await this.crudService.addCategory(this.newCategory);
  //   if (newCategoryId) {
  //     this.categories.push({
  //       id: newCategoryId,
  //       name: this.newCategory,
  //       isDefault: false,
  //     });
  //   }
  //   this.newCategory = '';
  //   this.showCategoryPopup = false;
  // }

  // editCategory(category: Category) {
  //   if (category.isDefault) {
  //     //alert("You cannot edit default categories!");
  //     return;
  //   }
  //   this.editingCategory = category.id;
  //   this.editedCategory = category.name;
  // }

  // async saveEditedCategory() {
  //   if (!this.editedCategory.trim()) return;
  //   const categoryToUpdate = this.categories.find(
  //     (cat) => cat.id === this.editingCategory
  //   );
  //   if (categoryToUpdate && !categoryToUpdate.isDefault) {
  //     const success = await this.crudService.updateCategory(
  //       categoryToUpdate.id,
  //       this.editedCategory,
  //       categoryToUpdate.isDefault
  //     );
  //     if (success) {
  //       categoryToUpdate.name = this.editedCategory;
  //     }
  //   }
  //   this.editingCategory = null;
  // }

  // async deleteCategory(category: { id: string; isDefault: boolean }) {
  //   if (category.isDefault) {
  //     // alert("You cannot delete default categories!");
  //     return;
  //   }
  //   const success = await this.crudService.deleteCategory(
  //     category.id,
  //     category.isDefault
  //   );
  //   if (success) {
  //     this.categories = this.categories.filter((cat) => cat.id !== category.id);
  //   }
  // }

  displayedWeekStart: string = new Date().toISOString().split('T')[0]; // Track the start of the current displayed week


  currentWeekStart: string = '';  // Start date of the current week
  currentWeekEnd: string = '';    // End date of the current week

  goToPreviousWeek() {
    const firstDayOfWeek = new Date(this.displayedWeekStart);
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - 7);  // Move back a week

    this.displayedWeekStart = firstDayOfWeek.toISOString().split('T')[0];

    this.expenses2 = []; //clear expenses

    this.loadWeekDays(this.displayedWeekStart);
  }

  goToNextWeek() {
    if (this.isCurrentWeek()) return;  // Prevent moving past the current week

    const firstDayOfWeek = new Date(this.displayedWeekStart);
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);  // Move forward a week

    this.displayedWeekStart = firstDayOfWeek.toISOString().split('T')[0];

    this.expenses2 = []; //clear expenses

    this.loadWeekDays(this.displayedWeekStart);
  }

  isCurrentWeek(): boolean {
    return this.week[0].date === this.currentWeekStart;
  }

  getFormattedWeekRange(): string {
    const { startDate, endDate } = this.getWeekInterval(this.displayedWeekStart);

    const formatDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const monthAbbr = date.toLocaleString('en-US', { month: 'short' });
      return `${day}.${monthAbbr}`;
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

}
