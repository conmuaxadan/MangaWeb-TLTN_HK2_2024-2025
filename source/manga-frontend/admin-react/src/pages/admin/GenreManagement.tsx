import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { GenreResponse } from '../../interfaces/models/genre';
import genreService from '../../services/genre-service';

const GenreManagement: React.FC = () => {
  // State cho danh sách thể loại
  const [genres, setGenres] = useState<GenreResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State cho chỉnh sửa
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // State cho thêm mới
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Xử lý tìm kiếm (danh sách đã được sắp xếp theo bảng chữ cái từ API)
  const filteredGenres = genres.filter(genre =>
    genre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (genre.description && genre.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Load danh sách thể loại
  useEffect(() => {
    fetchGenres();
  }, []);

  // Hàm lấy danh sách thể loại
  const fetchGenres = async () => {
    setIsLoading(true);
    try {
      const response = await genreService.getAllGenres();
      if (response) {
        setGenres(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thể loại:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý xóa thể loại
  const handleDeleteGenre = async (name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa thể loại "${name}"?`)) {
      try {
        const success = await genreService.deleteGenre(name);
        if (success) {
          setGenres(genres.filter(genre => genre.name !== name));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa thể loại ${name}:`, error);
      }
    }
  };

  // Xử lý bắt đầu chỉnh sửa
  const handleStartEdit = (genre: GenreResponse) => {
    setEditMode(genre.name);
    setEditName(genre.name);
    setEditDescription(genre.description || '');
  };

  // Xử lý lưu chỉnh sửa
  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      alert('Tên thể loại không được để trống');
      return;
    }

    if (editMode) {
      try {
        const response = await genreService.updateGenre(editMode, { name: editName });
        if (response) {
          setGenres(
            genres.map(genre =>
              genre.name === editMode
                ? response
                : genre
            )
          );
          setEditMode(null);
        }
      } catch (error) {
        console.error(`Lỗi khi cập nhật thể loại ${editMode}:`, error);
      }
    }
  };

  // Xử lý hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditMode(null);
  };

  // Xử lý thêm thể loại mới
  const handleAddGenre = async () => {
    if (!newName.trim()) {
      alert('Tên thể loại không được để trống');
      return;
    }

    if (genres.some(genre => genre.name.toLowerCase() === newName.toLowerCase())) {
      alert('Thể loại này đã tồn tại');
      return;
    }

    try {
      const response = await genreService.createGenre({ name: newName });
      if (response) {
        setGenres([...genres, response]);
        setNewName('');
        setNewDescription('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Lỗi khi tạo thể loại mới:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý thể loại</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          onClick={() => setShowAddForm(true)}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm thể loại</span>
        </button>
      </div>

      {/* Form thêm thể loại mới */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thêm thể loại mới</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="newName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên thể loại
              </label>
              <input
                type="text"
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Nhập tên thể loại"
              />
            </div>
            <div>
              <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mô tả
              </label>
              <textarea
                id="newDescription"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Nhập mô tả thể loại"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddGenre}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tìm kiếm */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Tìm kiếm thể loại"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng thể loại */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tên thể loại
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mô tả
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGenres.map((genre) => (
                <tr key={genre.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {editMode === genre.name ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={2}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                        >
                          <FontAwesomeIcon icon={faSave} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {genre.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {genre.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleStartEdit(genre)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteGenre(genre.name)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredGenres.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Không tìm thấy thể loại nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};

export default GenreManagement;
