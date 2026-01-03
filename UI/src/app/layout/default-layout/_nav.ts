import { INavData } from '@coreui/angular';
import { IExtendedNavData } from './extended-nav-data';

export const navItems: IExtendedNavData[] = [
  {
    name: 'NAV.DASHBOARD',
    url: '/dashboard',
    icon: 'nav-img nav-img-dashboard',
    roles: ['Admin','LogisticOperator', 'PortAuthorityOfficer', 'Representative']
  },
  {
    title: true,
    name: 'NAV.FEATURES',
  },
  {
    name: 'NAV.VESSEL',
    url: '/vessel',
    icon: 'nav-img nav-img-vessel',
    roles: ['Admin','PortAuthorityOfficer'],
    children: [
    {
      name: 'NAV.VESSEL_TYPE',
      url: '/vesselType',
      icon: 'nav-img nav-img-vessel',
      roles: ['Admin','PortAuthorityOfficer']
    },
    {
      name: 'NAV.VESSEL_RECORD',
      url: '/vessel',
      icon: 'nav-img nav-img-vessel',
      roles: ['Admin','PortAuthorityOfficer']
    }
    ]
  },
  {
    name: 'NAV.DOCKS',
    url: '/docks',
    icon: 'nav-img nav-img-dock',
    roles: ['Admin','PortAuthorityOfficer']
  },
  {
    name: 'NAV.STORAGE_AREA',
    icon: 'nav-img nav-img-storage',
    url: '/storageArea',
    roles: ['Admin','PortAuthorityOfficer']
  },
  {
    name: 'NAV.VVN',
    url: '/vvn',
    icon: 'nav-img nav-img-vvn',
    roles: ['Admin','PortAuthorityOfficer', 'Representative'],
    children: [
      {
        name: 'NAV.VVN_CREATE',
        url: '/vvncreate',
        icon: 'nav-img nav-img-vvn',
        roles: ['Admin', 'Representative']
      },
      {
        name: 'NAV.VVN_DECISION',
        url: '/vvndecision',
        icon: 'nav-img nav-img-vvn',
        roles: ['Admin', 'PortAuthorityOfficer']
      }
    ]
  },
  {
    name: 'NAV.STAFF',
    url: '/staff',
    icon: 'nav-img nav-img-staff',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name:'NAV.PHYSICAL_RESOURCES',
    url: '/physicalResources',
    icon: 'nav-img nav-img-physicalResource',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'NAV.QUALIFICATION',
    url: '/qualification',
    icon: 'nav-img nav-img-qualification',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'NAV.SHIPPING_AGENT',
    url: '/shippin-agent',
    icon: 'nav-img nav-img-shippingAgent',
    roles: ['Admin', 'PortAuthorityOfficer'],
    children: [
      {
        name: 'NAV.ORGANIZATION',
        url: '/organization',
        icon: 'nav-img nav-img-organization',
        roles: ['Admin', 'PortAuthorityOfficer']
      },
      {
        name: 'NAV.REPRESENTATIVE',
        url: '/representative',
        icon: 'nav-img nav-img-representative',
        roles: ['Admin', 'PortAuthorityOfficer']
      }
    ]
  },
  {
    name: 'NAV.SCHEDULE',
    url: '/schedule',
    icon: 'nav-img nav-img-schedule',
    roles: ['Admin', 'PortAuthorityOfficer', 'LogisticOperator'],
    children: [
      {
        name: 'NAV.SCHEDULE',
        url: '/schedule',
        icon: 'nav-img nav-img-schedule',
        roles: ['Admin', 'LogisticOperator']
      },
      {
        name: 'NAV.REBALANCING',
        url: '/rebalancing',
        icon: 'nav-img nav-img-rebalancing',
        roles: ['Admin', 'PortAuthorityOfficer']
    }
    ]
  },
  {
    name: 'NAV.INCIDENT',
    url: '/incident',
    icon: 'nav-img nav-img-incident-type',
    roles: ['Admin', 'PortAuthorityOfficer', 'LogisticOperator'],
    children: [
      {
        name: 'NAV.INCIDENT',
        url: '/incident',
        icon: 'nav-img nav-img-incident-type',
        roles: ['Admin', 'LogisticOperator']
      },
      {
        name: 'NAV.INCIDENT_TYPE',
        url: '/incident-type',
        icon: 'nav-img nav-img-incident-type',
        roles: ['Admin', 'PortAuthorityOfficer']
      }
    ]
  },
  {
    name: 'NAV.COMPLEMENTARY_TASK',
    url: '/complementary-task',
    icon: 'nav-img nav-img-complementary-task',
    roles: ['Admin', 'PortAuthorityOfficer', 'LogisticOperator'],
    children: [
      {
        name: 'NAV.COMPLEMENTARY_TASK',
        url: '/complementary-task',
        icon: 'nav-img nav-img-complementary-task',
        roles: ['Admin', 'LogisticOperator', 'PortAuthorityOfficer']
      },
      {
        name: 'NAV.COMPLEMENTARY_TASK_CATEGORY',
        url: '/complementary-task-category',
        icon: 'nav-img nav-img-complementary-task',
        roles: ['Admin', 'PortAuthorityOfficer']
      }
    ]
  },
  {
    name: 'NAV.OPERATION_PLANS',
    url: '/operationPlan',
    icon: 'nav-img nav-img-operation-plan',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'NAV.VESSEL_VISIT_EXECUTION',
    url: '/vessel-visit-execution',
    icon: 'nav-img nav-img-vessel-visit-execution',
    roles: ['Admin', 'LogisticOperator']
  },
  {
    name: 'NAV.SYSTEM_USER',
    url: '/user',
    icon: 'nav-img nav-img-systemuser',
    roles: ['Admin']
  },
  {
    name: 'NAV.PRIVACY_POLICY',
    url: '/privacy-policy/admin',
    icon: 'nav-img nav-img-privacy-policy',
    roles: ['Admin']
  }
];
