// @flow
import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { I18n } from '@lingui/react';
import { Trans, t } from '@lingui/macro';

import SemiControlledAutoComplete, {
  type AutoCompleteOption,
  type DataSource,
  type SemiControlledAutoCompleteInterface,
} from '../UI/SemiControlledAutoComplete';
import {
  type ResourceSource,
  type ResourceManagementProps,
  type ResourceKind,
} from '../ResourcesList/ResourceSource';
import { type FieldFocusFunction } from '../EventsSheet/ParameterFields/ParameterFieldCommons';
import { type ResourceExternalEditor } from '../ResourcesList/ResourceExternalEditor';
import ResourcesLoader from '../ResourcesLoader';
import { applyResourceDefaults } from './ResourceUtils';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';
import FlatButtonWithSplitMenu from '../UI/FlatButtonWithSplitMenu';
import { LineStackLayout, ResponsiveLineStackLayout } from '../UI/Layout';
import IconButton from '../UI/IconButton';
import RaisedButton from '../UI/RaisedButton';
import FlatButton from '../UI/FlatButton';
import { Column } from '../UI/Grid';
import { showErrorBox } from '../UI/Messages/MessageBox';
import { ExternalEditorOpenedDialog } from '../UI/ExternalEditorOpenedDialog';
import Add from '../UI/CustomSvgIcons/Add';
import Edit from '../UI/CustomSvgIcons/Edit';
import Cross from '../UI/CustomSvgIcons/Cross';
import useResourcesChangedWatcher from './UseResourcesChangedWatcher';
import useForceUpdate from '../Utils/UseForceUpdate';
import useAlertDialog from '../UI/Alert/useAlertDialog';

const styles = {
  textFieldStyle: { display: 'flex', flex: 1 },
};

type Props = {|
  project: gdProject,
  resourceManagementProps: ResourceManagementProps,
  resourcesLoader: typeof ResourcesLoader,
  resourceKind: ResourceKind,
  fallbackResourceKind?: ?ResourceKind,
  fullWidth?: boolean,
  canBeReset?: boolean,
  initialResourceName: string,
  defaultNewResourceName?: string,
  onChange: string => void,
  floatingLabelText?: React.Node,
  helperMarkdownText?: ?string,
  hintText?: MessageDescriptor,
  onRequestClose?: () => void,
  onApply?: () => void,
  margin?: 'none' | 'dense',
  style?: {| alignSelf?: 'center' |},
  id?: string,
  disabled?: boolean,
|};

export type ResourceSelectorInterface = {| focus: FieldFocusFunction |};

