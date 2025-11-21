import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { PermissionService } from '../../services/permission.service';
import { filterNavItems } from './_nav_filter';
import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective
} from '@coreui/angular';
import {DefaultFooter, DefaultHeader} from './'
import { navItems } from './_nav';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-default-layout',
  templateUrl: './default-layout.html',
  styleUrls: ['./default-layout.scss'],
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    DefaultFooter,
    DefaultHeader,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective
  ]
})
export class DefaultLayout {
  public filteredNav: any[] = [];

  constructor(private permissions: PermissionService) {}

  ngOnInit(): void {
    this.permissions.loadRoleFromStorage().then(() => {
      this.filteredNav = filterNavItems(navItems, this.permissions);
      this.permissions.roleChanges().subscribe(() => {
        this.filteredNav = filterNavItems(navItems, this.permissions);
      });
    });
  }
}
