export const ACCOUNT_TYPES = Object.freeze({
  PERSONAL: 'personal',
  BUSINESS: 'business',
  PROFESSIONAL: 'professional',
  COMMUNITY: 'community',
});

export const ACCOUNT_TYPE_VALUES = Object.values(ACCOUNT_TYPES);

// Types that users can manually create (personal is auto-created at signup)
export const CREATABLE_ACCOUNT_TYPES = Object.freeze([
  ACCOUNT_TYPES.BUSINESS,
  ACCOUNT_TYPES.PROFESSIONAL,
  ACCOUNT_TYPES.COMMUNITY,
]);
