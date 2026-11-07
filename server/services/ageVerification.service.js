/**
 * Age Verification Service
 * Provider-agnostic abstraction for age/identity verification.
 */

const { getMinimumAlcoholAge } = require('../utils/ageVerification.config');
const User = require('../models/User');

// Calculate exact age
const calculateAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) throw new Error("Invalid date of birth");
  if (dob > new Date()) throw new Error("Date of birth cannot be in the future");
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  // Adjust age if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

// Provider Adapter Interface
class AgeVerificationProviderAdapter {
  async createSession(user) {
    throw new Error("createSession not implemented in base adapter");
  }
  
  async getStatus(referenceId) {
    throw new Error("getStatus not implemented in base adapter");
  }
  
  async verifyWebhook(payload, signature) {
    throw new Error("verifyWebhook not implemented in base adapter");
  }
}

// Dummy/Mock Provider for development and graceful degradation
class DummyProvider extends AgeVerificationProviderAdapter {
  async createSession(user) {
    return {
      referenceId: `mock_${user._id}_${Date.now()}`,
      url: `https://mock-kyc-provider.com/verify?user=${user._id}`,
      // Or SDK token
      sdkToken: "mock_sdk_token_123"
    };
  }

  async getStatus(referenceId) {
    // In a real provider, we'd make an API call
    return {
      status: "VERIFIED",
      verifiedAt: new Date(),
      provider: "dummy",
    };
  }

  async verifyWebhook(payload, signature) {
    // Verify signature logic would go here for real provider
    return {
      referenceId: payload.referenceId,
      status: payload.status,
      reason: payload.reason
    };
  }
}

// Factory to get configured provider
const getProvider = () => {
  const providerName = process.env.AGE_VERIFICATION_PROVIDER || 'dummy';
  
  if (providerName === 'dummy') {
    return new DummyProvider();
  }
  
  // Add other real providers (e.g., Onfido, Digilocker adapter, etc.) here
  // if (providerName === 'real_provider') return new RealProviderAdapter();
  
  return new DummyProvider(); 
};

exports.calculateAge = calculateAge;
exports.getProvider = getProvider;
exports.isAgeEligible = (dob, state, category) => {
    try {
        const age = calculateAge(dob);
        const minAge = getMinimumAlcoholAge({ state, productCategory: category });
        return age >= minAge;
    } catch(e) {
        return false;
    }
};
