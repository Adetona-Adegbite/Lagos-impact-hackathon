import { useState, useMemo, useCallback } from 'react';
import { Cart, CartItem } from '@/types/cart';

export const useCarts = (initialMode: 'sell' | 'stock' = 'sell') => {
  const [carts, setCarts] = useState<Cart[]>([
    { id: Math.random().toString(36).substring(7), items: [] },
    { id: 'inventory', items: [] },
  ]);

  const [activeCartId, setActiveCartId] = useState<string>(
    initialMode === 'stock' ? 'inventory' : carts[0].id
  );

  const activeCart = useMemo(
    () => carts.find((c) => c.id === activeCartId) || carts[0],
    [carts, activeCartId]
  );

  const activeCartItems = activeCart.items;

  // Helper to update items of the active cart
  const setActiveCartItems = useCallback(
    (newItems: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
      setCarts((prevCarts) =>
        prevCarts.map((c) => {
          if (c.id !== activeCartId) return c;
          return {
            ...c,
            items: typeof newItems === 'function' ? newItems(c.items) : newItems,
          };
        })
      );
    },
    [activeCartId]
  );

  const addNewCart = useCallback(() => {
    const newId = Math.random().toString(36).substring(7);
    setCarts((prev) => [...prev, { id: newId, items: [] }]);
    setActiveCartId(newId);
  }, []);

  const removeCart = useCallback(
    (id: string) => {
      if (id === 'inventory') return;

      const salesCarts = carts.filter((c) => c.id !== 'inventory');
      if (salesCarts.length <= 1) {
        // If it's the last sales cart, just clear it instead of removing
        setCarts((prev) => prev.map((c) => (c.id === id ? { ...c, items: [] } : c)));
        return;
      }

      const newCarts = carts.filter((c) => c.id !== id);
      setCarts(newCarts);

      if (activeCartId === id) {
        const remainingSales = newCarts.filter((c) => c.id !== 'inventory');
        if (remainingSales.length > 0) {
          setActiveCartId(remainingSales[remainingSales.length - 1].id);
        } else {
          setActiveCartId('inventory');
        }
      }
    },
    [carts, activeCartId]
  );

  const changeCartQty = useCallback(
    (itemId: string, delta: number) => {
      setActiveCartItems((prev) =>
        prev
          .map((it) => (it.id === itemId ? { ...it, qty: Math.max(0, it.qty + delta) } : it))
          .filter((it) => it.qty > 0)
      );
    },
    [setActiveCartItems]
  );

  const clearActiveCart = useCallback(() => {
    setActiveCartItems([]);
  }, [setActiveCartItems]);

  return {
    carts,
    setCarts,
    activeCartId,
    setActiveCartId,
    activeCart,
    activeCartItems,
    setActiveCartItems,
    addNewCart,
    removeCart,
    changeCartQty,
    clearActiveCart,
  };
};
