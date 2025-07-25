// @flow
import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { getUserPublicProfilesByIds } from '../../../../Utils/GDevelopServices/User';
import { type Profile } from '../../../../Utils/GDevelopServices/Authentication';
import { type CloudProjectWithUserAccessInfo } from '../../../../Utils/GDevelopServices/Project';
import {
  type FileMetadataAndStorageProviderName,
  type StorageProvider,
} from '../../../../ProjectsStorage';
import { marginsSize } from '../../../../UI/Grid';
import { type PrivateGameTemplateListingData } from '../../../../Utils/GDevelopServices/Shop';
import { type ExampleShortHeader } from '../../../../Utils/GDevelopServices/Example';
import { type PrivateGameTemplate } from '../../../../Utils/GDevelopServices/Asset';
import { type GDevelopTheme } from '../../../../UI/Theme';
import {
  ExampleTile,
  PrivateGameTemplateTile,
} from '../../../../AssetStore/ShopTiles';
import PreferencesContext from '../../../Preferences/PreferencesContext';
import AuthenticatedUserContext from '../../../../Profile/AuthenticatedUserContext';

export type LastModifiedInfo = {|
  lastModifiedByUsername: ?string,
  lastModifiedByIconUrl: string,
  lastModifiedAt: number,
  lastKnownVersionId: ?string,
|};

export type LastModifiedInfoByProjectId = {|
  [projectId: string]: LastModifiedInfo,
|};

export const getProjectLineHeight = ({ isMobile }: {| isMobile: boolean |}) => {
  const lineHeight = isMobile ? 52 : 36;

  return lineHeight - 2 * marginsSize;
};

export const getLastModifiedInfoByProjectId = async ({
  cloudProjects,
  profile,
}: {|
  cloudProjects: Array<CloudProjectWithUserAccessInfo>,
  profile: Profile,
|}): Promise<LastModifiedInfoByProjectId> => {
  const cloudProjectsLastModifiedBySomeoneElse = cloudProjects.filter(
    cloudProject =>
      !!cloudProject.committedAt &&
      !!cloudProject.lastCommittedBy &&
      cloudProject.lastCommittedBy !== profile.id
  );

  const allOtherContributorIds = new Set(
    cloudProjectsLastModifiedBySomeoneElse
      .map(cloudProject => cloudProject.lastCommittedBy)
      .filter(Boolean)
  );

  if (allOtherContributorIds.size === 0) return {};

  try {
    const userPublicProfileByIds = await getUserPublicProfilesByIds(
      Array.from(allOtherContributorIds)
    );
    const lastModifiedInfoByProjectId: LastModifiedInfoByProjectId = {};
    cloudProjects.forEach(project => {
      if (!project.lastCommittedBy || !project.committedAt) return;
      const contributorPublicProfile =
        userPublicProfileByIds[project.lastCommittedBy];
      if (!contributorPublicProfile) return;
      lastModifiedInfoByProjectId[project.id] = {
        lastModifiedByUsername: contributorPublicProfile.username,
        lastModifiedByIconUrl: contributorPublicProfile.iconUrl,
        lastModifiedAt: Date.parse(project.committedAt),
        lastKnownVersionId: project.currentVersion,
      };
    });

    return lastModifiedInfoByProjectId;
  } catch (error) {
    // We don't block the display of the projects if the public profiles
    // can't be fetched.
    console.error(
      'Error while fetching public profiles of contributors of projects:',
      error
    );
    return {};
  }
};

export const getStorageProviderByInternalName = (
  storageProviders: Array<StorageProvider>,
  internalName: string
): ?StorageProvider => {
  return storageProviders.find(
    storageProvider => storageProvider.internalName === internalName
  );
};

export const useProjectsListFor = (gameId: string | null) => {
  const { getRecentProjectFiles } = React.useContext(PreferencesContext);
  const authenticatedUser = React.useContext(AuthenticatedUserContext);

  const { cloudProjects } = authenticatedUser;

  let projectFiles: Array<FileMetadataAndStorageProviderName> = getRecentProjectFiles().filter(
    file =>
      !gameId || (file.fileMetadata && file.fileMetadata.gameId === gameId)
  );

  if (cloudProjects) {
    projectFiles = projectFiles.concat(
      transformCloudProjectsIntoFileMetadataWithStorageProviderName(
        cloudProjects.filter(
          cloudProject => !gameId || cloudProject.gameId === gameId
        )
      )
    );
  }

  projectFiles.sort((a, b) => {
    if (!a.fileMetadata.lastModifiedDate) return 1;
    if (!b.fileMetadata.lastModifiedDate) return -1;
    return b.fileMetadata.lastModifiedDate - a.fileMetadata.lastModifiedDate;
  });

  return projectFiles;
};

export const transformCloudProjectsIntoFileMetadataWithStorageProviderName = (
  cloudProjects: Array<CloudProjectWithUserAccessInfo>,
  ownerId?: string
): Array<FileMetadataAndStorageProviderName> => {
  return cloudProjects
    .map(cloudProject => {
      if (cloudProject.deletedAt) return null;
      const file: FileMetadataAndStorageProviderName = {
        storageProviderName: 'Cloud',
        fileMetadata: {
          fileIdentifier: cloudProject.id,
          lastModifiedDate: Date.parse(cloudProject.lastModifiedAt),
          name: cloudProject.name,
          gameId: cloudProject.gameId,
          version: cloudProject.currentVersion,
        },
      };
      if (ownerId) {
        file.fileMetadata.ownerId = ownerId;
      }
      return file;
    })
    .filter(Boolean);
};

