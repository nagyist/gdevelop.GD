// @flow
import * as React from 'react';
import axios from 'axios';
import path from 'path-browserify';
import { GDevelopShopApi } from './ApiConfigs';
import { isURL } from '../../ResourcesList/ResourceUtils';
import { type AuthenticatedUser } from '../../Profile/AuthenticatedUserContext';
import { type MessageByLocale } from '../i18n/MessageByLocale';
import { type Subscription } from './Usage';
import { Trans } from '@lingui/macro';
import {
  type Bundle,
  type PrivateAssetPack,
  type PrivateGameTemplate,
} from '../../Utils/GDevelopServices/Asset';

export const client = axios.create({
  baseURL: GDevelopShopApi.baseUrl,
});

export type ProductType =
  | 'ASSET_PACK'
  | 'GAME_TEMPLATE'
  | 'CREDITS_PACKAGE'
  | 'COURSE'
  | 'COURSE_CHAPTER'
  | 'BUNDLE';

type StripeAndPaypalPrice = {|
  value: number,
  name: string,
  usageType: string,
  stripePriceId: string,
  currency: 'USD' | 'EUR',
|};

type CreditPrice = {|
  amount: number,
  usageType: string,
|};

export type IncludedListableProduct = {|
  productId: string,
  productType: 'ASSET_PACK' | 'GAME_TEMPLATE' | 'COURSE' | 'CREDITS_PACKAGE',
  usageType: string,
|};

export type IncludedRedemptionCode = {|
  givenSubscriptionPlanId: string,
  durationInDays: number,
  estimatedPrices?: Array<{
    value: number,
    currency: 'USD' | 'EUR',
  }>,
|};

export type ProductListingData = {|
  id: string,
  sellerId: string,
  isSellerGDevelop: boolean,
  productType: ProductType,
  listing: ProductType,
  name: string,
  nameByLocale?: MessageByLocale,
  description: string,
  descriptionByLocale?: MessageByLocale,
  categories: Array<string>,
  updatedAt: string,
  createdAt: string,
  thumbnailUrls: string[],
  includedListableProductIds?: string[],
  includedListableProducts?: Array<IncludedListableProduct>,
  includedRedemptionCodes?: Array<IncludedRedemptionCode>,
|};

type RedeemCondition = {
  reason: 'subscription',
  condition: string,
  usageType: string,
};

type RedeemableAttributes = {|
  redeemConditions?: RedeemCondition[],
|};

type StripeAndPaypalSellableAttributes = {|
  prices: StripeAndPaypalPrice[],
  sellerStripeAccountId: string,
  stripeProductId: string,
|};

type CreditsClaimableAttributes = {|
  creditPrices: Array<CreditPrice>,
|};

type AppStoreProductAttributes = {|
  appStoreProductId: string | null,
  /** The thumbnails to use when on the app store - otherwise, use thumbnailUrls as usual. */
  appStoreThumbnailUrls?: string[] | null,
|};

export type PrivateAssetPackListingData = {|
  ...ProductListingData,
  ...StripeAndPaypalSellableAttributes,
  ...AppStoreProductAttributes,
  ...CreditsClaimableAttributes,
  ...RedeemableAttributes,
  productType: 'ASSET_PACK',
  listing: 'ASSET_PACK',
|};

export type PrivateGameTemplateListingData = {|
  ...ProductListingData,
  ...StripeAndPaypalSellableAttributes,
  ...AppStoreProductAttributes,
  ...CreditsClaimableAttributes,
  productType: 'GAME_TEMPLATE',
  listing: 'GAME_TEMPLATE',
|};

export type CreditsPackageListingData = {|
  ...ProductListingData,
  ...StripeAndPaypalSellableAttributes,
  ...AppStoreProductAttributes,
  productType: 'CREDITS_PACKAGE',
  listing: 'CREDITS_PACKAGE',
|};

export type CourseChapterListingData = {|
  ...ProductListingData,
  ...CreditsClaimableAttributes,
  productType: 'COURSE_CHAPTER',
  listing: 'COURSE_CHAPTER',
|};

