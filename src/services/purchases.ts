// RevenueCat wrapper (A5 Free vs Family, A7 Paid-later): configure with platform keys, logIn(family.id), entitlement cache.
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';

import { getMeta, setMeta } from '@/db/repositories/metaRepo';

export const ENTITLEMENT_FAMILY = 'family';
export const ENTITLEMENT_AI = 'ai_magic';
const CACHE_KEY = 'entitlement_family';

let configured = false;

// API key for this platform ('' when not set).
function apiKey(): string {
  return (Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_RC_IOS_KEY : process.env.EXPO_PUBLIC_RC_ANDROID_KEY) ?? '';
}

// Configures the SDK once; false when no key is set (dev builds without RevenueCat).
export function initPurchases(): boolean {
  if (configured) return true;
  const key = apiKey();
  if (!key) return false;
  try {
    Purchases.configure({ apiKey: key });
    configured = true;
  } catch (e) {
    console.warn('[purchases] configure failed', e);
  }
  return configured;
}

// Links RevenueCat to the family (app user id = family.id).
export async function logInPurchases(familyId: string): Promise<void> {
  if (!initPurchases()) return;
  try {
    await Purchases.logIn(familyId);
  } catch (e) {
    console.warn('[purchases] logIn failed', e);
  }
}

// True when the Family entitlement is active.
export function hasFamily(info: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_FAMILY];
}

// Re-checks the entitlement (app start, after purchase) and caches it; offline → last cached value.
export async function refreshEntitlement(): Promise<boolean> {
  if (!initPurchases()) return (await getMeta(CACHE_KEY)) === 'true';
  try {
    const on = hasFamily(await Purchases.getCustomerInfo());
    await setMeta(CACHE_KEY, on ? 'true' : 'false');
    return on;
  } catch (e) {
    console.warn('[purchases] customer info failed', e);
    return (await getMeta(CACHE_KEY)) === 'true';
  }
}

// Cached entitlement without a network call.
export async function cachedFamily(): Promise<boolean> {
  return (await getMeta(CACHE_KEY)) === 'true';
}

// Current offering (prices come from the store, never hardcoded).
export async function currentOffering(): Promise<PurchasesOffering | null> {
  if (!initPurchases()) return null;
  try {
    return (await Purchases.getOfferings()).current;
  } catch (e) {
    console.warn('[purchases] offerings failed', e);
    return null;
  }
}

// Buys a package; returns whether Family is now active.
export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const on = hasFamily(customerInfo);
    await setMeta(CACHE_KEY, on ? 'true' : 'false');
    return on;
  } catch (e) {
    console.warn('[purchases] purchase failed or cancelled', e);
    return false;
  }
}

// Restore purchases.
export async function restore(): Promise<boolean> {
  if (!initPurchases()) return false;
  try {
    const on = hasFamily(await Purchases.restorePurchases());
    await setMeta(CACHE_KEY, on ? 'true' : 'false');
    return on;
  } catch (e) {
    console.warn('[purchases] restore failed', e);
    return false;
  }
}
