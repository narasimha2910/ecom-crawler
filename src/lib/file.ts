export const getFileName = (keyword: string, siteName: string): string => {
  const safeKeyword = keyword.replace(/[\/\\?%*:|"<>]/g, "_");
  const safeSiteName = siteName.replace(/[\/\\?%*:|"<>]/g, "_");
  return `${safeSiteName}_${safeKeyword}_products.csv`;
};