export type CourseListingData = {|
  ...ProductListingData,
  ...StripeAndPaypalSellableAttributes,
  ...CreditsClaimableAttributes,
  productType: 'COURSE',
  listing: 'COURSE',
|};

export type BundleListingData = {|
  ...ProductListingData,
  ...AppStoreProductAttributes,
  ...StripeAndPaypalSellableAttributes,
  productType: 'BUNDLE',
  listing: 'BUNDLE',
|};

export type Purchase = {|
  id: string,
  usageType: string,
  productId: string,
  buyerId: string,
  receiverId: string,
  createdAt: string,
  cancelledAt?: string,
  stripeCheckoutSessionId?: string,
  stripeCustomerId?: string,
  appStoreTransactionId?: string,
  paypalPayerId?: string,
  paypalOrderId?: string,
  manualGiftReason?: string,
  creditsAmount?: number,
  productType: ProductType,
|};

type ProductLicenseType = 'personal' | 'commercial' | 'unlimited' | 'default';
export type ProductLicense = {|
  id: ProductLicenseType,
  nameByLocale: MessageByLocale,
  descriptionByLocale: MessageByLocale,
|};

// Helper to create a listing data for an item that is not
// sold anymore, but still available for users who purchased it.
const getArchivedProductListingData = ({
  asset,
}: {
  asset: Bundle | PrivateAssetPack | PrivateGameTemplate,
}): ProductListingData => ({
  id: asset.id,
  sellerId: 'R0F5QGNCzgOY5w2cxGeKJOq2UaD2',
  isSellerGDevelop: true,
  name: asset.name,
  description: asset.longDescription,
  categories: [],
  updatedAt: asset.updatedAt,
  createdAt: asset.createdAt,
  thumbnailUrls: asset.previewImageUrls,
  listing: 'BUNDLE', // Will be replaced by the actual listing type.
  productType: 'BUNDLE', // Will be replaced by the actual product type.
});

export const getArchivedBundleListingData = ({
  bundle,
}: {|
  bundle: Bundle,
|}): BundleListingData => ({
  ...getArchivedProductListingData({ asset: bundle }),
  productType: 'BUNDLE',
  listing: 'BUNDLE',
  includedListableProducts: bundle.includedProducts,
  includedRedemptionCodes: bundle.includedRedemptionCodes,
  descriptionByLocale: bundle.longDescriptionByLocale,
  nameByLocale: bundle.nameByLocale,
  appStoreProductId: '',
  prices: [],
  sellerStripeAccountId: '',
  stripeProductId: '',
});

export const getArchivedPrivateAssetPackListingData = ({
  assetPack,
}: {|
  assetPack: PrivateAssetPack,
|}): PrivateAssetPackListingData => ({
  ...getArchivedProductListingData({ asset: assetPack }),
  productType: 'ASSET_PACK',
  listing: 'ASSET_PACK',
  includedListableProductIds: assetPack.includedPackIds,
  appStoreProductId: '',
  prices: [],
  creditPrices: [],
  sellerStripeAccountId: '',
  stripeProductId: '',
});

export const getArchivedPrivateGameTemplateListingData = ({
  gameTemplate,
}: {|
  gameTemplate: PrivateGameTemplate,
|}): PrivateGameTemplateListingData => ({
  ...getArchivedProductListingData({ asset: gameTemplate }),
  productType: 'GAME_TEMPLATE',
  listing: 'GAME_TEMPLATE',
  includedListableProductIds: gameTemplate.includedTemplateIds,
  appStoreProductId: '',
  prices: [],
  creditPrices: [],
  sellerStripeAccountId: '',
  stripeProductId: '',
});

export const listListedPrivateAssetPacks = async (): Promise<
  Array<PrivateAssetPackListingData>
> => {
  const response = await client.get('/asset-pack');
  const assetPacks = response.data;
  if (!Array.isArray(assetPacks)) {
    throw new Error('Invalid response from the asset packs API');
  }

  return assetPacks;
};

export const listListedPrivateGameTemplates = async (): Promise<
  Array<PrivateGameTemplateListingData>
