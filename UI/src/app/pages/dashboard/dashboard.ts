import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // Calendar state
  current: Date = new Date();
  month!: number;
  year!: number;
  weeks: (number | null)[][] = [];

  constructor(private router: Router) {
    this.month = this.current.getMonth();
    this.year = this.current.getFullYear();
    this.buildCalendar(this.year, this.month);
  }

  goToVisualization(): void {
    this.router.navigate(['v']);
  }

  private buildCalendar(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: (number | null)[] = [];

    // Dias do mês anterior (em cinza)
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(prevMonthDays - i);
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }

    // Preencher até 42 células (6 semanas) com dias do próximo mês
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      cells.push(day);
    }

    // Dividir em semanas de 7 dias
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < 6; i++) {
      weeks.push(cells.slice(i * 7, (i + 1) * 7));
    }

    this.weeks = weeks;
  }

  prevMonth() {
    if (this.month === 0) {
      this.month = 11;
      this.year--;
    } else {
      this.month--;
    }
    this.buildCalendar(this.year, this.month);
  }

  nextMonth() {
    if (this.month === 11) {
      this.month = 0;
      this.year++;
    } else {
      this.month++;
    }
    this.buildCalendar(this.year, this.month);
  }

  monthName(): string {
    return new Date(this.year, this.month).toLocaleString(undefined, { month: 'long' });
  }
}
