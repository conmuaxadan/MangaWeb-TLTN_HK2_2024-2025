import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    onPageChange
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-8">
            <ul className="flex justify-center items-center space-x-2" role="navigation" aria-label="Pagination">
                {/* Nút Previous */}
                <li>
                    {currentPage > 0 ? (
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white transition-colors duration-200"
                            aria-label="Previous page"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                    ) : (
                        <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-400 cursor-not-allowed">
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </span>
                    )}
                </li>

                {/* Trang đầu */}
                {currentPage > 2 && (
                    <li>
                        <button
                            onClick={() => onPageChange(0)}
                            className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white transition-colors duration-200"
                            aria-label="Page 1"
                        >
                            1
                        </button>
                    </li>
                )}

                {/* Dấu ... đầu */}
                {currentPage > 3 && (
                    <li>
                        <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700">
                            ...
                        </span>
                    </li>
                )}

                {/* Trang trước */}
                {currentPage > 0 && (
                    <li>
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white transition-colors duration-200"
                            aria-label={`Page ${currentPage}`}
                        >
                            {currentPage}
                        </button>
                    </li>
                )}

                {/* Trang hiện tại */}
                <li>
                    <span 
                        className="flex items-center justify-center w-10 h-10 rounded-md bg-purple-600 text-gray-50 font-medium" 
                        aria-current="page"
                    >
                        {currentPage + 1}
                    </span>
                </li>

                {/* Trang sau */}
                {currentPage < totalPages - 1 && (
                    <li>
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white transition-colors duration-200"
                            aria-label={`Page ${currentPage + 2}`}
                        >
                            {currentPage + 2}
                        </button>
                    </li>
                )}

                {/* Dấu ... cuối */}
                {currentPage < totalPages - 4 && (
                    <li>
                        <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700">
                            ...
                        </span>
                    </li>
                )}

                {/* Trang cuối */}
                {currentPage < totalPages - 3 && (
                    <li>
                        <button
                            onClick={() => onPageChange(totalPages - 1)}
                            className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white transition-colors duration-200"
                            aria-label={`Page ${totalPages}`}
                        >
                            {totalPages}
                        </button>
                    </li>
                )}

                {/* Nút Next */}
                <li>
                    {currentPage < totalPages - 1 ? (
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700 hover:bg-purple-500 hover:text-white transition-colors duration-200"
                            aria-label="Next page"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    ) : (
                        <span className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-400 cursor-not-allowed">
                            <FontAwesomeIcon icon={faChevronRight} />
                        </span>
                    )}
                </li>
            </ul>

            {/* Thông tin trang */}
            <div className="text-center text-sm text-gray-500 mt-4">
                Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng số {totalElements} truyện
            </div>
        </div>
    );
};

export default Pagination;