> => {
  const response = await client.get('/game-template');
  const gameTemplates = response.data;
  if (!Array.isArray(gameTemplates)) {
    throw new Error('Invalid response from the game templates API');
  }

  return gameTemplates;
};

export const listListedCreditsPackages = async (): Promise<
  Array<CreditsPackageListingData>
> => {
  const response = await client.get('/credits-package');
  const creditsPackages = response.data;
  if (!Array.isArray(creditsPackages)) {
    throw new Error('Invalid response from the credits packages API');
  }

  return creditsPackages;
};

export const listListedCourseChapters = async (): Promise<
  Array<CourseChapterListingData>
> => {
  const response = await client.get('/course-chapter');
  const courseChapters = response.data;
  if (!Array.isArray(courseChapters)) {
    throw new Error('Invalid response from the course chapters API');
  }

  return courseChapters;
};

export const listListedCourses = async (): Promise<
  Array<CourseListingData>
> => {
  const response = await client.get('/course');
  const courses = response.data;
  if (!Array.isArray(courses)) {
    throw new Error('Invalid response from the courses API');
  }

  return courses;
};

export const listListedBundles = async (): Promise<
  Array<BundleListingData>
> => {
  const response = await client.get('/bundle');
  const bundles = response.data;
  if (!Array.isArray(bundles)) {
    throw new Error('Invalid response from the bundles API');
  }

  return bundles;
};

export const listSellerAssetPacks = async ({
  sellerId,
}: {|
  sellerId: string,
|}): Promise<Array<PrivateAssetPackListingData>> => {
  const response = await client.get(`/user/${sellerId}/product`, {
    params: {
      productType: 'asset-pack',
    },
  });
  return response.data;
};

export const listSellerGameTemplates = async ({
  sellerId,
}: {|
  sellerId: string,
|}): Promise<Array<PrivateGameTemplateListingData>> => {
  const response = await client.get(`/user/${sellerId}/product`, {
    params: {
      productType: 'game-template',
    },
  });
  return response.data;
};

export const listUserPurchases = async (
  getAuthorizationHeader: () => Promise<string>,
  {
    userId,
    productType,
    role,
  }: {|
    userId: string,
    productType:
      | 'asset-pack'
      | 'game-template'
      | 'credits-package'
      | 'course'
      | 'course-chapter'
      | 'bundle',
    role: 'receiver' | 'buyer',
  |}
): Promise<Array<Purchase>> => {
  const authorizationHeader = await getAuthorizationHeader();
  const response = await client.get('/purchase', {
    params: {
      userId,
      productType,
      role,
    },
    headers: {
      Authorization: authorizationHeader,
    },
  });
  return response.data;
};

export const getAuthorizationTokenForPrivateAssets = async (
  getAuthorizationHeader: () => Promise<string>,
  {
    userId,
  }: {|
    userId: string,
  |}
): Promise<string> => {
  const authorizationHeader = await getAuthorizationHeader();
  const response = await client.post(
    '/asset-pack/action/authorize',
    {},
    {
      headers: { Authorization: authorizationHeader },
      params: { userId },
    }
  );
  return response.data;
};

export const getAuthorizationTokenForPrivateGameTemplates = async (
  getAuthorizationHeader: () => Promise<string>,
  {
    userId,
  }: {|
    userId: string,
  |}
): Promise<string> => {
  const authorizationHeader = await getAuthorizationHeader();
  const response = await client.post(
    '/game-template/action/authorize',
    {},
    {
      headers: { Authorization: authorizationHeader },
      params: { userId },
    }
  );
  return response.data;
};

export const createProductAuthorizedUrl = (
  url: string,
  token: string
): string => {
  return url.indexOf('?') !== -1
    ? `${url}&token=${encodeURIComponent(token)}`
    : `${url}?token=${encodeURIComponent(token)}`;
};

export const isPrivateAssetResourceAuthorizedUrl = (url: string): boolean =>
  url.startsWith('https://private-assets.gdevelop.io/') ||
  url.startsWith('https://private-assets-dev.gdevelop.io/');

