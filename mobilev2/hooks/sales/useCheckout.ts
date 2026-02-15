import { Alert } from 'react-native';
import { Dispatch, SetStateAction } from 'react';
import { productService } from '@/services/productService';
import { Cart, CartItem } from '@/types/cart';

type UseCheckoutProps = {
  cart: CartItem[];
  totalAmount: number;
  activeCartId: string;
  setCarts: Dispatch<SetStateAction<Cart[]>>;
  setIsScannerPaused: (paused: boolean) => void;
  setLoading: (loading: boolean) => void;
};

export const useCheckout = ({
  cart,
  totalAmount,
  activeCartId,
  setCarts,
  setIsScannerPaused,
  setLoading,
}: UseCheckoutProps) => {
  const onCheckout = async () => {
    if (cart.length === 0) return;

    setIsScannerPaused(true);
    Alert.alert(
      'Checkout',
      `Total: ₦${totalAmount.toLocaleString()}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsScannerPaused(false),
        },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              setLoading(true);
              const itemsToProcess = cart.map((item) => ({
                productId: item.productId,
                quantity: item.qty,
                price: item.unitPrice,
              }));
              await productService.processSale(itemsToProcess);

              setCarts((prevCarts) =>
                prevCarts.map((c) => {
                  if (c.id === activeCartId) {
                    return { ...c, items: [] };
                  }
                  if (c.id === 'inventory') {
                    return {
                      ...c,
                      items: c.items.map((invItem) => {
                        const soldItem = itemsToProcess.find(
                          (sold) => sold.productId === invItem.productId
                        );
                        if (soldItem) {
                          return {
                            ...invItem,
                            qty: Math.max(0, invItem.qty - soldItem.quantity),
                          };
                        }
                        return invItem;
                      }),
                    };
                  }
                  return c;
                })
              );

              Alert.alert(
                'Success',
                'Sale recorded successfully!',
                [{ text: 'OK', onPress: () => setIsScannerPaused(false) }],
                { onDismiss: () => setIsScannerPaused(false) }
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to process sale.',
                [{ text: 'OK', onPress: () => setIsScannerPaused(false) }],
                { onDismiss: () => setIsScannerPaused(false) }
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { onDismiss: () => setIsScannerPaused(false) }
    );
  };

  return { onCheckout };
};
