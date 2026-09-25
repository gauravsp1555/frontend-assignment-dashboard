"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../utils/axios";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  thumbnail: string;
}

interface Category {
  slug: string;
  name: string;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // State for pagination, search, and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("");

  // State for Add, Edit, and Delete operations
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ title: "", category: "", price: 0, stock: 0 });
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const isMounted = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchCategories();
    const urlParams = new URLSearchParams(window.location.search);
    setCurrentPage(parseInt(urlParams.get("page") || "1", 10));
    setLimit(parseInt(urlParams.get("limit") || "10", 10));
    setSearchQuery(urlParams.get("search") || "");
    setSelectedCategory(urlParams.get("category") || "");
    setSortBy(urlParams.get("sortBy") || "");
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(currentPage, limit, searchQuery, selectedCategory, sortBy);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentPage, limit, selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/products/categories");
      if (res.data && res.data.length > 0) {
        const formattedCategories = typeof res.data[0] === 'string'
          ? res.data.map((c: string) => ({ slug: c, name: c })) : res.data;
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories");
    }
  };

  const fetchProducts = async (page: number, currentLimit: number, search: string, category: string, sort: string) => {
    setIsLoading(true);
    setError("");
    try {
      const skip = (page - 1) * currentLimit;
      let endpoint = "/products";
      if (search) endpoint = `/products/search?q=${search}`;
      else if (category) endpoint = `/products/category/${category}`;

      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint += `${separator}limit=${currentLimit}&skip=${skip}`;
      if (sort) {
        const [field, order] = sort.split('-');
        endpoint += `&sortBy=${field}&order=${order}`;
      }

      const res = await axiosInstance.get(endpoint);
      setProducts(res.data.products);
      setTotalItems(res.data.total);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", currentLimit.toString());
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (sort) params.set("sortBy", sort);
      router.replace(`/?${params.toString()}`);
    } catch (err) {
      setError("Failed to fetch products.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Add, Edit, Delete operations ---
  const handleOpenForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ title: product.title, category: product.category, price: product.price, stock: product.stock });
    } else {
      setEditingProduct(null);
      setFormData({ title: "", category: "", price: 0, stock: 0 });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // API call to edit product (Edit)
        const res = await axiosInstance.put(`/products/${editingProduct.id}`, formData);
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...res.data } : p));
      } else {
        // API call to add new product (Add)
        const res = await axiosInstance.post('/products/add', formData);
        setProducts([{ ...res.data, thumbnail: 'https://cdn.dummyjson.com/product-images/1/thumbnail.jpg', rating: 0 }, ...products]);
      }
      setIsFormOpen(false);
    } catch (error) {
      alert("Something went wrong while saving data!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      // API call to delete product (Delete)
      await axiosInstance.delete(`/products/${productToDelete}`);
      setProducts(products.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
    } catch (error) {
      alert("Failed to delete product!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToDetails = (id: number) => {
    router.push(`/products/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isLoading && products.length === 0 && !searchQuery && !selectedCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Products Dashboard</h1>
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={() => handleOpenForm()}
              className="flex-1 sm:flex-none px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm font-medium"
            >
              + Add Product
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(""); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 text-sm"
            />
            <div className="absolute left-3 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setSearchQuery(""); setCurrentPage(1); }}
              className="px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 text-sm bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat, idx) => <option key={idx} value={cat.slug}>{cat.name}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 text-sm bg-white"
            >
              <option value="">Sort by: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating: High to Low</option>
              <option value="title-asc">Title: A to Z</option>
            </select>
          </div>
        </div>

        {/* Main Products List */}
        {error ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center text-red-600">{error}</div>
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
              {isLoading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} onClick={() => navigateToDetails(product.id)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={product.thumbnail} alt={product.title} className="w-10 h-10 rounded-md object-cover" />
                        <span className="text-sm font-medium text-gray-900">{product.title}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${product.price}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.stock}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenForm(product); }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >Edit</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }}
                          className="text-red-600 hover:text-red-900"
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden relative">
              {isLoading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}
              {products.map((product) => (
                <div key={product.id} onClick={() => navigateToDetails(product.id)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer">
                  <div className="flex gap-4">
                    <img src={product.thumbnail} alt={product.title} className="w-20 h-20 rounded-md object-cover" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{product.title}</h3>
                      <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-bold text-gray-900">${product.price}</span>
                        <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">Stock: {product.stock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-4">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenForm(product); }} className="text-sm text-indigo-600 font-medium">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); setProductToDelete(product.id); }} className="text-sm text-red-600 font-medium">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-sm gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm text-gray-700">Per page:</label>
                <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded-md text-sm py-1.5 px-3 text-gray-900">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || isLoading} className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-900 border rounded-md disabled:opacity-50">Previous</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * limit >= totalItems || isLoading} className="flex-1 sm:flex-none px-4 py-2 text-sm text-gray-900 border rounded-md disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Modal for adding/editing product */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input required type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-2 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full p-2 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} className="w-full p-2 border rounded-md text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">{isSubmitting ? "Saving..." : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for deleting product */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-500 mb-6 text-sm">Are you sure you want to delete this product?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setProductToDelete(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
              <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">{isSubmitting ? "Deleting..." : "Yes, Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}