export const isPrivateGameTemplateResourceAuthorizedUrl = (
  url: string
): boolean =>
  url.startsWith('https://private-game-templates.gdevelop.io/') ||
  url.startsWith('https://private-game-templates-dev.gdevelop.io/');

export const isProductAuthorizedResourceUrl = (url: string): boolean =>
  isPrivateAssetResourceAuthorizedUrl(url) ||
  isPrivateGameTemplateResourceAuthorizedUrl(url);

export const extractDecodedFilenameWithExtensionFromProductAuthorizedUrl = (
  productAuthorizedUrl: string
): string => {
  const urlWithoutQueryParams = productAuthorizedUrl.split('?')[0];
  const decodedFilenameWithExtension = decodeURIComponent(
    path.basename(urlWithoutQueryParams)
  );
  return decodedFilenameWithExtension;
};

export const getPurchaseCheckoutUrl = ({
  productId,
  priceName,
  userId,
  userEmail,
  password,
}: {|
  productId: string,
  priceName: string,
  userId: string,
  userEmail: string,
  password?: string,
|}): string => {
  const url = new URL(
    `${GDevelopShopApi.baseUrl}/purchase/action/redirect-to-checkout`
  );

  url.searchParams.set('productId', productId);
  url.searchParams.set('priceName', priceName);
  url.searchParams.set('userId', userId);
  url.searchParams.set('customerEmail', userEmail);
  if (password) url.searchParams.set('password', password);

  return url.toString();
};

// Helper to fetch a token for private game templates if needed, when moving or fetching resources.
export const fetchTokenForPrivateGameTemplateAuthorizationIfNeeded = async ({
  authenticatedUser,
  allResourcePaths,
}: {|
  authenticatedUser: AuthenticatedUser,
  allResourcePaths: Array<string>,
|}): Promise<?string> => {
  const isFetchingGameTemplateAuthorizedResources = allResourcePaths.some(
    resourcePath =>
      isURL(resourcePath) &&
      isPrivateGameTemplateResourceAuthorizedUrl(resourcePath)
  );

  if (isFetchingGameTemplateAuthorizedResources) {
    const userId = authenticatedUser.profile && authenticatedUser.profile.id;
    if (!userId) {
      throw new Error(
        'Can not fetch resources from a private game template without being authenticated.'
      );
    }
    const tokenForPrivateGameTemplateAuthorization = await getAuthorizationTokenForPrivateGameTemplates(
      authenticatedUser.getAuthorizationHeader,
      { userId }
    );
    return tokenForPrivateGameTemplateAuthorization;
  }
  return null;
};

export const listProductLicenses = async ({
  productType,
}: {|
  productType: 'asset-pack' | 'game-template',
|}): Promise<ProductLicense[]> => {
  const response = await client.get('/product-license', {
    params: {
      productType,
    },
  });
  const productLicenses = response.data;

  if (!Array.isArray(productLicenses)) {
    throw new Error('Invalid response from the product licenses API');
  }

  return productLicenses;
};

export const buyProductWithCredits = async (
  getAuthorizationHeader: () => Promise<string>,
  {
    productId,
    usageType,
    userId,
    password,
  }: {|
    productId: string,
    usageType: string,
    userId: string,
    password?: string,
  |}
): Promise<void> => {
  const authorizationHeader = await getAuthorizationHeader();

  const queryParams: {| userId: string, password?: string |} = { userId };
  if (password) queryParams.password = password;

  await client.post(
    `/product/${productId}/action/buy-with-credits`,
    {
      usageType: 'product-purchase',
      priceUsageType: usageType,
    },
    {
      params: queryParams,
      headers: {
        Authorization: authorizationHeader,
      },
    }
  );
};

