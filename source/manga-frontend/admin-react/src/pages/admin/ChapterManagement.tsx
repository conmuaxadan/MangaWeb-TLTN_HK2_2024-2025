import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter, faEye, faImages, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { ChapterResponse, MangaResponse } from '../../interfaces/models/manga';
import mangaService from '../../services/manga-service';
import ChapterForm from '../../components/admin/ChapterForm';
import Modal from '../../components/common/Modal';

const ChapterManagement: React.FC = () => {
  // State cho danh sách chapter
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableMangas, setAvailableMangas] = useState<MangaResponse[]>([]);

  // State cho modal và form
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentChapter, setCurrentChapter] = useState<ChapterResponse | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  // State cho tìm kiếm manga
  const [mangaSearchTerm, setMangaSearchTerm] = useState('');
  const [mangaSearchResults, setMangaSearchResults] = useState<MangaResponse[]>([]);
  const [showMangaResults, setShowMangaResults] = useState(false);
  const [selectedManga, setSelectedManga] = useState<MangaResponse | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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

      // Nếu phương pháp 1 không thành công hoặc không có chapter nào, thử phương pháp 2
      if (!response || response.length === 0) {
        console.log('Thử phương pháp thay thế để lấy danh sách chapter');
        response = await mangaService.getAllChaptersAlternative();
        console.log('Kết quả API lấy danh sách chapter (phương pháp 2):', response);
      }

      if (response && response.length > 0) {
        console.log('Có dữ liệu từ API, số lượng chapter:', response.length);

        // Sắp xếp chapter theo thời gian cập nhật mới nhất
        const sortedChapters = [...response].sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
        });

        setChapters(sortedChapters);
        console.log('Chapter đã được sắp xếp theo thời gian cập nhật mới nhất');
      } else {
        // Nếu không có dữ liệu từ cả hai phương pháp, hiển thị danh sách rỗng
        console.log('Không có chapter nào trong hệ thống');
        setChapters([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chapter:', error);
      // Hiển thị danh sách rỗng thay vì sử dụng dữ liệu mẫu
      setChapters([]);
      toast.error('Không thể lấy danh sách chapter. Vui lòng thử lại sau.');
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

  // Xử lý tìm kiếm manga
  const handleMangaSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMangaSearchTerm(value);

    if (value.trim() === '') {
      setMangaSearchResults([]);
      setShowMangaResults(false);
      return;
    }

    // Lọc manga dựa trên từ khóa tìm kiếm
    const results = availableMangas.filter(manga =>
      manga.title.toLowerCase().includes(value.toLowerCase())
    );

    setMangaSearchResults(results);
    setShowMangaResults(true);
  };

  // Xử lý chọn manga từ kết quả tìm kiếm
  const handleSelectManga = async (manga: MangaResponse) => {
    setIsLoading(true);
    setSelectedManga(manga);
    setFilterManga(manga.id);
    setMangaSearchTerm('');
    setShowMangaResults(false);

    try {
      // Lấy danh sách chapter của manga đã chọn
      const mangaChapters = await mangaService.getChaptersByMangaId(manga.id);

      if (mangaChapters && mangaChapters.length > 0) {
        // Sắp xếp chapter theo thời gian cập nhật mới nhất
        const sortedChapters = [...mangaChapters].sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
        });

        setChapters(sortedChapters);
        setCurrentPage(1); // Reset về trang đầu tiên
        toast.info(`Đã tải ${sortedChapters.length} chapter của truyện ${manga.title}`);
      } else {
        setChapters([]);
        toast.info(`Truyện ${manga.title} chưa có chapter nào`);
      }
    } catch (error) {
      console.error(`Lỗi khi lấy danh sách chapter của manga ${manga.id}:`, error);
      toast.error(`Không thể lấy danh sách chapter của truyện ${manga.title}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý xóa lựa chọn manga
  const handleClearManga = () => {
    setSelectedManga(null);
    setFilterManga('');
    setMangaSearchTerm('');

    // Khi xóa lựa chọn manga, lấy lại toàn bộ danh sách chapter
    fetchChapters();
  };

  // Xử lý click bên ngoài dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowMangaResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Xử lý tìm kiếm
  const filteredChapters = chapters.filter(chapter => {
    // Chỉ lọc theo từ khóa tìm kiếm, không cần lọc theo manga vì đã lọc khi chọn manga
    return chapter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           chapter.chapterNumber?.toString().includes(searchTerm);
  });

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentChapters = filteredChapters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage);

  // Xử lý chuyển trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý mở modal thêm chapter mới
  const handleAddChapter = () => {
    setCurrentChapter(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa chapter
  const handleEditChapter = (chapter: ChapterResponse) => {
    setCurrentChapter(chapter);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentChapter(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (currentChapter) {
        // Cập nhật chapter
        const updatedChapter = await mangaService.updateChapter(currentChapter.id!, formData);
        if (updatedChapter) {
          setChapters(chapters.map(chapter => chapter.id === updatedChapter.id ? updatedChapter : chapter));
          setIsModalOpen(false);
        }
      } else {
        // Tạo chapter mới
        const newChapter = await mangaService.createChapter(formData);
        if (newChapter) {
          setChapters([...chapters, newChapter]);
          setIsModalOpen(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Quản lý chapter</h1>
        <button
          onClick={handleAddChapter}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm chapter mới</span>
        </button>
      </div>

      {/* Modal thêm/sửa chapter */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentChapter ? 'Chỉnh sửa chapter' : 'Thêm chapter mới'}
        size="xl"
      >
        <ChapterForm
          initialData={currentChapter}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Tìm kiếm và lọc */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Tìm kiếm theo tiêu đề hoặc số chapter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc theo manga với autocomplete */}
          <div className="relative" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            </div>
            {selectedManga ? (
              <div className="flex items-center bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 p-2.5 w-full">
                <span className="flex-grow">{selectedManga.title}</span>
                <button
                  onClick={handleClearManga}
                  className="text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ) : (
              <input
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                placeholder="Tìm kiếm truyện..."
                value={mangaSearchTerm}
                onChange={handleMangaSearchChange}
                onFocus={() => mangaSearchTerm.trim() !== '' && setShowMangaResults(true)}
              />
            )}

            {/* Dropdown kết quả tìm kiếm */}
            {showMangaResults && mangaSearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {mangaSearchResults.map((manga) => (
                  <div
                    key={manga.id}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                    onClick={() => handleSelectManga(manga)}
                  >
                    {manga.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bảng chapter */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Truyện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chapter
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số trang
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lượt xem
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày cập nhật
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {currentChapters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Không có chapter nào
                    </td>
                  </tr>
                ) : (
                  currentChapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getMangaTitle(chapter.mangaId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Chapter {chapter.chapterNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {chapter.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faImages} className="text-gray-400 mr-2" />
                      <span>{chapter.pages?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faEye} className="text-gray-400 mr-2" />
                      <span>{chapter.views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(chapter.updatedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={() => handleEditChapter(chapter)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
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

