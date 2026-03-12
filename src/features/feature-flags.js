import config from '../config/index.js';
import { AppError } from '../common/errors/app-error.js';
import { ERROR_CODES } from '../common/constants/error-codes.js';

const FLAGS = {
  ACCOUNT_TYPE_BUSINESS: config.features.accountBusiness,
  ACCOUNT_TYPE_PROFESSIONAL: config.features.accountProfessional,
  ACCOUNT_TYPE_COMMUNITY: config.features.accountCommunity,
  MEMBERSHIP_UPGRADE: false,
  CIRCLE_CHAT: false,
};

export function isFeatureEnabled(flagName) {
  return FLAGS[flagName] === true;
}

export function requireFeature(flagName) {
  return (req, res, next) => {
    if (!isFeatureEnabled(flagName)) {
      throw AppError.notFound('This feature is not available', ERROR_CODES.FEATURE_DISABLED);
    }
    next();
  };
}

export function isAccountTypeEnabled(accountType) {
  const flagName = `ACCOUNT_TYPE_${accountType.toUpperCase()}`;
  return isFeatureEnabled(flagName);
}
