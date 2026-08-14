// Navigation utility to preserve user's intended destination
export const getIntendedDestination = (defaultPath = "/dashboard"): string => {
  // Check if there&apos;s a stored intended destination
  const stored = sessionStorage.getItem("intendedDestination");
  if (
    stored &&
    stored !== "/login" &&
    stored !== "/signup" &&
    stored !== "/subscribe" &&
    stored !== "/"
  ) {
    sessionStorage.removeItem("intendedDestination");
    return stored;
  }
  return defaultPath;
};

export const setIntendedDestination = (path: string): void => {
  // Don&apos;t store auth pages as intended destinations
  const authPages = ["/login", "/signup", "/subscribe", "/"];
  if (!authPages.includes(path)) {
    sessionStorage.setItem("intendedDestination", path);
  }
};
