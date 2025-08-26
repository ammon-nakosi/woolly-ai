import { getConfig } from './config';

/**
 * Get the user's email from counsel config
 * User must explicitly set this in ~/.counsel/config.json
 */
export const getUserEmail = async (): Promise<string | null> => {
  const config = await getConfig();
  
  // Only return what user explicitly configured
  return config.linear?.userEmail || null;
};

/**
 * Get the user's name from counsel config
 * User must explicitly set this in ~/.counsel/config.json
 */
export const getUserName = async (): Promise<string | null> => {
  const config = await getConfig();
  
  // Only return what user explicitly configured
  return config.git?.userName || null;
};