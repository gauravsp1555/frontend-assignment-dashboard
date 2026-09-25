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

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const isMounted = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = parseInt(urlParams.get("page") || "1", 10);
    const limitFromUrl = parseInt(urlParams.get("limit") || "10", 10);
    const searchFromUrl = urlParams.get("search") || "";

    setCurrentPage(pageFromUrl);
    setLimit(limitFromUrl);
    setSearchQuery(searchFromUrl);

    fetchProducts(pageFromUrl, limitFromUrl, searchFromUrl);
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;

    const delayDebounceFn = setTimeout(() => {
      fetchProducts(currentPage, limit, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentPage, limit]);

  const fetchProducts = async (page: number, currentLimit: number, search: string) => {
    setIsLoading(true);
    setError("");

    try {
      const skip = (page - 1) * currentLimit;

      const endpoint = search
        ? `/products/search?q=${search}&limit=${currentLimit}&skip=${skip}`
        : `/products?limit=${currentLimit}&skip=${skip}`;

      const res = await axiosInstance.get(endpoint);

      setProducts(res.data.products);
      setTotalItems(res.data.total);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", currentLimit.toString());
      if (search) params.set("search", search);

      router.replace(`/?${params.toString()}`);
    } catch (err) {
      setError("Failed to fetch products.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  if (isLoading && products.length === 0 && !searchQuery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Products Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}

              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchProducts(currentPage, limit, searchQuery)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center text-gray-900 font-medium">
            No products found matching "{searchQuery}".
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              )}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                        <img src={product.thumbnail} alt={product.title} className="w-10 h-10 rounded-md object-cover" />
                        <span className="text-sm font-medium text-gray-900">{product.title}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.rating}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              )}
              {products.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
                  <img src={product.thumbnail} alt={product.title} className="w-20 h-20 rounded-md object-cover" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{product.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-bold text-gray-900">${product.price}</span>
                      <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-sm gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                  <label htmlFor="limit" className="text-sm font-medium text-gray-700">Per page:</label>
                  <select
                    id="limit"
                    value={limit}
                    onChange={handleLimitChange}

                    className="border border-gray-300 rounded-md text-sm py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <p className="text-sm text-gray-900 hidden sm:block">
                  Showing <span className="font-medium">{totalItems === 0 ? 0 : ((currentPage - 1) * limit) + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * limit, totalItems)}</span> of{" "}
                  <span className="font-medium">{totalItems}</span>
                </p>
              </div>

              <div className="flex justify-between w-full sm:w-auto gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage * limit >= totalItems || isLoading}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}