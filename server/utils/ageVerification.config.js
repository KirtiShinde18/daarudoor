// Age Verification Configuration

module.exports = {
  // Configurable minimum age (e.g., 21 for Maharashtra, 18 for some others, 25 for some)
  // This could be dynamic based on user location and product category.
  getMinimumAlcoholAge: ({ state, productCategory }) => {
    // Basic implementation, can be extended for dynamic state-based logic
    // Defaulting to 21 for this example
    const DEFAULT_MIN_AGE = 21;
    
    // Example: if (state === 'Maharashtra') return 21;
    // Example: if (state === 'Goa') return 18;
    
    return DEFAULT_MIN_AGE;
  },
  
  // List of states where delivery is allowed
  allowedStates: ["Maharashtra", "Goa", "Delhi", "Karnataka"],
  
  // Provider configuration (could come from ENV)
  // DO NOT HARDCODE SECRETS HERE. Let DevOps set ENV vars.
  provider: process.env.AGE_VERIFICATION_PROVIDER || "dummy", 
  
  // Is verification globally required?
  verificationRequired: true,
  deliveryVerificationRequired: true,
};
