// Feature flags for enabling/disabling functionality
// This allows us to easily toggle features during development and testing

/*
🎛️  EASY TOGGLES FOR CONTEST SYSTEM:

✅ CURRENT: Allow all users (including anonymous) to contest cards
   ALLOW_ANONYMOUS_CONTESTS: true
   REQUIRE_LOGIN_FOR_CONTESTS: false

🔒 TO REQUIRE LOGIN: Change to these values
   ALLOW_ANONYMOUS_CONTESTS: false  
   REQUIRE_LOGIN_FOR_CONTESTS: true

Just restart the dev server after changing these values!
*/

export const FEATURE_FLAGS = {
  // Contest system - enabled for testing
  CONTEST_SYSTEM_ENABLED: true,
  
  // Voting system - enabled for testing  
  VOTING_SYSTEM_ENABLED: true,
  
  // Contest permissions (EASY TOGGLES!)
  ALLOW_ANONYMOUS_CONTESTS: true, // ← Change this to false to require login
  REQUIRE_LOGIN_FOR_CONTESTS: false, // ← Change this to true to block anonymous users
  
  // Other features
  REFERENCES_ENABLED: true,
  WORKSPACE_ENABLED: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURE_FLAGS[feature];
}