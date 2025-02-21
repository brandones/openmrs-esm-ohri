import React, { useState } from 'react';
import { ExtensionSlot } from '@openmrs/esm-framework';
import { Grid } from 'carbon-components-react';
import PatientListWorkspace from '../workspace/patient-list-workspace';
import styles from './ohri-home.scss';
import { hts_dashboardMeta } from '../dashboard.meta';

interface HomeProps {
  programme: string;
  dashboardTitle: string;
}

function OHRIHome(HomeProps) {
  const [isWorkSpaceVisible, setIsWorkSpaceVisible] = useState(false);
  const [workSpaceProps, setWorkSpaceProps] = useState<{
    header: string;
    children: Element;
    meta: { numberOfClients: number; subTitle: string; dateLastUpdated: string };
  } | null>(null);

  const launchWorkSpace = (
    header: string,
    children: Element,
    meta: { numberOfClients: number; subTitle: string; dateLastUpdated: string },
  ) => {
    setIsWorkSpaceVisible(true);
    setWorkSpaceProps({ header: header, children: children, meta: meta });
  };

  return (
    <>
      <PatientListWorkspace
        isVisible={isWorkSpaceVisible}
        header={workSpaceProps?.header}
        children={workSpaceProps?.children}
        onClose={() => setIsWorkSpaceVisible(false)}
        meta={workSpaceProps?.meta}
      />
      <Grid className={styles.mainWrapper}>
        <ExtensionSlot
          extensionSlotName={getSlotName(HomeProps.programme, OHRIHomeHeaderSlot)}
          state={{ title: HomeProps.dashboardTitle }}
        />
        <ExtensionSlot
          extensionSlotName={getSlotName(HomeProps.programme, OHRIHomeTileSlot)}
          state={{ launchWorkSpace }}
        />
        <ExtensionSlot
          extensionSlotName={getSlotName(HomeProps.programme, OHRIHomeTabSlot)}
          state={{ launchWorkSpace }}
        />
      </Grid>
    </>
  );
}

function getSlotName(programme: string, slotBaseName: string) {
  return programme + '-' + slotBaseName;
}

export default OHRIHome;
export const OHRIHomeHeaderSlot = 'home-header-slot';
export const OHRIHomeTileSlot = 'home-tiles-slot';
export const OHRIHomeTabSlot = 'home-tabs-slot';