export const canRedeemProduct = ({
  redeemCondition,
  subscription,
}: {|
  redeemCondition: RedeemCondition,
  subscription?: ?Subscription,
|}):
  | {| canRedeem: true |}
  | {| canRedeem: false |}
  | {|
      canRedeem: false,
      reason?: 'subscription',
      canUpgrade?: boolean,
    |} => {
  if (redeemCondition.reason === 'subscription') {
    // Condition should look like `gdevelop_gold,gdevelop_startup`.
    const requiredPlanIds = redeemCondition.condition.split(',');
    if (subscription && !subscription.benefitsFromEducationPlan) {
      if (requiredPlanIds.includes(subscription.planId)) {
        return { canRedeem: true };
      } else {
        return {
          canRedeem: false,
          canUpgrade: [
            'gdevelop_indie',
            'gdevelop_pro',
            'gdevelop_silver',
            'gdevelop_gold',
          ].some(
            planId =>
              subscription.planId === planId &&
              !requiredPlanIds.includes(planId)
          ),
        };
      }
    }
  }

  return { canRedeem: false };
};

export const getCalloutToGetSubscriptionOrClaimAssetPack = ({
  subscription,
  privateAssetPackListingData,
  isAlreadyReceived,
}: {|
  subscription: ?Subscription,
  privateAssetPackListingData: PrivateAssetPackListingData,
  isAlreadyReceived: boolean,
|}): ?{|
  message: React.Node,
  actionLabel: ?React.Node,
  canRedeemAssetPack: boolean,
|} => {
  if (isAlreadyReceived || !privateAssetPackListingData.redeemConditions)
    return null;
  if (subscription && subscription.benefitsFromEducationPlan) return null;

  const applicableRedeemConditions = privateAssetPackListingData.redeemConditions.filter(
    redeemCondition => {
      return privateAssetPackListingData.prices.some(
        price =>
          price.usageType === redeemCondition.usageType &&
          redeemCondition.reason === 'subscription'
      );
    }
  );

  // The first redeem condition is the priority one.
  const firstApplicableRedeemCondition = applicableRedeemConditions[0];
  if (!firstApplicableRedeemCondition) return null;

  const redemptionCheck = canRedeemProduct({
    redeemCondition: firstApplicableRedeemCondition,
    subscription,
  });

  const actionLabel = redemptionCheck.canRedeem ? (
    <Trans>Claim this pack</Trans>
  ) : !subscription || !subscription.planId ? (
    <Trans>Get a Sub</Trans>
  ) : redemptionCheck.canUpgrade ? (
    <Trans>Upgrade</Trans>
  ) : null;

  if (firstApplicableRedeemCondition.usageType === 'commercial') {
    return {
      actionLabel,
      canRedeemAssetPack: redemptionCheck.canRedeem,
      // TODO: Adapt message to redeem condition
      message: (
        <Trans>
          Single commercial use license for claim with Gold or Pro subscription
        </Trans>
      ),
    };
  }
  if (firstApplicableRedeemCondition.usageType === 'personal') {
    return {
      actionLabel,
      canRedeemAssetPack: redemptionCheck.canRedeem,
      // TODO: Adapt message to redeem condition
      message: (
        <Trans>Personal license for claim with Gold or Pro subscription</Trans>
      ),
    };
  }
  if (firstApplicableRedeemCondition.usageType === 'unlimited') {
    return {
      actionLabel,
      canRedeemAssetPack: redemptionCheck.canRedeem,
      // TODO: Adapt message to redeem condition
      message: (
        <Trans>
          Unlimited commercial use license for claim with Gold or Pro
          subscription
        </Trans>
      ),
    };
  }
};

export const redeemPrivateAssetPack = async ({
  privateAssetPackListingData,
  getAuthorizationHeader,
  userId,
  password,
}: {|
  privateAssetPackListingData: PrivateAssetPackListingData,
  getAuthorizationHeader: () => Promise<string>,
  userId: string,
  password: string,
|}): Promise<void> => {
  const authorizationHeader = await getAuthorizationHeader();
  const payload: {| priceUsageType: string, password?: string |} = {
    priceUsageType: 'commercial',
  };
  if (password) payload.password = password;
  await client.post(
    `/product/${privateAssetPackListingData.id}/action/redeem`,
    payload,
    {
      headers: { Authorization: authorizationHeader },
      params: { userId },
    }
  );
};
