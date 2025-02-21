import { defineConfigSchema, getAsyncLifecycle, getSyncLifecycle, provide } from '@openmrs/esm-framework';
import { backendDependencies } from './openmrs-backend-dependencies';
import {
  clearSidenavRegistry,
  createDashboardLink,
  hts_dashboardMeta,
  serviceEnrolment_dashboardMeta,
  serviceSummary_dashboardMeta,
  clinicalVisit_dashboardMeta,
  labResults_dashboardMeta,
  drugOrders_dashboardMeta,
} from './dashboard.meta';
import { clearCovidSidenavRegistry, createCovidDashboardLink, caseReport_dashboardMeta } from './covid/dashboard.meta';

import patientDashboardsConfig from './ohri-patient-dashboards-config.json';

const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

function setupOpenMRS() {
  const moduleName = '@openmrs/esm-ohri-app';

  const options = {
    featureName: 'ohri',
    moduleName,
  };

  defineConfigSchema(moduleName, {});

  // Load configurations
  provide(patientDashboardsConfig);

  //Clear sidenav items to avoid duplicates
  clearSidenavRegistry();
  clearCovidSidenavRegistry();

  return {
    pages: [
      {
        load: getAsyncLifecycle(() => import('./pages/hts/summary-page/hts-summary-page'), options),
        route: /^ohri\/.+\/hts/,
      },
      {
        load: getAsyncLifecycle(() => import('./root'), options),
        route: /^ohri-home/,
      },
      {
        load: getAsyncLifecycle(() => import('./root'), options),
        route: /^ohri-ct-home/,
      },
      {
        load: getAsyncLifecycle(() => import('./root'), options),
        route: /^form-render-test/,
      },
    ],
    extensions: [
      {
        id: 'hts-patient-encounters-list-ext',
        slot: 'hts-summary-dashboard-slot',
        load: getAsyncLifecycle(() => import('./pages/hts/encounters-list/hts-overview-list.component'), {
          featureName: 'hts-patient-encounters-list',
          moduleName,
        }),
        meta: {
          columnSpan: 4,
        },
      },
      {
        id: 'hts-clinical-visit-list-ext',
        slot: 'hts-clinical-visit-dashboard-slot',
        load: getAsyncLifecycle(
          () => import('./pages/clinical-visit/encounter-list/clinical-visit-encounter-list.component'),
          {
            featureName: 'hts-clinical-visit-list',
            moduleName,
          },
        ),
        order: 5,
        meta: {
          columnSpan: 4,
        },
      },
      ,
      {
        id: 'hts-service-summary-list-ext',
        slot: 'hts-service-summary-dashboard-slot',
        load: getAsyncLifecycle(
          () => import('./pages/service-summary/encounter-list/service-summary-encounter-list.component'),
          {
            featureName: 'hts-service-summary-list',
            moduleName,
          },
        ),
      },
      {
        id: 'hts-service-enrolment-list-ext',
        slot: 'hts-service-enrolment-dashboard-slot',
        load: getAsyncLifecycle(
          () => import('./pages/service-enrolment/encounter-list/service-enrolment-encounter-list.component'),
          {
            featureName: 'hts-service-enrolment-list',
            moduleName,
          },
        ),
        order: 5,
        meta: {
          columnSpan: 4,
        },
      },
      {
        id: 'hts-lab-results-list-ext',
        slot: 'hts-lab-results-dashboard-slot',
        load: getAsyncLifecycle(
          () => import('./pages/lab-results/encounter-list/lab-results-encounter-list.component'),
          {
            featureName: 'hts-lab-results-list',
            moduleName,
          },
        ),
        order: 6,
        meta: {
          columnSpan: 4,
        },
      },
      {
        id: 'hts-cd4-list-ext',
        slot: 'hts-lab-results-dashboard-slot',
        load: getAsyncLifecycle(() => import('./pages/lab-results/cd4/cd4-encounter-list.component'), {
          featureName: 'hts-lab-results-list',
          moduleName,
        }),
        order: 7,
        meta: {
          columnSpan: 4,
        },
      },
      {
        id: 'hts-drug-orders-list-ext',
        slot: 'hts-drug-orders-dashboard-slot',
        load: getAsyncLifecycle(
          () => import('./pages/drug-orders/encounter-list/drug-orders-encounter-list.component'),
          {
            featureName: 'hts-drug-orders-list',
            moduleName,
          },
        ),
        order: 5,
        meta: {
          columnSpan: 4,
        },
      },
      {
        id: 'hts-home-header-ext',
        slot: 'hts-home-header-slot',
        load: getAsyncLifecycle(() => import('./pages/hts/home/welcome-section/hts-welcome-section.component'), {
          featureName: 'hts-home-header',
          moduleName,
        }),
      },
      {
        id: 'hts-home-tile-ext',
        slot: 'hts-home-tiles-slot',
        load: getAsyncLifecycle(() => import('./pages/hts/home/summary-tiles/hts-summary-tiles.component'), {
          featureName: 'hts-home-tiles',
          moduleName,
        }),
      },
      {
        id: 'hts-home-tabs-ext',
        slot: 'hts-home-tabs-slot',
        load: getAsyncLifecycle(() => import('./pages/hts/home/patient-tabs/ohri-patient-tabs.component'), {
          featureName: 'hts-home-tabs',
          moduleName,
        }),
      },
      {
        id: 'ct-home-header-ext',
        slot: 'ct-home-header-slot',
        load: getAsyncLifecycle(() => import('./ohri-home/welcome-section/ohri-welcome-section.component'), {
          featureName: 'ct-home-header',
          moduleName,
        }),
      },
      {
        id: 'ct-home-tile-ext',
        slot: 'ct-home-tiles-slot',
        load: getAsyncLifecycle(
          () => import('./hts/care-and-treatment/home/summary-tiles/ct-summary-tiles.component'),
          {
            featureName: 'ct-home-tiles',
            moduleName,
          },
        ),
      },
      {
        id: 'ct-home-tabs-ext',
        slot: 'ct-home-tabs-slot',
        load: getAsyncLifecycle(
          () => import('./hts/care-and-treatment/home/patient-list-tabs/ct-patient-list-tabs.component'),
          {
            featureName: 'ct-home-tabs',
            moduleName,
          },
        ),
      },
      {
        id: 'hts-encounter-form-ext',
        load: getAsyncLifecycle(() => import('./pages/hts/encounter-form/hts-encounter-form.component'), {
          featureName: 'hts-encounter-form',
          moduleName,
        }),
      },
      {
        id: 'ohri-forms-view-ext',
        load: getAsyncLifecycle(() => import('./pages/hts/encounters-list/ohri-form-view.component'), {
          featureName: 'ohri-forms',
          moduleName,
        }),
      },
      {
        id: 'patient-hiv-status-tag',
        slot: 'patient-banner-tags-slot',
        load: getAsyncLifecycle(() => import('./components/banner-tags/patient-status-tag.component'), options),
        online: true,
        offline: true,
      },
      {
        id: 'patient-list-ext',
        slot: 'homepage-dashboard-slot',
        load: getAsyncLifecycle(() => import('./pages/hts/patient-list/patient-list.component'), {
          featureName: 'patient-list',
          moduleName,
        }),
        meta: {
          columnSpan: 4,
        },
      },
      {
        id: 'patient-list-modal',
        slot: 'patient-actions-slot',
        load: getAsyncLifecycle(() => import('./components/modals/patient-list/add-patient-to-list-modal.component'), {
          featureName: 'patient-list-modal',
          moduleName,
        }),
      },
      {
        id: 'hiv-hts-programme-switcher',
        slot: 'top-nav-info-slot',
        load: getAsyncLifecycle(
          () => import('./components/programme-switcher/ohri-programme-switcher.component'),
          options,
        ),
        online: true,
        offline: true,
      },
      {
        id: 'hts-service-summary-dashboard',
        slot: 'patient-chart-dashboard-slot',
        load: getSyncLifecycle(createDashboardLink(serviceSummary_dashboardMeta), options),
        meta: serviceSummary_dashboardMeta,
        online: true,
        offline: true,
      },
      {
        id: 'hts-summary-dashboard',
        slot: 'patient-chart-dashboard-slot',
        load: getSyncLifecycle(createDashboardLink(hts_dashboardMeta), options),
        meta: hts_dashboardMeta,
        online: true,
        offline: true,
      },
      {
        id: 'service-enrolment-summary-dashboard',
        slot: 'patient-chart-dashboard-slot',
        load: getSyncLifecycle(createDashboardLink(serviceEnrolment_dashboardMeta), options),
        meta: serviceEnrolment_dashboardMeta,
        order: 6,
        online: true,
        offline: true,
      },
      {
        id: 'clinical-visit-summary-dashboard',
        slot: 'patient-chart-dashboard-slot',
        load: getSyncLifecycle(createDashboardLink(clinicalVisit_dashboardMeta), options),
        meta: clinicalVisit_dashboardMeta,
        online: true,
        offline: true,
      },
      {
        id: 'lab-results-summary-dashboard',
        slot: 'patient-chart-dashboard-slot',
        load: getSyncLifecycle(createDashboardLink(labResults_dashboardMeta), options),
        meta: labResults_dashboardMeta,
        online: true,
        offline: true,
      },
      {
        id: 'drug-orders-summary-dashboard',
        slot: 'patient-chart-dashboard-slot',
        load: getSyncLifecycle(createDashboardLink(drugOrders_dashboardMeta), options),
        meta: drugOrders_dashboardMeta,
        online: true,
        offline: true,
      },
    ],
  };
}

export { backendDependencies, importTranslation, setupOpenMRS };
