import { Injectable } from '@angular/core';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private auth0: Auth0Service) {}

  login(): void {
    this.auth0.loginWithRedirect();
  }

  logout(): void {
    this.auth0.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  isLoggedIn(): Observable<boolean> {
    return this.auth0.isAuthenticated$;
  }

  user(): Observable<User | null | undefined> {
    return this.auth0.user$;
  }

  getToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently();
  }

  async getUserName(): Promise<string> {
    const user = await firstValueFrom(this.auth0.user$);

    if (!user) return 'User';

    return user.name || user.nickname || user.email || 'User';
  }
}
