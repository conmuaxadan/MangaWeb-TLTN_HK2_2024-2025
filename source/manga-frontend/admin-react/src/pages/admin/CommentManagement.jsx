import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTrash, faLock, faLockOpen, faSync } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../../utils/date-utils.js';
import Pagination from '../../components/common/Pagination.jsx';
import { Link } from 'react-router-dom';
import { truncateText } from '../../utils/string-utils.js';
import { useCommentManagement } from '../../hooks/useCommentManagement.js';
import BlockUserModal from '../../components/admin/BlockUserModal.jsx';

const CommentManagement = () => {
  // Block user modal state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);

  // Sử dụng custom hook
  const {
    comments,
    isLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    setPageSize,
    showingFrom,
    showingTo,
    handlePageChange,
    handleDeleteComment,
    handleToggleUserStatus,
    resetSearch
  } = useCommentManagement();

  // Handle toggle user status with modal for blocking
  const handleToggleUserStatusWithModal = async (username, userId) => {
    // Tìm comment của người dùng để lấy trạng thái hiện tại
    const comment = comments.find(c => c.userId === userId);
    if (!comment) return;

    const isEnabled = comment.userEnabled !== false;

    if (isEnabled) {
      // Khóa tài khoản - hiển thị modal để nhập lý do
      setUserToBlock({ username, userId });
      setIsBlockModalOpen(true);
    } else {
      // Mở khóa tài khoản - thực hiện trực tiếp
      if (window.confirm(`Bạn có chắc chắn muốn mở khóa tài khoản ${username}?`)) {
        await handleToggleUserStatus(username, userId);
      }
    }
  };

  // Handle block user with reason
  const handleBlockUser = async (reason) => {
    if (!userToBlock) return;

    // Gọi API với reason - useCommentManagement sẽ cần cập nhật để nhận reason
    await handleToggleUserStatus(userToBlock.username, userToBlock.userId, reason);

    setIsBlockModalOpen(false);
    setUserToBlock(null);
  };

  // Handle close block modal
  const handleCloseBlockModal = () => {
    setIsBlockModalOpen(false);
    setUserToBlock(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý bình luận</h1>
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
            </div>
            <input
              type="text"
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Tìm kiếm bình luận..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={resetSearch}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Đặt lại
          </button>
        </div>
      </div>

      {/* Bảng bình luận */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
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
            {comments.length === 0 ? (
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
                      onClick={() => handleToggleUserStatusWithModal(comment.username, comment.userId)}
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
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage + 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalElements}
          showingFrom={showingFrom}
          showingTo={showingTo}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Modal khóa tài khoản */}
      <BlockUserModal
        isOpen={isBlockModalOpen}
        onClose={handleCloseBlockModal}
        onConfirm={handleBlockUser}
        username={userToBlock?.username || ''}
        isLoading={false}
      />
    </div>
  );
};

export default CommentManagement;
