import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
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

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = new Array(7).fill(null);
    let dayCounter = 1;
    for (let i = firstDay; i < 7; i++) {
      week[i] = dayCounter++;
    }
    weeks.push(week);

    while (dayCounter <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        week[i] = dayCounter++;
      }
      weeks.push(week);
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