const ResourceSelector = React.forwardRef<Props, ResourceSelectorInterface>(
  (props, ref) => {
    const {
      project,
      initialResourceName,
      defaultNewResourceName,
      resourceManagementProps,
      resourcesLoader,
      resourceKind,
      fallbackResourceKind,
      onChange,
      disabled,
    } = props;
    const forceUpdate = useForceUpdate();
    const autoCompleteRef = React.useRef<?SemiControlledAutoCompleteInterface>(
      null
    );
    // We use a state value for the autoComplete input,
    // so that we can adapt the dataSource options depending
    // on whether the user has started typing or not.
    // (The state value is needed to force a re-render of the component)
    const [
      autoCompleteInputValue,
      setAutoCompleteInputValue,
    ] = React.useState<string>(props.initialResourceName);
    const { showConfirmation } = useAlertDialog();
    const abortControllerRef = React.useRef<?AbortController>(null);
    const allResourcesNamesRef = React.useRef<Array<string>>([]);
    const [notFoundError, setNotFoundError] = React.useState<boolean>(false);
    const [resourceName, setResourceName] = React.useState<string>(
      props.initialResourceName
    );
    const [
      externalEditorOpened,
      setExternalEditorOpened,
    ] = React.useState<boolean>(false);
    const [
      forceShowResourceSources,
      setForceShowResourceSources,
    ] = React.useState<boolean>(false);

    const storageProvider = resourceManagementProps.getStorageProvider();
    const resourceSources = resourceManagementProps.resourceSources
      .filter(source => source.kind === resourceKind)
      .filter(
        ({ onlyForStorageProvider }) =>
          !onlyForStorageProvider ||
          onlyForStorageProvider === storageProvider.internalName
      );

    const focus: FieldFocusFunction = React.useCallback(options => {
      if (autoCompleteRef.current) autoCompleteRef.current.focus(options);
    }, []);

    React.useImperativeHandle(ref, () => ({
      focus,
    }));

    React.useEffect(
      () => {
        setResourceName(initialResourceName);
        if (autoCompleteRef.current)
          autoCompleteRef.current.forceInputValueTo(initialResourceName);
      },
      // Update resource name with the one given by the parent if it changes.
      [initialResourceName]
    );

    const onResetResourceName = React.useCallback(
      () => {
        setResourceName('');
        if (autoCompleteRef.current)
          autoCompleteRef.current.forceInputValueTo('');
        setNotFoundError(false);
        if (onChange) onChange('');
      },
      [onChange]
    );

    const onChangeResourceName = React.useCallback(
      (newResourceName: string) => {
        if (newResourceName === '') {
          onResetResourceName();
          return;
        }
        const isMissing =
          allResourcesNamesRef.current.indexOf(newResourceName) === -1;

        if (!isMissing) {
          if (onChange) onChange(newResourceName);
        }
        setResourceName(newResourceName);
        if (autoCompleteRef.current)
          autoCompleteRef.current.forceInputValueTo(newResourceName);
        setNotFoundError(isMissing);
      },
      [onChange, onResetResourceName]
    );

    const onInputValueChange = React.useCallback(
      (newInputValue: string) => {
        if (forceShowResourceSources) {
          setForceShowResourceSources(false);
        }
        setAutoCompleteInputValue(newInputValue);
      },
      [setAutoCompleteInputValue, forceShowResourceSources]
    );

    const loadFrom = React.useCallback(
      (resourcesManager: gdResourcesManager) => {
        const allResourcesNames = resourcesManager
          .getAllResourceNames()
          .toJSArray();
        if (resourceKind) {
          const mainResourcesNames = allResourcesNames.filter(resourceName => {
            return (
              resourcesManager.getResource(resourceName).getKind() ===
              resourceKind
            );
          });

          if (fallbackResourceKind) {
            mainResourcesNames.push(
              ...allResourcesNames.filter(resourceName => {
                return (
                  resourcesManager.getResource(resourceName).getKind() ===
                  fallbackResourceKind
                );
              })
            );
          }

          allResourcesNamesRef.current = mainResourcesNames;
        }
      },
      [resourceKind, fallbackResourceKind]
    );

    const refreshResources = React.useCallback(
      () => {
        if (project) {
          loadFrom(project.getResourcesManager());
          forceUpdate();
        }
      },
      [project, forceUpdate, loadFrom]
    );

    React.useEffect(
      refreshResources,
      // Reload resources when loadFrom - and refreshResources - is updated, that's to say
      // when resourceKind or fallbackResourceKind is updated, or when the project changes.
      [refreshResources]
    );

    // Transfer responsibility of refreshing project resources to this hook.
    const { triggerResourcesHaveChanged } = useResourcesChangedWatcher({
      project,
      callback: refreshResources,
    });

    const addFrom = React.useCallback(
      async (initialResourceSource: ResourceSource) => {
        try {
          if (!initialResourceSource) return;

          const {
            selectedResources,
            selectedSourceName,
          } = await resourceManagementProps.onChooseResource({
            initialSourceName: initialResourceSource.name,
            multiSelection: false,
            resourceKind: resourceKind,
          });

          if (!selectedResources.length) return;
          const selectedResourceSource = resourceSources.find(
            source => source.name === selectedSourceName
          );
          if (!selectedResourceSource) return;

          const resource = selectedResources[0];

          const resourceName: string = resource.getName();

          // Imperatively set the value of the autoComplete, as it can be (on Windows for example),
          // still focused. This means that when it's then getting blurred, the value we
          // set for the resource name would get erased by the one that was getting entered.
          if (autoCompleteRef.current)
            autoCompleteRef.current.forceInputValueTo(resourceName);

          if (selectedResourceSource.shouldCreateResource) {
            applyResourceDefaults(project, resource);

            // addResource will check if a resource with the same name exists, and if it is
            // the case, no new resource will be added.
            project.getResourcesManager().addResource(resource);

            // Important, we are responsible for deleting the resources that were given to us.
            // Otherwise we have a memory leak, as calling addResource is making a copy of the resource.
            selectedResources.forEach(resource => resource.delete());

            await resourceManagementProps.onFetchNewlyAddedResources();
            triggerResourcesHaveChanged();
          }

          onChangeResourceName(resourceName);
        } catch (err) {
          // Should never happen, errors should be shown in the interface.
          console.error('Unable to choose a resource', err);
        }
      },
      [
        project,
        resourceManagementProps,
        resourceKind,
        onChangeResourceName,
        triggerResourcesHaveChanged,
        resourceSources,
      ]
    );

    const getResourceSourceItems = React.useCallback(
      (): DataSource => {
        return [
          ...resourceSources.map(source => ({
            text: '',
            value: '',
            translatableValue: source.displayName,
            renderIcon: () => <Add />,
            onClick: () => addFrom(source),
          })),
          {
            type: 'separator',
          },
        ];
      },
      [addFrom, resourceSources]
    );

    const editWith = React.useCallback(
      async (
        i18n: I18nType,
        resourceExternalEditor: ResourceExternalEditor
      ) => {
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;
        const resourcesManager = project.getResourcesManager();
        const initialResource = resourcesManager.getResource(resourceName);

        try {
          setExternalEditorOpened(true);
          const editResult = await resourceExternalEditor.edit({
            project,
            i18n,
            getStorageProvider: resourceManagementProps.getStorageProvider,
            resourceManagementProps,
            resourceNames: [resourceName],
            extraOptions: {
              existingMetadata: initialResource.getMetadata(),

              // Only useful for images:
              singleFrame: true,
              fps: 0,
              name: resourceName || defaultNewResourceName,
              isLooping: false,
            },
            signal,
          });

          setExternalEditorOpened(false);
          if (!editResult) return;

          const { resources } = editResult;
          if (!resources.length) return;

          // Burst the ResourcesLoader cache to force the file to be reloaded (and not cached by the browser).
          resourcesLoader.burstUrlsCacheForResources(project, [
            resources[0].name,
          ]);

          onChange(resources[0].name);
          triggerResourcesHaveChanged();
          forceUpdate();
        } catch (error) {
          if (error.name !== 'UserCancellationError') {
            console.error(
              'An exception was thrown when launching or reading resources from the external editor:',
              error
            );
            showErrorBox({
              message:
                'There was an error while using the external editor. Try with another resource and if this persists, please report this as a bug.',
              rawError: error,
              errorId: 'external-editor-error',
            });
          }
          setExternalEditorOpened(false);
        } finally {
          abortControllerRef.current = null;
        }
      },
      [
        defaultNewResourceName,
        forceUpdate,
        onChange,
        project,
        resourceManagementProps,
        resourceName,
        resourcesLoader,
        triggerResourcesHaveChanged,
      ]
    );

    const cancelEditingWithExternalEditor = React.useCallback(
      async () => {
        const shouldContinue = await showConfirmation({
          title: t`Cancel editing`,
          message: t`You will lose any progress made with the external editor. Do you wish to cancel?`,
          confirmButtonLabel: t`Cancel edition`,
          dismissButtonLabel: t`Continue editing`,
        });
        if (!shouldContinue) return;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        } else {
          console.error(
            'Cannot cancel editing with external editor, abort controller is missing.'
          );
        }
      },
      [showConfirmation]
    );

    const errorText = notFoundError ? (
      <Trans>This resource does not exist in the game</Trans>
    ) : null;

    const externalEditors = resourceManagementProps.resourceExternalEditors.filter(
      externalEditor => externalEditor.kind === resourceKind
    );

    const resourceSourceItems = getResourceSourceItems();
    const resourceItems = allResourcesNamesRef.current.map(resourceName => ({
      text: resourceName,
      value: resourceName,
    }));
    const placeholderSearchItem: AutoCompleteOption = {
      text: '',
      value: '',
      translatableValue: t`Or start typing...`,
      disabled: true,
    };
    const autoCompleteData =
      autoCompleteInputValue && !forceShowResourceSources
        ? resourceItems
        : [...resourceSourceItems, placeholderSearchItem];

    return (
      <I18n>
        {({ i18n }) => (
          <ResponsiveLineStackLayout
            noMargin
            expand
            alignItems="center"
            noResponsiveLandscape
          >
            <Column expand noMargin>
              <LineStackLayout expand noMargin alignItems="center">
                <SemiControlledAutoComplete
                  style={props.style}
                  textFieldStyle={styles.textFieldStyle}
                  floatingLabelText={props.floatingLabelText}
                  helperMarkdownText={props.helperMarkdownText}
                  hintText={props.hintText}
                  openOnFocus
                  dataSource={autoCompleteData}
                  value={resourceName}
                  onChange={onChangeResourceName}
                  onInputValueChange={onInputValueChange}
                  errorText={errorText}
                  fullWidth={props.fullWidth}
                  margin={props.margin}
                  onRequestClose={props.onRequestClose}
                  onApply={props.onApply}
                  ref={autoCompleteRef}
                  id={props.id}
                  disabled={disabled}
                  onBlur={() => {
                    if (forceShowResourceSources) {
                      setForceShowResourceSources(false);
                    }
                  }}
                />
                {props.canBeReset && (
                  <IconButton size="small" onClick={onResetResourceName}>
                    <Cross />
                  </IconButton>
                )}
              </LineStackLayout>
            </Column>
            <RaisedButton
              label={
                resourceName ? (
                  <Trans>Replace</Trans>
                ) : (
                  <Trans>Choose a file</Trans>
                )
              }
              onClick={() => {
                const autocomplete = autoCompleteRef.current;
                if (autocomplete) {
                  setForceShowResourceSources(true);
                  autocomplete.focus();
                }
              }}
              primary
              disabled={disabled}
            />
            {externalEditors.length === 1 && (
              <FlatButton
                leftIcon={<Edit fontSize="small" />}
                label={i18n._(
                  resourceName
                    ? externalEditors[0].editDisplayName
                    : externalEditors[0].createDisplayName
                )}
                onClick={() => editWith(i18n, externalEditors[0])}
                disabled={disabled}
              />
            )}
            {externalEditors.length > 1 ? (
              <FlatButtonWithSplitMenu
                icon={<Edit fontSize="small" />}
                label={i18n._(
                  resourceName
                    ? externalEditors[0].editDisplayName
                    : externalEditors[0].createDisplayName
                )}
                onClick={() => editWith(i18n, externalEditors[0])}
                buildMenuTemplate={(i18n: I18nType) =>
                  externalEditors.map(externalEditor => ({
                    label: i18n._(
                      resourceName
                        ? externalEditor.editDisplayName
                        : externalEditor.createDisplayName
                    ),
                    click: () => editWith(i18n, externalEditor),
                  }))
                }
                disabled={disabled}
              />
            ) : null}
            {externalEditorOpened && (
              <ExternalEditorOpenedDialog
                onClose={cancelEditingWithExternalEditor}
              />
            )}
          </ResponsiveLineStackLayout>
        )}
      </I18n>
    );
  }
);

export default ResourceSelector;
