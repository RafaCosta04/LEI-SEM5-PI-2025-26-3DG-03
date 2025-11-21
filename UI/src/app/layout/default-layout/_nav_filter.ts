import { IExtendedNavData } from './extended-nav-data';
import { PermissionService } from '../../services/permission.service';

export function filterNavItems(
  items: IExtendedNavData[],
  permissions: PermissionService
): IExtendedNavData[] {

  const role = permissions.getRole();

  return items
    .filter(item => {
      if (item.roles && role) {
        return item.roles.includes(role);
      }
      return true;
    })
    .map(item => ({
      ...item,
      children: item.children ? filterNavItems(item.children, permissions) : undefined
    }));
}
