import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-activation-sent',
  imports: [CommonModule],
  templateUrl: './activation-sent.html',
  styleUrl: './activation-sent.css'
})
export class ActivationSent implements OnInit {
  email: string | null = null;
  loading = false;
  message: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private permissions: PermissionService
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email');
  }

  onResend(): void {
    if (!this.loading) {
      this.loading = true;
      this.api.post('/SystemUser/SendActivationEmail', null).subscribe({
        next: () => { this.loading = false; this.message = 'Activation email resent.'; },
        error: (err) => { this.loading = false; this.message = err?.message || 'Failed to resend activation email.'; }
      });
    }
  }

  async onIveActivated(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.message = null;
    this.api.get('/SystemUser/MyIsFirstTime').subscribe({
      next: (data: any) => {
        if (data?.isFirstTime) {
          this.loading = false;
          this.message = 'Activation not yet completed. Please click the link in the email and try again.';
          return;
        }
        // Not first time anymore → request role and continue
        this.api.get('/SystemUser/MyRole').subscribe({
          next: (r: any) => {
            try { this.permissions.setRole(r.role); } catch { }
            this.loading = false;
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.loading = false;
            this.message = err?.message || 'Unable to load role after activation.';
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.message = err?.message || 'Error checking activation status.';
      }
    });
  }
}
