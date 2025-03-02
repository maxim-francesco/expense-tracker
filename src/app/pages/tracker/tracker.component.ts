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

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, PieComponent, ChatbotComponent],
  templateUrl: './tracker.component.html',
  styleUrls: ['./tracker.component.css'],
})
export class TrackerComponent implements OnInit {
  errorMessage: string = '';
  selectedCategory: string = '';
  isSaveDisabled: boolean = true;
  expenseName: string = '';
  expenseAmount: number | null = null;

  dailyTotals: { [key in DayOfWeek]: number } = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  };

  days: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  selectedDay: DayOfWeek = 'Monday';
  categories: Category[] = [
    'Groceries',
    'Taxes',
    'Entertainment',
    'Education',
    'Clothing',
    'Healthcare',
    'Sports',
    'Travel',
    'Gifts',
    'Miscellaneous',
  ];
  newCategory = '';
  showCategoryPopup = false;
  showExpenseForm = false;
  showWeeklyOverview = false;
  showAnalysisOverview = false;
  showAIExpertiseOverview = false;
  dailyExpenses: Expense[] = [];

  _expenses: Expense[] = [];

  isEditing = false;
  editingExpenseId: string | null = null;

  _newExpense: CreateExpenseDTO = {
    name: '',
    category: 'Groceries',
    amount: 0,
  };

  _updates: UpdateExpenseDTO = {
    name: 'Updated Lunch',
    amount: 25,
    category: 'Groceries',
  };

  expense: any[] = [];

  expendedDay: DayOfWeek | null = null;
  expendedDayExpenses: Expense[] = [];

  // dummy data for excel
  data = [
    { Name: 'John Doe', Age: 30, City: 'New York' },
    { Name: 'Jane Smith', Age: 25, City: 'San Francisco' },
    // Add more data as needed
  ];

  constructor(
    private trackerConfigService: TrackerConfigService,
    private crudService: CrudService,
    private cdr: ChangeDetectorRef,
    private confirmDialogService: ConfirmDialogService,
    private excelService: ExcelService,
    private ocrService: OcrService,
    private geminiService: GeminiService,
    private expensesCrudService: ExpensesCrudService
  ) {}

  addExpense(): void {
    console.log('aici');

    const newExpense: Expense2 = {
      name: 'Item1',
      amount: 100,
      date: new Date().toISOString(),
      category: 'Food',
      userId: '-1',
    };
    this.expensesCrudService.addExpense(newExpense).subscribe((response) => {
      console.log(response);
    });
  }

  //extracting text
  imageUrl: string | ArrayBuffer | null = null;
  extractedText: string = '';
  extractedExpenses: Expense[] = [];
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
          this.sendToGemini(this.extractedText);
        }
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }

  sendToGemini(ocrText: string) {
    this.geminiService.extractExpenses(ocrText).subscribe(async (response) => {
      try {
        const rawText = response.candidates[0].content.parts[0].text;

        // Curățăm delimitatorii de bloc de cod
        const cleanedText = rawText
          .replace(/^```json\s*/, '')
          .replace(/```$/, '');

        // Parsăm JSON-ul curățat
        this.extractedExpenses = JSON.parse(cleanedText);
        console.log(this.extractedExpenses);

        this.addExpensesFromExtractedText(this.extractedExpenses);
        await this.getDailyTotal();
        // this.ngOnInit();
        this.getExpensesByDay(this.selectedDay);
      } catch (error) {
        console.error('Eroare la parsarea răspunsului Gemini:', error);
        this.extractedExpenses = []; // Evităm afișarea de date corupte în UI
      }
    });
  }

  addExpensesFromExtractedText(expenses: Expense[]) {
    expenses.forEach((expense) => {
      this.crudService.addItem(this.selectedDay, expense);
    });
  }

  exportToExcel(): void {
    this.excelService.generateExcel(this.data, 'user_data');
  }

  ngOnInit() {
    this.trackerConfigService
      .getWeekdays()
      .subscribe((config: TrackerConfig) => {
        this.days = config.weekdays.map((day) => day.name);
        this.selectedDay = this.getCurrentAvailableDay();
        this.getExpensesByDay(this.selectedDay);
      });
    this.getDailyTotal();
  }

  toggleCategoryPopup() {
    this.showCategoryPopup = !this.showCategoryPopup;
    this.newCategory = '';
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
  }

  toggleAnalysisOverview() {
    this.showAnalysisOverview = !this.showAnalysisOverview;
    this.showExpenseForm = false;
    this.showWeeklyOverview = false;
  }

  toggleAIExpertiseOverview() {
    this.showAIExpertiseOverview = !this.showAIExpertiseOverview;
    this.showAnalysisOverview = !this.showAnalysisOverview;
  }

  getCurrentDay(): DayOfWeek {
    const today = new Date();
    const weekdays = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return weekdays[today.getDay()] as DayOfWeek;
  }

  getCurrentAvailableDay(): DayOfWeek {
    const currentDay = this.getCurrentDay() as DayOfWeek;
    return this.days.includes(currentDay)
      ? currentDay
      : (this.days[0] as DayOfWeek);
  }

  expenses = [
    { name: 'Lunch', category: 'Food', amount: 20, day: 'Monday' },
    { name: 'Taxi', category: 'Transport', amount: 15, day: 'Monday' },
    { name: 'Groceries', category: 'Shopping', amount: 30, day: 'Tuesday' },
    { name: 'Coffee', category: 'Food', amount: 5, day: 'Wednesday' },
    { name: 'Gym', category: 'Health', amount: 40, day: 'Thursday' },
  ];

  getDayExpenses(day: DayOfWeek) {
    return this.expenses.filter((expense) => expense.day === day);
  }

  async getExpensesByDay(day: DayOfWeek) {
    this.dailyExpenses = await this.crudService.getByDay(day);
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

  async saveExpense(day: DayOfWeek) {
    this._newExpense.name = this.expenseName;
    console.log(this.expenseName);
    this._newExpense.category = this.selectedCategory as Category;
    this._newExpense.amount = this.expenseAmount!;
    this.showExpenseForm = false;
    this.resetForm();
    await this.crudService.addItem(day, this._newExpense);
    await this.getDailyTotal();
    // this.ngOnInit();
    this.getExpensesByDay(this.selectedDay);
    // this.resetForm();
  }

  async deleteExpense(id: string) {
    // const confirmation = confirm(`Are you sure you want to delete?`);
    // if (confirmation) {
    //   await this.crudService.deleteItem(this.selectedDay, id);
    //   this.getExpensesByDay(this.selectedDay);
    // }
    this.confirmDialogService
      .confirm({
        message: 'Are you sure you want to delete this expense?',
      })
      .subscribe(async (confirmed) => {
        if (confirmed) {
          await this.crudService.deleteItem(this.selectedDay, id);
          await this.getDailyTotal();
          this.getExpensesByDay(this.selectedDay);
        }
      });
  }

  resetForm() {
    this.expenseName = '';
    this.selectedCategory = '';
    this.expenseAmount = null;
    this.isEditing = false;
    this.editingExpenseId = null;
  }

  editExpense(expense: Expense) {
    if (!expense) return;

    this.isEditing = true;
    this.editingExpenseId = expense.id;

    this.showExpenseForm = true;

    setTimeout(() => {
      this.expenseName = expense.name;
      this.selectedCategory = expense.category;
      this.expenseAmount = expense.amount;
    }, 0);
    this.isSaveDisabled = true;
  }

  async updateExpense() {
    if (!this.isEditing || !this.editingExpenseId) return;

    const updatedExpense: UpdateExpenseDTO = {
      name: this.expenseName,
      category: this.selectedCategory as Category,
      amount: this.expenseAmount!,
    };

    // console.log("Updated values are: Name: ", updatedExpense.name, " Amount: ", updatedExpense.amount, " Category: ", updatedExpense.category)

    await this.crudService.updateItem(
      this.selectedDay,
      this.editingExpenseId,
      updatedExpense
    );
    await this.getDailyTotal();

    this.isEditing = false;
    this.editingExpenseId = null;
    this.toggleExpenseForm();
    this.getExpensesByDay(this.selectedDay);
  }

  async getDailyTotal() {
    try {
      this.dailyTotals = await this.crudService.calculateDailyTotals();
    } catch (error) {
      console.error('Error loading daily totals:', error);
    }
  }

  getWeeklyTotal() {
    return Object.values(this.dailyTotals).reduce(
      (totalSum, dailyAmount) => totalSum + dailyAmount,
      0
    );
  }

  onDayChanged(day: DayOfWeek) {
    this.selectedDay = day;
    this.ngOnInit();
  }

  checkDay(): boolean {
    const today = new Date();
    // return this.selectedDay > this.days[today.getDay() - 1];
    return (
      this.days.indexOf(this.selectedDay) >
      this.days.indexOf(this.days[today.getDay() - 1])
    );
  }

  isFutureDay(day: DayOfWeek): boolean {
    const today = new Date();
    const dayIndex = this.days.indexOf(day);
    const todayIndex = today.getDay() - 1; // getDay() returns 0 (Sunday) to 6 (Saturday), so adjust for array indexing
    if (todayIndex < 0) {
      // Adjust for when today is Sunday (index -1 in our array)
      return dayIndex !== 0;
    }
    return dayIndex > todayIndex;
  }

  loadCategories(): void {}

  addCategory(): void {}

  deleteCategory(category: string): void {}

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

  async toggleDayExpenses(day: DayOfWeek) {
    if (this.expendedDay === day) {
      this.expendedDay = null;
      this.expendedDayExpenses = [];
    } else {
      this.expendedDay = day;
      this.expendedDayExpenses = await this.crudService.getByDay(day);
      this.cdr.detectChanges();
    }
  }
}
