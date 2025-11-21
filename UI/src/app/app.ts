import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { delay, filter, map, tap } from 'rxjs/operators';

import { ColorModeService } from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from './icons/icons';

import { AuthService } from '@auth0/auth0-angular';
import { ApiService } from './services/api.service';
import { PermissionService } from './services/permission.service';

@Component({
  selector: 'app-root',
  imports:[RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {
  title = 'Port Management System';

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #titleService = inject(Title);

  readonly #colorModeService = inject(ColorModeService);
  readonly #iconSetService = inject(IconSetService);

  readonly #auth = inject(AuthService);
  readonly #api = inject(ApiService);
  readonly #permissions = inject(PermissionService);

  private roleLoading = false;

  constructor() {
    this.#titleService.setTitle(this.title);
    this.#iconSetService.icons = { ...iconSubset };
    this.#colorModeService.localStorageItemName.set('compinchas-color-mode');
    this.#colorModeService.eventName.set('ColorSchemeChange');
  }

  ngOnInit(): void {

    this.#auth.getAccessTokenSilently().subscribe(t => {
      console.log("ACCESS TOKEN:", JSON.parse(atob(t.split('.')[1])));
    });

    this.#permissions.loadRoleFromStorage();

    this.#auth.isAuthenticated$
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(isAuth => {
        if (isAuth) {
          const savedRole = this.#permissions.getRole();

          if (!savedRole && !this.roleLoading) {
            this.roleLoading = true;
            this.loadRole();
          }
        } else {
          this.#permissions.clearRole();
        }

        console.log("User authenticated?", isAuth, "Role:", this.#permissions.getRole());
      });

  }

  private loadRole() {
    this.#api.get('/SystemUser/MyRole').subscribe({
      next: (data: any) => {
        this.#permissions.setRole(data.role);
        this.roleLoading = false;

        console.log("Role loaded:", data.role);
        // window.location.reload();
      },
      error: () => {
        this.roleLoading = false;
        alert("Your account does not have permissions to access this system.");
        this.#auth.logout();
      }
    });
  }
}
