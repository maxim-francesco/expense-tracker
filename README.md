# ExpenseTracker

Deployed at: [Vercel App](https://expense-tracker-ntt.vercel.app)

### Overview

The Expense Tracker is an internal Angular application developed as part of the NTT DATA Tech Trek initiative. This tool streamlines the expense reporting process for NTT DATA employees, allowing for efficient submission, tracking, and management of business expenses.

### Features

* **Quick Expense Entry** : Submit expenses on-the-go with an intuitive interface
* **Receipt Management** : Upload, store, and organize digital receipts (coming in V3)
* **Expense Categories** : Categorize expenses for better financial visibility
* **Approval Workflow** : Streamlined approval process with notifications (coming in V3)
* **Reporting** : Generate detailed expense reports across various time periods (coming in V2)
* **Export Options** : Download reports in multiple formats (PDF, CSV, Excel) (coming in V2)

## Getting Started

### Prerequisites

* Node.js (v16.0 or higher)
* Angular CLI (v14.0 or higher)
* npm (v8.0 or higher)

### Instalation

#### Clone the repository:

```bash
git clone https://github.com/andricolae/expense-tracker.git
```

#### Navigate to the project directory:

```bash
cd expense-tracker
```

#### Install dependencies:

```bash
npm install
```

#### Set up environment variables:

```bash
cp .env.example .env
```
Then edit the .env file with appropriate values for your environment.

#### Start the development server:

```bash
ng serve
```

Open your browser and navigate to http://localhost:4200

## Architecture

##### The application follows a modular architecture with:

Core modules for authentication, data services, and HTTP interceptors
Feature modules for expenses, reports, approvals, and user settings
Shared modules for common components and directives
State management using NgRx for predictable data flow

#### Tech Stack

Frontend: Angular 14, TypeScript, RxJS
UI Components: Angular Material
Authentication: Firebase Auth
CI/CD: Github and Vercel

## Team
The Expense Tracker was developed by the following Tech Trek Angular team at NTT DATA 
| Name | Role |
| --- | --- |
| Anna Marita Thuri | Visual Experience Architect |
| Antonia Gabriela Albu | Visual Experience Architect |
| Francesco Maxim | Receipt Whisperer |
| Robert Gengiu | Access Maestro |
| Tudor Ovidiu Atodiresei | Authentication Guardian |
| Andrei Nicolae Calutiu | Expense Engineer |

### Contributing

As this is an internal Tech Trek project, contributions are welcome from all NTT DATA employees. 
Please follow these steps:

1. Check the issue tracker for open tasks
2. Request to be assigned to an issue
3. Create a feature branch from develop
4. Submit a merge request with your changes
5. Ensure CI/CD pipeline passes
6. Request a code review from the team

## License
This project is proprietary and confidential. The code and its assets are the exclusive property of NTT DATA. Unauthorized use, reproduction, or distribution is prohibited.
