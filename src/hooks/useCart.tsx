import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const currentCartToUpdate = [...cart];
      const productExists = currentCartToUpdate.find(
        (product) => product.id === productId
      );

      const stock = await api.get<Stock>(`stock/${productId}`);

      const productAmountInStock = stock.data.amount;
      const currentProductAmount = productExists ? productExists.amount : 0;
      const newProductCartAmount = currentProductAmount + 1;

      if (newProductCartAmount > productAmountInStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = newProductCartAmount;
      } else {
        const product = await api.get<Product>(`/products/${productId}`);

        const productToAdd = { ...product.data, amount: 1 };
        currentCartToUpdate.push(productToAdd);
      }

      setCart(currentCartToUpdate);
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(currentCartToUpdate)
      );
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const currentCartToUpdate = [...cart];
      const productIndexToRemove = currentCartToUpdate.findIndex(
        (product) => product.id === productId
      );

      console.log(productIndexToRemove);

      if (productIndexToRemove >= 0) {
        currentCartToUpdate.splice(productIndexToRemove, 1);
        console.log(currentCartToUpdate)
        setCart(currentCartToUpdate);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(currentCartToUpdate));
        return;
      } else {
        throw Error('Produto não existe');
      }
    } catch(err: Error | any) {
      err ? toast.error(err) : toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
