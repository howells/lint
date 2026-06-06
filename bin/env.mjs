/* oxlint-disable no-restricted-properties -- CLI wrappers intentionally pass the caller environment to child processes. */

export const inheritedEnv = () => process.env;
