import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faTrash, faLock, faLockOpen, faFilter, faSync } from '@fortawesome/free-solid-svg-icons';
import { CommentResponse, CommentPageResponse } from '../../interfaces/models/comment';
import commentService from '../../services/comment-service';
import userService from '../../services/user-service';
import { formatDate } from '../../utils/date-utils';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination';
import { Link } from 'react-router-dom';
import { truncateText } from '../../utils/string-utils';

const CommentManagement: React.FC = () => {
  // State
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'manga', 'chapter', 'user'
  const [filterValue, setFilterValue] = useState<string>('');

  // Fetch comments
  const fetchComments = async (page: number = 0) => {
    setIsLoading(true);
    try {
      let response: CommentPageResponse | null = null;

      if (searchTerm) {
        // Tìm kiếm bình luận
        response = await commentService.searchComments(searchTerm, page, pageSize);
      } else {
        // Lấy tất cả bình luận
        response = await commentService.getAllComments(page, pageSize);
      }

      if (response) {
        setComments(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setCurrentPage(response.number);
      } else {
        toast.error('Không thể lấy danh sách bình luận', { position: 'top-right' });
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bình luận:', error);
      toast.error('Đã xảy ra lỗi khi lấy danh sách bình luận', { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch comments on mount and when search term changes
  useEffect(() => {
    fetchComments();
  }, [searchTerm, pageSize]);



  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComments();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    // Spring Data JPA uses 0-based page indexing, but UI uses 1-based
    fetchComments(page - 1);
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      const success = await commentService.deleteComment(commentId);
      if (success) {
        // Refresh comments
        fetchComments(currentPage);
      }
    }
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
    setFilterValue('');
  };

  // Handle filter value change
  const handleFilterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(e.target.value);
  };

  // Apply filter
  const applyFilter = () => {
    // Implement filter logic here
    // For now, just refresh the comments
    fetchComments();
  };

  // Xử lý khóa/mở khóa tài khoản người dùng
  const handleToggleUserStatus = async (username: string, userId: string) => {
    // Tìm comment của người dùng để lấy trạng thái hiện tại
    const comment = comments.find(c => c.userId === userId);
    if (!comment) return;

    // Kiểm tra trạng thái hiện tại của người dùng
    const isEnabled = comment.userEnabled !== false;
    const action = isEnabled ? "khóa" : "mở khóa";

    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản ${username}?`)) {
      try {
        // Gọi API để thay đổi trạng thái
        const updatedUser = await userService.toggleUserStatus(userId, !isEnabled);

        if (updatedUser) {
          // Cập nhật trạng thái trong tất cả các comment của người dùng này
          setComments(prevComments =>
            prevComments.map(c =>
              c.userId === userId
                ? {...c, userEnabled: !isEnabled}
                : c
            )
          );

          toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công`, { position: 'top-right' });
        }
      } catch (error) {
        console.error(`Lỗi khi ${action} tài khoản ${username}:`, error);
        toast.error(`Đã xảy ra lỗi khi ${action} tài khoản`, { position: 'top-right' });
      }
    }
  };

  // Reset filter
  const resetFilter = () => {
    setFilterType('all');
    setFilterValue('');
    setSearchTerm('');
    fetchComments();
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Quản lý bình luận</h1>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm bình luận..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-4 text-gray-600 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
        </form>

        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tất cả</option>
            <option value="manga">Theo truyện</option>
            <option value="chapter">Theo chapter</option>
            <option value="user">Theo người dùng</option>
          </select>

          {filterType !== 'all' && (
            <input
              type="text"
              placeholder={`ID ${filterType === 'manga' ? 'truyện' : filterType === 'chapter' ? 'chapter' : 'người dùng'}`}
              value={filterValue}
              onChange={handleFilterValueChange}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          )}

          <button
            onClick={applyFilter}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Lọc
          </button>

          <button
            onClick={resetFilter}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Đặt lại
          </button>
        </div>
      </div>

      {/* Comments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nội dung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Truyện
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Chapter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-500 mr-2" />
                  Đang tải...
                </td>
              </tr>
            ) : comments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Không có bình luận nào
                </td>
              </tr>
            ) : (
              comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {comment.userAvatarUrl && (
                        <img
                          src={"http://localhost:8888/api/v1/upload/files/"+comment.userAvatarUrl}
                          alt={comment.username}
                          className="h-8 w-8 rounded-full mr-2"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          {comment.displayName || comment.username}
                          <span
                            className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              comment.userEnabled !== false
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {comment.userEnabled !== false ? 'Hoạt động' : 'Bị khóa'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{comment.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {truncateText(comment.content, 100)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <Link
                        to={`/admin/mangas/${comment.mangaId}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                      >
                        {comment.mangaTitle || 'N/A'}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{comment.mangaId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <Link
                        to={`/admin/chapters/${comment.chapterId}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                      >
                        {comment.chapterTitle || `Chương ${comment.chapterNumber}` || 'N/A'}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{comment.chapterId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-4"
                      title="Xóa bình luận"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button
                      onClick={() => handleToggleUserStatus(comment.username, comment.userId)}
                      className={`${comment.userEnabled !== false ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'}`}
                      title={comment.userEnabled !== false ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      <FontAwesomeIcon icon={comment.userEnabled !== false ? faLock : faLockOpen} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage+1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
};

export default CommentManagement;
