import { useState, useCallback, useEffect } from 'react';
import { productService } from '@/services/productService';
import { ProductFormData } from '@/components/ProductFormModal';
import { Product } from '@/services/database';

export const useProductManagement = () => {
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<
    (Partial<ProductFormData> & { id?: string }) | null
  >(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [enterModalVisible, setEnterModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [searchResults, setSearchResults] = useState<(Product & { quantity: number })[]>([]);

  useEffect(() => {
    if (enteredCode.trim().length > 0) {
      productService.searchProducts(enteredCode.trim()).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [enteredCode]);

  const fetchCategories = useCallback(async () => {
    try {
      const fetchedCategories = await productService.getCategories();
      setCategories(fetchedCategories);
    } catch (e) {
      console.error('Failed to fetch categories', e);
    }
  }, []);

  const handleRecommendCategory = useCallback(async (name: string) => {
    try {
      const res = await productService.recommendCategory(name);
      return res;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, []);

  return {
    productModalVisible,
    setProductModalVisible,
    currentProduct,
    setCurrentProduct,
    isNewProduct,
    setIsNewProduct,
    categories,
    setCategories,
    fetchCategories,
    handleRecommendCategory,
    enterModalVisible,
    setEnterModalVisible,
    enteredCode,
    setEnteredCode,
    searchResults,
    setSearchResults,
  };
};
