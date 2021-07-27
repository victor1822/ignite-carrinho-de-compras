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

    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)

      const stock = await api.get<Stock>(`/stock/${productId}`)
      const stockAmount = stock.data?.amount ?? 0 

      const currentAmount = productExists ? productExists.amount : 0

      const amount = currentAmount + 1

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart))
      } else {
        const productResponse = await api.get(`products/${productId}`)

        const newProduct = {
          ...productResponse.data,
          amount: 1,
        }
        updatedCart.push(newProduct)

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart))
      }

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productIndex = updatedCart.findIndex(product => productId === product.id)

      if(productIndex >= 0) {
        updatedCart.splice(productIndex, 1)
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // if (amount <= 0) return
      // const stockResponse = await api.get(`http://localhost:3333/stock/${productId}`)
      // const { amount: stock }: Stock = stockResponse.data
      // const cartArr = [...cart]
      // const targetIndex = cartArr.findIndex(product => product.id === productId)
      // const removendo = cartArr[targetIndex].amount > amount
      // if (removendo) console.log('removendo')
      // else console.log('acrescentando')
      // if(removendo) {
      //   await api.put(`http://localhost:3333/stock/${productId}`, {id: productId, amount: stock + 1})
      //   cartArr[targetIndex] = {
      //     ...cartArr[targetIndex],
      //     amount
      //   }
      //   setCart(cartArr)
      //   localStorage.setItem('@RocketShoes:cart',JSON.stringify(cartArr))
      // } else {
      //   if (stock - 1 > 0) {
      //     cartArr[targetIndex] = {
      //       ...cartArr[targetIndex],
      //       amount,
      //     }
      //     await api.put(`http://localhost:3333/stock/${productId}`, {id: productId, amount: stock - 1})
      //     setCart(cartArr)
      //     localStorage.setItem('@RocketShoes:cart',JSON.stringify(cartArr))
      //   } else {
      //     toast.error('Quantidade solicitada fora de estoque');
      //   }
      // }
      if (amount <= 0) return

      const stock =  await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)

      if(productExists) {
        productExists.amount = amount
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
