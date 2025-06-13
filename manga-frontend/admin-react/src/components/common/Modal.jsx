import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef(null);

  // Xử lý đóng modal khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Ngăn scroll trên body khi modal mở
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cho phép scroll lại khi modal đóng
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Xử lý đóng modal khi nhấn ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Xác định kích thước modal
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-50 overflow-hidden">
      {/* Overlay với hiệu ứng blur */}
      <div className="absolute inset-0 backdrop-filter backdrop-blur-md"></div>
      {/* Container cho modal */}
      <div className="relative w-full h-full flex items-center justify-center p-4 overflow-y-auto">
        <div
          ref={modalRef}
          className={`${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl overflow-hidden max-h-[90vh]`}
        >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
          {children}
        </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
