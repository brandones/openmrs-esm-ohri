import React, { useEffect, useState } from 'react';
import styles from './_form.scss';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { OHRIFormContext } from './ohri-form-context';
import { openmrsObservableFetch, useCurrentPatient, useSessionUser, showToast } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { getHandler } from './registry/registry';
import { saveEncounter } from './ohri-form.resource';
import { PatientBanner } from '../components/patient-banner/patient-banner.component';
import LoadingIcon from '../components/loading/loading.component';
import { OHRIFormSchema, OHRIFormField, SessionMode } from './types';
import OHRIFormSidebar from './components/sidebar/ohri-form-sidebar.component';
import OHRIFormPage from './components/page/ohri-form-page';
import { ConceptFalse, ConceptTrue, HTSEncounterType } from './constants';
import { isEmpty as isValueEmpty, OHRIFieldValidator } from './ohri-form-validator';
import { encounterRepresentation } from '../constants';

interface OHRIFormProps {
  formJson: OHRIFormSchema;
  onSubmit?: any;
  onCancel?: any;
  encounterUuid?: string;
  mode?: SessionMode;
  handleClose?: any;
  patientUUID?: string;
}

const OHRIForm: React.FC<OHRIFormProps> = ({
  formJson,
  encounterUuid,
  mode,
  onSubmit,
  onCancel,
  handleClose,
  patientUUID,
}) => {
  const [fields, setFields] = useState<Array<OHRIFormField>>([]);
  const [currentProvider, setCurrentProvider] = useState(null);
  const [location, setEncounterLocation] = useState(null);
  const [, patient] = useCurrentPatient(patientUUID);
  const session = useSessionUser();
  const [initialValues, setInitialValues] = useState({});
  const encDate = new Date();
  const [encounter, setEncounter] = useState(null);
  const [form, setForm] = useState<OHRIFormSchema>(null);
  const [scrollAblePages, setScrollAblePages] = useState(undefined);
  const [selectedPage, setSelectedPage] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const form = JSON.parse(JSON.stringify(formJson));
    const allFormFields: Array<OHRIFormField> = [];
    const tempInitVals = {};
    form.pages.forEach(page => page.sections.forEach(section => allFormFields.push(...section.questions)));
    // set Formik initial values
    if (encounter) {
      allFormFields.forEach(field => {
        const existingVal = getHandler(field.type)?.getInitialValue(encounter, field);
        tempInitVals[field.id] = existingVal === null || existingVal === undefined ? '' : existingVal;
        if (field.unspecified) {
          tempInitVals[`${field.id}-unspecified`] = !!!existingVal;
        }
      });
      setEncounterLocation(encounter.location);
    } else {
      allFormFields.forEach(field => {
        if (field.questionOptions.rendering == 'checkbox') {
          tempInitVals[field.id] = [];
        } else {
          tempInitVals[field.id] = '';
        }
        if (field.unspecified) {
          tempInitVals[`${field.id}-unspecified`] = false;
        }
      });
    }
    // prepare fields
    setFields(
      allFormFields.map(field => {
        if (field.hide) {
          evaluateHideExpression(field, null, allFormFields, tempInitVals);
        } else {
          field.isHidden = false;
        }
        return field;
      }),
    );
    form.pages.forEach(page => {
      if (page.hide) {
        evaluateHideExpression(null, null, allFormFields, null, page, null);
      } else {
        page.isHidden = false;
      }
    });
    setForm(form);
    setInitialValues(tempInitVals);
    setScrollAblePages(form?.pages);
  }, [encounter]);

  useEffect(() => {
    if (session) {
      if (!encounterUuid) {
        setEncounterLocation(session.sessionLocation);
      }
      setCurrentProvider(session.currentProvider.uuid);
    }
  }, [session]);

  useEffect(() => {
    let subscription;
    if (encounterUuid) {
      subscription = openmrsObservableFetch(
        `/ws/rest/v1/encounter/${encounterUuid}?v=${encounterRepresentation}`,
      ).subscribe(response => {
        setEncounter(response.data);
      });
    }
    return () => subscription?.unsubscribe();
  }, [encounterUuid]);

  const evaluateHideExpression = (
    field,
    determinantValue = undefined,
    allFields,
    initialVals?: Record<string, any>,
    page?,
    section?,
  ) => {
    let hideExpression =
      field?.hide?.hideWhenExpression || page?.hide?.hideWhenExpression || section?.hide?.hideWhenExpression;
    const allFieldsKeys = allFields.map(f => f.id);
    const parts = hideExpression.trim().split(' ');
    function isEmpty(value) {
      if (allFieldsKeys.includes(value)) {
        return initialVals ? isValueEmpty(initialVals[value]) : isValueEmpty(initialValues[value]);
      }
      return isValueEmpty(value);
    }
    parts.forEach((part, index) => {
      if (index % 2 == 0) {
        if (allFieldsKeys.includes(part)) {
          const determinant = allFields.find(field => field.id === part);
          if (field) {
            if (!determinant.fieldDependants) {
              determinant.fieldDependants = new Set();
            }
            determinant.fieldDependants.add(field.id);
          }
          if (page) {
            if (!determinant.pageDependants) {
              determinant.pageDependants = new Set();
            }
            determinant.pageDependants.add(page.label);
          }
          if (section) {
            if (!determinant.sectionDependants) {
              determinant.sectionDependants = new Set();
            }
            determinant.sectionDependants.add(section.label);
          }
          // prep eval variables
          if (determinantValue == undefined) {
            determinantValue = initialVals ? initialVals[part] || null : initialValues[part] || null;
            if (determinant.questionOptions.rendering == 'toggle') {
              determinantValue = determinantValue ? ConceptTrue : ConceptFalse;
            }
          }
          if (determinantValue && typeof determinantValue == 'string') {
            determinantValue = `'${determinantValue}'`;
          }
          const regx = new RegExp(part, 'g');
          hideExpression = hideExpression.replace(regx, determinantValue);
        }
      }
    });
    const isHidden = eval(hideExpression);
    if (field) {
      field.isHidden = isHidden;
    }
    if (page) {
      page.isHidden = isHidden;
    }
    if (section) {
      section.isHidden = isHidden;
    }
  };

  const handleFormSubmit = (values: Record<string, any>) => {
    const obsForSubmission = [];
    let formHasErrors = false;
    // handle field validation
    fields
      .filter(field => !field.disabled || !field.isHidden)
      .filter(field => field['submission']?.unspecified != true)
      .forEach(field => {
        const errors = OHRIFieldValidator.validate(field, values[field.id]);
        if (errors.length) {
          field['submission'] = {
            ...field['submission'],
            errors: errors,
          };
          formHasErrors = true;
          return;
        }
      });
    if (formHasErrors) {
      return;
    }
    // collect observations
    fields
      .filter(field => !field.isHidden && field.type == 'obs' && field.value)
      .forEach(field => {
        if (Array.isArray(field.value)) {
          obsForSubmission.push(...field.value);
        } else {
          obsForSubmission.push(field.value);
        }
      });

    let encounterForSubmission = {};
    if (encounter) {
      Object.assign(encounterForSubmission, encounter);
      encounterForSubmission['location'] = location.uuid;
      // update encounter providers
      const hasCurrentProvider =
        encounterForSubmission['encounterProviders'].findIndex(
          encProvider => encProvider.provider.uuid == currentProvider,
        ) !== -1;
      if (!hasCurrentProvider) {
        encounterForSubmission['encounterProviders'] = [
          ...encounterForSubmission['encounterProviders'],
          {
            provider: currentProvider,
            encounterRole: '240b26f9-dd88-4172-823d-4a8bfeb7841f',
          },
        ];
      }
      encounterForSubmission['obs'] = obsForSubmission;
    } else {
      encounterForSubmission = {
        patient: patient.id,
        encounterDatetime: encDate,
        location: location.uuid,
        encounterType: formJson.encounterType || HTSEncounterType,
        encounterProviders: [
          {
            provider: currentProvider,
            encounterRole: '240b26f9-dd88-4172-823d-4a8bfeb7841f',
          },
        ],
        obs: obsForSubmission,
      };
    }
    const ac = new AbortController();
    saveEncounter(ac, encounterForSubmission, encounterUuid).then(response => {
      if (response.ok) {
        if (onSubmit) {
          onSubmit();
        }
        if (encounterUuid) {
          showToast({
            description: t('updateSuccessToastDescription', 'The patient HTS record was updated'),
            title: t('updateSuccessToastTitle', 'HTS record updated'),
            kind: 'success',
            critical: true,
          });
        } else {
          showToast({
            description: t('createSuccessToastDescription', 'A new HTS record was created'),
            title: t('createSuccessToastTitle', 'HTS record created'),
            kind: 'success',
            critical: true,
          });
        }
        if (handleClose) {
          handleClose();
        }
      }
    });
  };

  const onFieldChange = (fieldName: string, value: any) => {
    const field = fields.find(field => field.id == fieldName);
    if (field.questionOptions.rendering == 'toggle') {
      value = value ? ConceptTrue : ConceptFalse;
    }
    if (field.fieldDependants) {
      field.fieldDependants.forEach(dep => {
        const dependant = fields.find(f => f.id == dep);
        evaluateHideExpression(dependant, value, fields);
        let fields_temp = [...fields];
        const index = fields_temp.findIndex(f => f.id == dep);
        fields_temp[index] = dependant;
        setFields(fields_temp);
      });
    }
    if (field.pageDependants) {
      field.pageDependants?.forEach(dep => {
        const dependant = form.pages.find(f => f.label == dep);
        evaluateHideExpression(null, value, fields, null, dependant, null);
        let form_temp = form;
        const index = form_temp.pages.findIndex(page => page.label == dep);
        form_temp[index] = dependant;
        setForm(form_temp);
      });
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={Yup.object({})}
      onSubmit={(values, { setSubmitting }) => {
        handleFormSubmit(values);
        setSubmitting(false);
      }}>
      {props => (
        <Form style={{ height: '100%' }}>
          {!patient ? (
            <LoadingIcon />
          ) : (
            <>
              <div className={styles.mainContainer}>
                <div className={styles.sidebar}>
                  <OHRIFormSidebar
                    scrollAblePages={scrollAblePages}
                    selectedPage={selectedPage}
                    mode={mode}
                    onCancel={onCancel}
                    handleClose={handleClose}
                    values={props.values}
                    setValues={props.setValues}
                    allowUnspecifiedAll={formJson.allowUnspecifiedAll}
                    defaultPage={formJson.defaultPage}
                  />
                </div>
                <div className={styles.overflowContent}>
                  <OHRIFormContext.Provider
                    value={{
                      values: props.values,
                      setFieldValue: props.setFieldValue,
                      setEncounterLocation: setEncounterLocation,
                      fields: fields,
                      encounterContext: {
                        patient: patient,
                        encounter: encounter,
                        location: location,
                        sessionMode: mode || (encounterUuid ? 'edit' : 'enter'),
                        date: encDate,
                      },
                    }}>
                    {form.pages.map((page, index) => {
                      return (
                        !page.isHidden && (
                          <OHRIFormPage page={page} onFieldChange={onFieldChange} setSelectedPage={setSelectedPage} />
                        )
                      );
                    })}
                  </OHRIFormContext.Provider>
                </div>
              </div>
            </>
          )}
        </Form>
      )}
    </Formik>
  );
};

export default OHRIForm;
