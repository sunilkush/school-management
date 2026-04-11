let accessTokenInMemory = null;

export const getAccessToken = () => accessTokenInMemory;
export const setAccessToken = (token) => {
  accessTokenInMemory = token || null;
};
export const clearAccessToken = () => {
  accessTokenInMemory = null;
};
