"use client";

import { Clothing } from "../app/types";
import { useState } from "react";

interface ItemDetailsModalProps {
  item: Clothing | null;
  isOpen: boolean;
  onClose: () => void;
  onItemDeleted: (deletedItemId: number) => void;
}

export default function ItemDetailsModal({ item, isOpen, onClose, onItemDeleted }: ItemDetailsModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen || !item) return null;

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "top": return "👕";
      case "bottom": return "👖";
      case "shoes": return "👟";
      case "accessory": return "🕶️";
      default: return "👕";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/wardrobe/${item.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        console.log("Item deleted successfully");
        onItemDeleted(item.id);
        setShowDeleteConfirm(false);
        onClose();
      } else {
        const errorData = await res.json();
        console.error("Delete error:", errorData);
        showMessage("error", "Error deleting item: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Network error:", error);
      showMessage("error", "Network error - please try again");
    } finally {
      setDeleteLoading(false);
    }
  };

  const mainImage = item.images && item.images.length > 0 ? item.images[0] : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Message Display */}
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-60 ${
          message.type === "success" 
            ? "bg-green-100 border border-green-400 text-green-700" 
            : "bg-red-100 border border-red-400 text-red-700"
        } px-6 py-3 rounded-2xl shadow-lg max-w-md w-full mx-4 flex items-center justify-between`}>
          <span className="flex-1 text-center text-sm font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Item</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">"{item.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className="flex-1 bg-white text-gray-900 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all duration-200 border border-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-700 transition-all duration-200 border border-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Item Details Modal */}
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Image Section */}
          <div className="md:w-1/2 bg-gray-100 p-6">
            {/* Main Image Display */}
            <div className="w-full h-64 bg-white rounded-2xl overflow-hidden flex items-center justify-center mb-4">
              {mainImage ? (
                <img 
                  src={mainImage.url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <span className="text-6xl">{getCategoryIcon(item.category)}</span>
                  <p className="text-gray-500 mt-2">No image available</p>
                </div>
              )}
            </div>

            {/* Image Thumbnails - Show if there are multiple images */}
            {item.images && item.images.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {item.images.map((image, index) => (
                  <div key={image.id} className="aspect-square bg-white rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-300 transition-all duration-200">
                    <img 
                      src={image.url} 
                      alt={`${item.name} view ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Image Counter */}
            {item.images && item.images.length > 0 && (
              <p className="text-center text-sm text-gray-500 mt-3">
                {item.images.length} photo{item.images.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-light text-gray-900 mb-2">{item.name}</h2>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                  <span className="text-lg">{getCategoryIcon(item.category)}</span>
                  {item.category}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {item.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Item Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="text-gray-900">{item.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Photos</span>
                    <span className="text-gray-900">
                      {item.images ? item.images.length : 0} 
                      {item.images && item.images.length === 1 ? ' photo' : ' photos'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Added</span>
                    <span className="text-gray-900">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-white text-gray-900 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all duration-200 border border-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-700 transition-all duration-200 border border-red-600 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}