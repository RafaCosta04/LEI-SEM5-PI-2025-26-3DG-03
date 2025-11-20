import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const isLogged = await firstValueFrom(auth.isLoggedIn());

  if (isLogged) return true;

  auth.login();
  return false;
};
