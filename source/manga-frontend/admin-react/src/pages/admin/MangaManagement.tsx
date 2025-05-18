import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter, faEye, faHeart, faComment, faUndo } from '@fortawesome/free-solid-svg-icons';
import { MangaResponse, MangaStatus, MangaStatusDisplayNames } from '../../interfaces/models/manga';
import { getMangaImageUrl } from '../../utils/file-utils';
import mangaService from '../../services/manga-service';
import MangaForm from '../../components/admin/MangaForm';
import Modal from '../../components/common/Modal';

const MangaManagement: React.FC = () => {
  // State cho danh sách manga
  const [mangas, setMangas] = useState<MangaResponse[]>([]);
  const [deletedMangas, setDeletedMangas] = useState<MangaResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDeleted, setShowDeleted] = useState<boolean>(false);

  // State cho modal và form
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentManga, setCurrentManga] = useState<MangaResponse | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dữ liệu mẫu tạm thời (sẽ bỏ đi sau khi kết nối API)
  const sampleMangas = [{
      id: '1',
      title: 'One Piece',
      author: 'Eiichiro Oda',
      description: 'Cuộc phiêu lưu của Luffy và băng hải tặc Mũ Rơm',
      genres: ['Action', 'Adventure', 'Comedy', 'Fantasy'],
      loves: 5000,
      views: 100000,
      coverUrl: '/images/covers/one-piece.jpg',
      chapters: ['1', '2', '3'],
      yearOfRelease: 1999,
      status: MangaStatus.ONGOING,
      updatedAt: '2023-05-01T10:00:00Z',
      lastChapterAddedAt: '2023-05-01T10:00:00Z'
    },
    {
      id: '2',
      title: 'Naruto',
      author: 'Masashi Kishimoto',
      description: 'Hành trình trở thành Hokage của Naruto',
      genres: ['Action', 'Adventure', 'Fantasy'],
      loves: 4500,
      views: 95000,
      coverUrl: '/images/covers/naruto.jpg',
      chapters: ['1', '2'],
      yearOfRelease: 1999,
      status: MangaStatus.COMPLETED,
      updatedAt: '2023-04-15T10:00:00Z',
      lastChapterAddedAt: '2023-04-15T10:00:00Z'
    },
    {
      id: '3',
      title: 'Bleach',
      author: 'Tite Kubo',
      description: 'Cuộc chiến của Ichigo với các hollow',
      genres: ['Action', 'Adventure', 'Supernatural'],
      loves: 4000,
      views: 90000,
      coverUrl: '/images/covers/bleach.jpg',
      chapters: ['1'],
      yearOfRelease: 2001,
      status: MangaStatus.COMPLETED,
      updatedAt: '2023-03-20T10:00:00Z',
      lastChapterAddedAt: '2023-03-20T10:00:00Z'
    },
    {
      id: '4',
      title: 'Dragon Ball',
      author: 'Akira Toriyama',
      description: 'Cuộc phiêu lưu của Son Goku',
      genres: ['Action', 'Adventure', 'Comedy', 'Martial Arts'],
      loves: 4800,
      views: 98000,
      coverUrl: '/images/covers/dragon-ball.jpg',
      chapters: ['1', '2', '3', '4'],
      yearOfRelease: 1984,
      status: MangaStatus.COMPLETED,
      updatedAt: '2023-02-10T10:00:00Z',
      lastChapterAddedAt: '2023-02-10T10:00:00Z'
    },
    {
      id: '5',
      title: 'Attack on Titan',
      author: 'Hajime Isayama',
      description: 'Cuộc chiến của nhân loại chống lại Titan',
      genres: ['Action', 'Drama', 'Fantasy', 'Horror'],
      loves: 4200,
      views: 92000,
      coverUrl: '/images/covers/attack-on-titan.jpg',
      chapters: ['1', '2'],
      yearOfRelease: 2009,
      status: MangaStatus.COMPLETED,
      updatedAt: '2023-01-05T10:00:00Z',
      lastChapterAddedAt: '2023-01-05T10:00:00Z'
    },
  ];



  // State cho tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Danh sách tất cả các thể loại từ dữ liệu manga
  const allGenres = Array.from(
    new Set(mangas.flatMap(manga => manga.genres || []))
  ).sort();

  // Load danh sách manga và thể loại khi component mount
  useEffect(() => {
    fetchMangas();
    // fetchGenres();
  }, []);

  // Hàm lấy danh sách manga
  const fetchMangas = async () => {
    setIsLoading(true);
    try {
      // Lấy danh sách manga chưa bị xóa
      const activeResponse = await mangaService.getAllMangas();
      if (activeResponse) {
        setMangas(activeResponse);
      } else {
        // Nếu không có dữ liệu từ API, sử dụng dữ liệu mẫu
        setMangas(sampleMangas);
      }

      // Lấy danh sách manga đã bị xóa
      const deletedResponse = await mangaService.getDeletedMangas();
      if (deletedResponse) {
        setDeletedMangas(deletedResponse.content);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách manga:', error);
      setMangas(sampleMangas);
    } finally {
      setIsLoading(false);
    }
  };

  // // Hàm lấy danh sách thể loại
  // const fetchGenres = async () => {
  //   try {
  //     const response = await genreService.getAllGenres();
  //     if (response) {
  //       setAvailableGenres(response);
  //     }
  //   } catch (error) {
  //     console.error('Lỗi khi lấy danh sách thể loại:', error);
  //   }
  // };

  // Xử lý tìm kiếm và lọc
  const filteredMangas = (showDeleted ? deletedMangas : mangas).filter(manga => {
    const matchesSearch = manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         manga.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = filterGenre ? manga.genres?.includes(filterGenre) || false : true;
    const matchesStatus = filterStatus ? manga.status === filterStatus : true;

    return matchesSearch && matchesGenre && matchesStatus;
  });

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMangas = filteredMangas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMangas.length / itemsPerPage);

  // Xử lý chuyển trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý mở modal thêm manga mới
  const handleAddManga = () => {
    setCurrentManga(undefined);
    setIsModalOpen(true);
  };

  // Xử lý mở modal chỉnh sửa manga
  const handleEditManga = (manga: MangaResponse) => {
    setCurrentManga(manga);
    setIsModalOpen(true);
  };

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentManga(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (currentManga) {
        // Cập nhật manga
        const updatedManga = await mangaService.updateManga(currentManga.id, formData);
        if (updatedManga) {
          setMangas(mangas.map(manga => manga.id === updatedManga.id ? updatedManga : manga));
          setIsModalOpen(false);
        }
      } else {
        // Tạo manga mới
        const newManga = await mangaService.createManga(formData);
        if (newManga) {
          setMangas([...mangas, newManga]);
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu manga:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa manga
  const handleDeleteManga = async (mangaId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa manga này?')) {
      try {
        const success = await mangaService.deleteManga(mangaId);
        if (success) {
          // Refresh danh sách manga
          fetchMangas();
        }
      } catch (error) {
        console.error(`Lỗi khi xóa manga ID ${mangaId}:`, error);
      }
    }
  };

  // Xử lý khôi phục manga
  const handleRestoreManga = async (mangaId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục manga này?')) {
      try {
        const restoredManga = await mangaService.restoreManga(mangaId);
        if (restoredManga) {
          // Refresh danh sách manga
          fetchMangas();
        }
      } catch (error) {
        console.error(`Lỗi khi khôi phục manga ID ${mangaId}:`, error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý truyện</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleAddManga}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Thêm truyện mới</span>
          </button>
        </div>
      </div>

      {/* Tab chuyển đổi giữa manga đang hoạt động và đã xóa */}
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-md ${!showDeleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => {
            setShowDeleted(false);
            setCurrentPage(1);
          }}
        >
          Truyện đang hoạt động
        </button>
        <button
          className={`px-4 py-2 rounded-md ${showDeleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => {
            setShowDeleted(true);
            setCurrentPage(1);
          }}
        >
          Truyện đã xóa
        </button>
      </div>

      {/* Modal thêm/sửa manga */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentManga ? 'Chỉnh sửa truyện' : 'Thêm truyện mới'}
        size="xl"
      >
        <MangaForm
          initialData={currentManga}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Tìm kiếm và lọc */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              placeholder="Tìm kiếm theo tên hoặc tác giả"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc theo thể loại */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
            >
              <option value="">Tất cả thể loại</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo trạng thái */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(MangaStatusDisplayNames).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bảng manga */}
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
                    Tác giả
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thể loại
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thống kê
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  {showDeleted && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thông tin xóa
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentMangas.length === 0 ? (
                  <tr>
                    <td colSpan={showDeleted ? 8 : 7} className="px-6 py-4 text-center text-gray-500">
                      {showDeleted ? 'Không có truyện nào đã xóa' : 'Không có truyện nào'}
                    </td>
                  </tr>
                ) : (
                  currentMangas.map((manga) => (
                    <tr key={manga.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-24 w-16">
                            <img
                              className="h-24 w-16 rounded-md object-cover shadow-sm hover:shadow-md transition-shadow"
                              src={manga.coverUrl ? getMangaImageUrl(manga.coverUrl) : '/images/default-manga-cover.jpg'}
                              alt={manga.title}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/default-manga-cover.jpg';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{manga.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{manga.chapters?.length || 0} chapters</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {manga.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {manga.genres?.slice(0, 3).map((genre, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {genre}
                            </span>
                          ))}
                          {(manga.genres?.length || 0) > 3 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              +{manga.genres?.length - 3 || 0}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            manga.status === MangaStatus.ONGOING
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : manga.status === MangaStatus.COMPLETED
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {manga.status ? MangaStatusDisplayNames[manga.status] : 'Không xác định'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faEye} className="text-gray-400 mr-1" />
                            <span>{manga.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faHeart} className="text-red-400 mr-1" />
                            <span>{manga.loves.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faComment} className="text-blue-400 mr-1" />
                            <span>0</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(manga.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      {showDeleted && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <div>
                            <div>Xóa lúc: {manga.deletedAt ? new Date(manga.deletedAt).toLocaleString('vi-VN') : 'N/A'}</div>
                            <div>Người xóa: {manga.deletedBy || 'N/A'}</div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {showDeleted ? (
                          // Nút khôi phục cho manga đã xóa
                          <button
                            onClick={() => handleRestoreManga(manga.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Khôi phục"
                          >
                            <FontAwesomeIcon icon={faUndo} />
                          </button>
                        ) : (
                          // Các nút thao tác cho manga đang hoạt động
                          <>
                            <button
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                              onClick={() => handleEditManga(manga)}
                              title="Chỉnh sửa"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              onClick={() => handleDeleteManga(manga.id)}
                              title="Xóa"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{' '}
                  <span className="font-medium">
                    {indexOfLastItem > filteredMangas.length ? filteredMangas.length : indexOfLastItem}
                  </span>{' '}
                  trong <span className="font-medium">{filteredMangas.length}</span> kết quả
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
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
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

export default MangaManagement;
