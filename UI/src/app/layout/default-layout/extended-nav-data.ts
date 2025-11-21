import { INavData } from '@coreui/angular';

export interface IExtendedNavData extends INavData {
  roles?: string[];
  children?: IExtendedNavData[];
}
