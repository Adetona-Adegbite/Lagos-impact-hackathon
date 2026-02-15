export type CartItem = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
  image?: string | null;
  productId: string;
};

export type Cart = {
  id: string;
  items: CartItem[];
};
