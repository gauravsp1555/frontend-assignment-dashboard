"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/utils/axios";


interface Review {
    rating: number;
    comment: string;
    reviewerName: string;
}

interface ProductDetail {
    id: number;
    title: string;
    description: string;
    price: number;
    images: string[];
    reviews: Review[];
}

export default function ProductDetails() {
    const params = useParams();
    const router = useRouter();
    // Get id from URL
    const id = params.id;

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axiosInstance.get(`/products/${id}`);
                setProduct(res.data);
            } catch (err: any) {
                // Handle 404 error if product is not found
                if (err.response?.status === 404) {
                    setError("Product not found. The ID you entered is incorrect.");
                } else {
                    setError("Failed to fetch product details.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Not Found or Error state
    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-500 mb-6">{error || "Product not found."}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Go Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push("/")}
                    className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                >
                    &larr; Back to Dashboard
                </button>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="md:flex">
                        {/* Image Section */}
                        <div className="md:w-1/2 p-6 bg-gray-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200">
                            <img
                                src={product.images[0]}
                                alt={product.title}
                                className="max-h-96 object-contain"
                            />
                        </div>

                        {/* Details Section */}
                        <div className="md:w-1/2 p-6 md:p-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
                            <p className="text-3xl font-bold text-indigo-600 mb-4">${product.price}</p>

                            <div className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
                                <p>{product.description}</p>
                            </div>

                            {/* Reviews Section */}
                            <div className="border-t border-gray-200 pt-6 mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                                {product.reviews && product.reviews.length > 0 ? (
                                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                        {product.reviews.map((review, idx) => (
                                            <div key={idx} className="bg-gray-50 p-4 rounded-md border border-gray-100">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-900 text-sm">{review.reviewerName}</span>
                                                    <span className="text-yellow-500 text-sm">★ {review.rating}</span>
                                                </div>
                                                <p className="text-gray-600 text-sm">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No reviews yet.</p>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}