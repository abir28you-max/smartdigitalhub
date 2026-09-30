export const sortProductsByStock = <T extends { stock_status?: string | null }>(products: T[]): T[] => {
  return [...products].sort((a, b) => {
    const aInStock = a.stock_status === "in_stock" ? 1 : 0;
    const bInStock = b.stock_status === "in_stock" ? 1 : 0;
    return bInStock - aInStock;
  });
};
