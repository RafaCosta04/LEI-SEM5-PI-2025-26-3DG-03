import { INavData } from '@coreui/angular';
import { IExtendedNavData } from './extended-nav-data';

export const navItems: IExtendedNavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    icon: 'nav-img nav-img-dashboard',
    roles: ['Admin','LogisticOperator', 'PortAuthorityOfficer', 'Representative']
  },
  {
    title: true,
    name: 'Features'
  },
  {
    name: 'Vessel',
    url: '/vessel',
    icon: 'nav-img nav-img-vessel',
    roles: ['Admin','PortAuthorityOfficer'],
    children: [
    {
      name: 'Vessel Type',
      url: '/vesselType',
      icon: 'nav-img nav-img-vessel',
      roles: ['Admin','PortAuthorityOfficer']
    },
    {
      name: 'Vessel Records',
      url: '/vessel',
      icon: 'nav-img nav-img-vessel',
      roles: ['Admin','PortAuthorityOfficer']
    }
    ]
  },
  {
    name: 'Docks',
    url: '/docks',
    icon: 'nav-img nav-img-dock',
    roles: ['Admin','PortAuthorityOfficer']
  },
  {
    name: 'Storage Area',
    icon: 'nav-img nav-img-storage',
    url: '/storageArea',
    roles: ['Admin','PortAuthorityOfficer']
  },
  {
    name: 'Visit Notification',
    url: '/vvn',
    icon: 'nav-img nav-img-vvn',
    roles: ['Admin','PortAuthorityOfficer', 'Representative'],
    children: [
      {
        name: 'Notification Create/Edit',
        url: '/vvncreate',
        icon: 'nav-img nav-img-vvn',
        roles: ['Admin', 'Representative']
      },
      {
        name: 'Notification Decision',
        url: '/vvndecision',
        icon: 'nav-img nav-img-vvn',
        roles: ['Admin', 'PortAuthorityOfficer']
      }
    ]
  },
  {
    name: 'Staff',
    url: '/staff',
    icon: 'nav-img nav-img-staff',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name:'Physical Resources',
    url: '/physicalResources',
    icon: 'nav-img nav-img-physicalResource',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'Qualification',
    url: '/qualification',
    icon: 'nav-img nav-img-qualification',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'Shipping Agent',
    url: '/shippin-agent',
    icon: 'nav-img nav-img-shippingAgent',
    roles: ['Admin', 'PortAuthorityOfficer'],
    children: [
      {
        name: 'Organization',
        url: '/organization',
        icon: 'nav-img nav-img-organization',
        roles: ['Admin', 'PortAuthorityOfficer']
      },
      {
        name: 'Representative',
        url: '/representative',
        icon: 'nav-img nav-img-representative',
        roles: ['Admin', 'PortAuthorityOfficer']
      }
    ]
  },
  {
    name: 'Schedule',
    url: '/schedule',
    icon: 'nav-img nav-img-schedule',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'System Users',
    url: '/user',
    icon: 'nav-img nav-img-systemUser',
    roles: ['Admin']
  }
];
