import { Component, computed, inject, input, OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  BreadcrumbRouterComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownHeaderDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  SidebarToggleDirective,
  HeaderModule
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { AuthService } from '../../../auth/auth.service';


@Component({
  selector: 'app-default-header',
  imports: [ContainerComponent, HeaderTogglerDirective, SidebarToggleDirective, IconDirective, HeaderNavComponent, RouterLink,  NgTemplateOutlet, BreadcrumbRouterComponent, DropdownComponent, DropdownToggleDirective, DropdownMenuDirective, DropdownHeaderDirective, DropdownItemDirective, DropdownDividerDirective, HeaderModule],
  templateUrl: './default-header.html',
  styleUrl: './default-header.css',
})
export class DefaultHeader extends HeaderComponent implements OnInit {
  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;
  readonly auth0 = inject(AuthService);

  userName = 'User';

  readonly colorModes = [
    { name: 'light', text: 'Light', icon: 'cilSun' },
    { name: 'dark', text: 'Dark', icon: 'cilMoon' }
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  constructor() {
    super();
  }

  sidebarId = input('sidebar1');

  async ngOnInit() {
    this.userName = await this.auth0.getUserName();
  }

  logout() {
    this.auth0.logout();
  }


}
