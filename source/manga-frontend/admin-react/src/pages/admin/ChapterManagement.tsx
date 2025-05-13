import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter, faEye, faImages } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { ChapterResponse, MangaResponse } from '../../interfaces/models/manga';
import mangaService from '../../services/manga-service';
import ChapterForm from '../../components/admin/ChapterForm';

const ChapterManagement: React.FC = () => {
  // State cho danh sách chapter
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableMangas, setAvailableMangas] = useState<MangaResponse[]>([]);

  // State cho form thêm/sửa chapter
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingChapter, setEditingChapter] = useState<ChapterResponse | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dữ liệu mẫu tạm thời (sẽ bỏ đi sau khi kết nối API)
  const sampleChapters = [
    {
      id: '1',
      chapterNumber: 1,
      title: 'Chapter 1: Khởi đầu',
      views: 5000,
      pages: [{ index: 0, pageUrl: '/images/chapters/1/1.jpg' }, { index: 1, pageUrl: '/images/chapters/1/2.jpg' }],
      mangaId: '1',
      updatedAt: '2023-05-01T10:00:00Z'
    },
    {
      id: '3',
      chapterNumber: 3,
      title: 'Chapter 3: Gặp gỡ đồng đội',
      views: 4000,
      pages: [{ index: 0, pageUrl: '/images/chapters/3/1.jpg' }, { index: 1, pageUrl: '/images/chapters/3/2.jpg' }],
      mangaId: '1',
      updatedAt: '2023-05-03T10:00:00Z'
    },
    {
      id: '4',
      chapterNumber: 1,
      title: 'Chapter 1: Bắt đầu',
      views: 4800,
      pages: [{ index: 0, pageUrl: '/images/chapters/4/1.jpg' }, { index: 1, pageUrl: '/images/chapters/4/2.jpg' }],
      mangaId: '2',
      updatedAt: '2023-04-15T10:00:00Z'
    },
    {
      id: '5',
      chapterNumber: 2,
      title: 'Chapter 2: Học viện',
      views: 4200,
      pages: [{ index: 0, pageUrl: '/images/chapters/5/1.jpg' }, { index: 1, pageUrl: '/images/chapters/5/2.jpg' }],
      mangaId: '2',
      updatedAt: '2023-04-16T10:00:00Z'
    },
  ];



  // Dữ liệu mẫu cho danh sách manga
  const mangaList = [
    { id: '1', title: 'One Piece' },
    { id: '2', title: 'Naruto' },
    { id: '3', title: 'Bleach' },
    { id: '4', title: 'Dragon Ball' },
    { id: '5', title: 'Attack on Titan' },
  ];

  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterManga, setFilterManga] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load danh sách chapter và manga khi component mount
  useEffect(() => {
    fetchChapters();
    fetchMangas();
  }, []);

  // Hàm lấy danh sách chapter
  const fetchChapters = async () => {
    setIsLoading(true);
    try {
      console.log('Bắt đầu gọi API lấy danh sách chapter');

      // Thử phương pháp 1: Gọi trực tiếp API /chapters
      let response = await mangaService.getAllChapters();
      console.log('Kết quả API lấy danh sách chapter (phương pháp 1):', response);

      // Nếu phương pháp 1 không thành công, thử phương pháp 2
      if (!response || response.length === 0) {
        console.log('Thử phương pháp thay thế để lấy danh sách chapter');
        response = await mangaService.getAllChaptersAlternative();
        console.log('Kết quả API lấy danh sách chapter (phương pháp 2):', response);
      }

      if (response && response.length > 0) {
        console.log('Có dữ liệu từ API, số lượng chapter:', response.length);
        setChapters(response);
      } else {
        // Nếu không có dữ liệu từ cả hai phương pháp, sử dụng dữ liệu mẫu
        console.log('Không có dữ liệu từ API, sử dụng dữ liệu mẫu');
        setChapters(sampleChapters);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chapter:', error);
      setChapters(sampleChapters);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy danh sách manga
  const fetchMangas = async () => {
    try {
      const response = await mangaService.getAllMangas();
      if (response) {
        setAvailableMangas(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách manga:', error);
    }
  };

  // Xử lý tìm kiếm và lọc
  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = chapter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chapter.chapterNumber?.toString().includes(searchTerm);
    const matchesManga = filterManga ? chapter.mangaId === filterManga : true;

    return matchesSearch && matchesManga;
  });

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentChapters = filteredChapters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage);

  // Xử lý chuyển trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý mở form thêm chapter mới
  const handleAddChapter = () => {
    setEditingChapter(undefined);
    setShowForm(true);
  };

  // Xử lý mở form chỉnh sửa chapter
  const handleEditChapter = (chapter: ChapterResponse) => {
    setEditingChapter(chapter);
    setShowForm(true);
  };

  // Xử lý đóng form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingChapter(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (editingChapter) {
        // Cập nhật chapter
        const updatedChapter = await mangaService.updateChapter(editingChapter.id!, formData);
        if (updatedChapter) {
          setChapters(chapters.map(chapter => chapter.id === updatedChapter.id ? updatedChapter : chapter));
          setShowForm(false);
          setEditingChapter(undefined);
        }
      } else {
        // Tạo chapter mới
        const newChapter = await mangaService.createChapter(formData);
        if (newChapter) {
          setChapters([...chapters, newChapter]);
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu chapter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa chapter
  const handleDeleteChapter = async (chapterId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chapter này?')) {
      try {
        const success = await mangaService.deleteChapter(chapterId);
        if (success) {
          setChapters(chapters.filter(chapter => chapter.id !== chapterId));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa chapter ID ${chapterId}:`, error);
      }
    }
  };

  // Hàm lấy tên manga từ ID
  const getMangaTitle = (mangaId: string) => {
    // Tìm trong danh sách manga từ API trước
    const mangaFromApi = availableMangas.find(m => m.id === mangaId);
    if (mangaFromApi) return mangaFromApi.title;

    // Nếu không tìm thấy, tìm trong danh sách mẫu
    const mangaFromSample = mangaList.find(m => m.id === mangaId);
    return mangaFromSample ? mangaFromSample.title : 'Unknown Manga';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý chapter</h1>
        <button
          onClick={handleAddChapter}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm chapter mới</span>
        </button>
      </div>

      {/* Form thêm/sửa chapter */}
      {showForm && (
        <ChapterForm
          initialData={editingChapter}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseForm}
          isLoading={isSubmitting}
        />
      )}

      {/* Tìm kiếm và lọc */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Tìm kiếm theo tiêu đề hoặc số chapter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc theo manga */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500 dark:text-gray-400" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              value={filterManga}
              onChange={(e) => setFilterManga(e.target.value)}
            >
              <option value="">Tất cả truyện</option>
              {availableMangas.length > 0 ? availableMangas.map((manga) => (
                <option key={manga.id} value={manga.id}>
                  {manga.title}
                </option>
              )) : mangaList.map((manga) => (
                <option key={manga.id} value={manga.id}>
                  {manga.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bảng chapter */}
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
                    Truyện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chapter
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Số trang
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Lượt xem
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ngày cập nhật
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentChapters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Không có chapter nào
                    </td>
                  </tr>
                ) : (
                  currentChapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {getMangaTitle(chapter.mangaId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    Chapter {chapter.chapterNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {chapter.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faImages} className="text-gray-400 mr-2" />
                      <span>{chapter.pages?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faEye} className="text-gray-400 mr-2" />
                      <span>{chapter.views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(chapter.updatedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      onClick={() => handleEditChapter(chapter)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => handleDeleteChapter(chapter.id || '')}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))
                )
            }</tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{' '}
                <span className="font-medium">
                  {indexOfLastItem > filteredChapters.length ? filteredChapters.length : indexOfLastItem}
                </span>{' '}
                trong <span className="font-medium">{filteredChapters.length}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                      currentPage === index + 1
                        ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-200'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default ChapterManagement;

