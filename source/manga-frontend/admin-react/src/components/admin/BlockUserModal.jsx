import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faTimes } from '@fortawesome/free-solid-svg-icons';
import Modal from '../common/Modal.jsx';

const BlockUserModal = ({
  isOpen,
  onClose,
  onConfirm,
  username,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Predefined reasons
  const predefinedReasons = [
    'Vi phạm quy định cộng đồng',
    'Spam hoặc nội dung rác',
    'Ngôn từ không phù hợp',
    'Đăng nội dung không phù hợp',
    'Hành vi quấy rối'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Vui lòng nhập lý do khóa tài khoản');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Lý do phải có ít nhất 10 ký tự');
      return;
    }

    setError('');
    onConfirm(reason.trim());
  };

  const handleReasonSelect = (selectedReason) => {
    setReason(selectedReason);
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Khóa tài khoản"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User info */}
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <FontAwesomeIcon icon={faLock} className="text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Bạn đang thực hiện khóa tài khoản
            </p>
            <p className="text-sm text-red-600 dark:text-red-300">
              <strong>{username}</strong>
            </p>
          </div>
        </div>

        {/* Predefined reasons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Chọn lý do khóa:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {predefinedReasons.map((predefinedReason) => (
              <button
                key={predefinedReason}
                type="button"
                onClick={() => handleReasonSelect(predefinedReason)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  reason === predefinedReason
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {predefinedReason}
              </button>
            ))}
          </div>
        </div>

        {/* Custom reason input */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hoặc nhập lý do cụ thể:
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="Nhập lý do khóa tài khoản (tối thiểu 10 ký tự)..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            disabled={isLoading}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {reason.length}/500 ký tự
          </p>
        </div>

        {/* Warning */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Lưu ý:</strong> Người dùng sẽ nhận được thông báo về việc bị khóa tài khoản cùng với lý do này.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faLock} />
                Khóa tài khoản
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BlockUserModal;