const formatItemForGrid = ({
  item,
  onSelectGameTemplate,
  onSelectExample,
  i18n,
  receivedGameTemplates,
}: {
  item: PrivateGameTemplateListingData | ExampleShortHeader,
  onSelectGameTemplate: PrivateGameTemplateListingData => void,
  onSelectExample: ExampleShortHeader => void,
  i18n: I18nType,
  receivedGameTemplates: ?Array<PrivateGameTemplate>,
}): React.Node => {
  if (item.previewImageUrls) {
    return (
      <ExampleTile
        exampleShortHeader={item}
        onSelect={() => onSelectExample(item)}
        key={item.id}
      />
    );
  } else {
    const isTemplateOwned =
      !!receivedGameTemplates &&
      !!receivedGameTemplates.find(
        receivedGameTemplate => receivedGameTemplate.id === item.id
      );
    return (
      <PrivateGameTemplateTile
        privateGameTemplateListingData={item}
        onSelect={() => onSelectGameTemplate(item)}
        owned={isTemplateOwned}
        key={item.id}
      />
    );
  }
};

/**
 * This method allocates examples and private game templates between the
 * build section carousel and grid.
 * `numberOfItemsExclusivelyInCarousel` controls the number of items that
 * should appear in the carousel only. The rest appears in both the carousel
 * and the grid.
 */
export const getExampleAndTemplateTiles = ({
  receivedGameTemplates,
  privateGameTemplateListingDatas,
  exampleShortHeaders,
  onSelectPrivateGameTemplateListingData,
  onSelectExampleShortHeader,
  i18n,
  gdevelopTheme,
  numberOfItemsExclusivelyInCarousel = 0,
  numberOfItemsInCarousel = 0,
  privateGameTemplatesPeriodicity,
  showOwnedGameTemplatesFirst,
}: {|
  receivedGameTemplates: ?Array<PrivateGameTemplate>,
  privateGameTemplateListingDatas?: ?Array<PrivateGameTemplateListingData>,
  exampleShortHeaders?: ?Array<ExampleShortHeader>,
  onSelectPrivateGameTemplateListingData: (
    privateGameTemplateListingData: PrivateGameTemplateListingData
  ) => void,
  onSelectExampleShortHeader: (exampleShortHeader: ExampleShortHeader) => void,
  i18n: I18nType,
  gdevelopTheme: GDevelopTheme,
  numberOfItemsExclusivelyInCarousel?: number,
  numberOfItemsInCarousel?: number,
  privateGameTemplatesPeriodicity: number,
  showOwnedGameTemplatesFirst?: boolean,
|}): Array<React.Node> => {
  if (!exampleShortHeaders || !privateGameTemplateListingDatas) {
    return [];
  }
  const exampleShortHeadersWithThumbnails = exampleShortHeaders.filter(
    exampleShortHeader =>
      !!exampleShortHeader.previewImageUrls &&
      !!exampleShortHeader.previewImageUrls[0]
  );
  const exampleShortHeadersWithoutThumbnails = exampleShortHeaders.filter(
    exampleShortHeader =>
      !exampleShortHeader.previewImageUrls ||
      !exampleShortHeader.previewImageUrls[0]
  );

  const allItems: Array<
    PrivateGameTemplateListingData | ExampleShortHeader
  > = [];

  const maxIndex = Math.max(
    exampleShortHeadersWithThumbnails.length,
    privateGameTemplateListingDatas.length
  );

  let gameTemplateIndex = 0;
  let exampleIndex = 0;
  for (let index = 0; index < maxIndex; index++) {
    if (
      gameTemplateIndex >= privateGameTemplateListingDatas.length &&
      exampleIndex >= exampleShortHeadersWithThumbnails.length
    ) {
      break;
    }
    const privateGameTemplateListingData =
      privateGameTemplateListingDatas[gameTemplateIndex];
    const exampleShortHeader = exampleShortHeadersWithThumbnails[exampleIndex];

    const shouldAddPrivateGameTemplate =
      privateGameTemplatesPeriodicity &&
      index >= 1 && // Do not add them too early.
      index % privateGameTemplatesPeriodicity === 0;

    // First handle example.
    if (exampleShortHeader) {
      allItems.push(exampleShortHeader);
    }

    // Then handle private game template if in the right periodicity.
    if (shouldAddPrivateGameTemplate && privateGameTemplateListingData) {
      if (privateGameTemplateListingData) {
        allItems.push(privateGameTemplateListingData);
      }
    }

    // Increment the index for the next iteration.
    if (shouldAddPrivateGameTemplate) {
      gameTemplateIndex++;
    }
    exampleIndex++;
  }

  // Finally, add examples without thumbnails to the grid.
  exampleShortHeadersWithoutThumbnails.forEach(exampleShortHeader => {
    allItems.push(exampleShortHeader);
  });

  const allGridItems = allItems
    .sort((item1, item2) => {
      if (showOwnedGameTemplatesFirst) {
        const isItem1ATemplateOwned =
          !!item1.sellerId && // Private game template
          !!receivedGameTemplates &&
          !!receivedGameTemplates.find(
            receivedGameTemplate => receivedGameTemplate.id === item1.id
          );
        const isItem2ATemplateOwned =
          !!item2.sellerId && // Private game template
          !!receivedGameTemplates &&
          !!receivedGameTemplates.find(
            receivedGameTemplate => receivedGameTemplate.id === item2.id
          );
        if (isItem1ATemplateOwned && !isItem2ATemplateOwned) return -1;
        if (!isItem1ATemplateOwned && isItem2ATemplateOwned) return 1;
      }

      return 0;
    })
    .map(item =>
      formatItemForGrid({
        item,
        onSelectGameTemplate: onSelectPrivateGameTemplateListingData,
        onSelectExample: onSelectExampleShortHeader,
        i18n,
        receivedGameTemplates,
      })
    );

  return allGridItems;
};
