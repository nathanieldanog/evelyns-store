import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { initialProducts } from '../data/products.js';
import { supabase } from '../lib/supabase';

const ProductContext = createContext(null);

const PRODUCT_STORAGE_KEY = 'evelyns-store-products';

function createProductId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random()}`
  );
}

function normalizeProduct(product) {
  const hasOldPrice =
    product.oldPrice !== null &&
    product.oldPrice !== undefined &&
    product.oldPrice !== '';

  return {
    ...product,
    name: String(product.name || '').trim(),
    category: String(product.category || 'Other').trim(),
    price: Math.max(0, Number(product.price) || 0),
    oldPrice: hasOldPrice
      ? Math.max(0, Number(product.oldPrice) || 0)
      : null,
    stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
    badge: String(product.badge || '').trim(),
  };
}

function getInitialProducts() {
  try {
    const savedProducts = localStorage.getItem(
      PRODUCT_STORAGE_KEY,
    );

    if (savedProducts) {
      const parsedProducts = JSON.parse(savedProducts);

      if (Array.isArray(parsedProducts)) {
        return parsedProducts.map(normalizeProduct);
      }
    }
  } catch (error) {
    console.error('Unable to load saved products:', error);
  }

  return initialProducts.map((product) => ({
    ...product,
  }));
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id");

    if (error) {
      console.error("Failed to load products:", error);
      return;
    }

    const formattedProducts = (data || []).map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      oldPrice: product.old_price,
      stock: product.stock,
      image: product.image,
      badge: product.badge,
    }));

    setProducts(formattedProducts);
  }

  useEffect(() => {
    loadProducts();
  }, []);
  /*
  useEffect(() => {
    localStorage.setItem(
      PRODUCT_STORAGE_KEY,
      JSON.stringify(products),
    );
  }, [products]);
  */

  async function addProduct(product) {
    const newProduct = normalizeProduct(product);

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        old_price: newProduct.oldPrice,
        stock: newProduct.stock,
        image: newProduct.image,
        badge: newProduct.badge,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add product:", error);
      return;
    }

    setProducts((currentProducts) => [
      {
        id: data.id,
        name: data.name,
        category: data.category,
        price: Number(data.price),
        oldPrice: data.old_price,
        stock: data.stock,
        image: data.image,
        badge: data.badge,
      },
      ...currentProducts,
    ]);
  }

  async function updateProduct(productId, changes) {
    const updatedProduct = normalizeProduct(changes);

    const { data, error } = await supabase
      .from("products")
      .update({
        name: updatedProduct.name,
        category: updatedProduct.category,
        price: updatedProduct.price,
        old_price: updatedProduct.oldPrice,
        stock: updatedProduct.stock,
        image: updatedProduct.image,
        badge: updatedProduct.badge,
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update product:", error);
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
            id: data.id,
            name: data.name,
            category: data.category,
            price: Number(data.price),
            oldPrice: data.old_price,
            stock: data.stock,
            image: data.image,
            badge: data.badge,
          }
          : product
      )
    );
  }

  async function deleteProduct(productId) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Failed to delete product:", error);
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.filter(
        (product) => product.id !== productId
      )
    );
  }
  function resetProducts() {
    setProducts(
      initialProducts.map((product) => ({
        ...product,
      })),
    );
  }

  const value = useMemo(
    () => ({
      products,
      loadProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      resetProducts,
    }),
    [products],
  );

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      'useProducts must be used inside ProductProvider.',
    );
  }

  return context;
}