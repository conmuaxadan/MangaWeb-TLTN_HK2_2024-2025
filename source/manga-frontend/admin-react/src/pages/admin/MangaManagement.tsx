import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSearch, faFilter, faEye, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import { MangaResponse, MangaStatus, MangaStatusDisplayNames } from '../../interfaces/models/manga';
import { getMangaImageUrl } from '../../utils/file-utils';
import mangaService from '../../services/manga-service';
import genreService from '../../services/genre-service';
import MangaForm from '../../components/admin/MangaForm';
import { GenreResponse } from '../../interfaces/models/genre';

const MangaManagement: React.FC = () => {
  // State cho danh sách manga
  const [mangas, setMangas] = useState<MangaResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableGenres, setAvailableGenres] = useState<GenreResponse[]>([]);

  // State cho form thêm/sửa manga
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingManga, setEditingManga] = useState<MangaResponse | undefined>(undefined);
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
    fetchGenres();
  }, []);

  // Hàm lấy danh sách manga
  const fetchMangas = async () => {
    setIsLoading(true);
    try {
      const response = await mangaService.getAllMangas();
      if (response) {
        setMangas(response);
      } else {
        // Nếu không có dữ liệu từ API, sử dụng dữ liệu mẫu
        setMangas(sampleMangas);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách manga:', error);
      setMangas(sampleMangas);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm lấy danh sách thể loại
  const fetchGenres = async () => {
    try {
      const response = await genreService.getAllGenres();
      if (response) {
        setAvailableGenres(response);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thể loại:', error);
    }
  };

  // Xử lý tìm kiếm và lọc
  const filteredMangas = mangas.filter(manga => {
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

  // Xử lý mở form thêm manga mới
  const handleAddManga = () => {
    setEditingManga(undefined);
    setShowForm(true);
  };

  // Xử lý mở form chỉnh sửa manga
  const handleEditManga = (manga: MangaResponse) => {
    setEditingManga(manga);
    setShowForm(true);
  };

  // Xử lý đóng form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingManga(undefined);
  };

  // Xử lý submit form
  const handleSubmitForm = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      if (editingManga) {
        // Cập nhật manga
        const updatedManga = await mangaService.updateManga(editingManga.id, formData);
        if (updatedManga) {
          setMangas(mangas.map(manga => manga.id === updatedManga.id ? updatedManga : manga));
          setShowForm(false);
          setEditingManga(undefined);
        }
      } else {
        // Tạo manga mới
        const newManga = await mangaService.createManga(formData);
        if (newManga) {
          setMangas([...mangas, newManga]);
          setShowForm(false);
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
          setMangas(mangas.filter(manga => manga.id !== mangaId));
        }
      } catch (error) {
        console.error(`Lỗi khi xóa manga ID ${mangaId}:`, error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý truyện</h1>
        <button
          onClick={handleAddManga}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm truyện mới</span>
        </button>
      </div>

      {/* Form thêm/sửa manga */}
      {showForm && (
        <MangaForm
          initialData={editingManga}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseForm}
          isLoading={isSubmitting}
        />
      )}

      {/* Tìm kiếm và lọc */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              placeholder="Tìm kiếm theo tên hoặc tác giả"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lọc theo thể loại */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="text-gray-500 dark:text-gray-400" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
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
              <FontAwesomeIcon icon={faFilter} className="text-gray-500 dark:text-gray-400" />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Truyện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tác giả
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Thể loại
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Thống kê
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentMangas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Không có truyện nào
                    </td>
                  </tr>
                ) : (
                  currentMangas.map((manga) => (
                    <tr key={manga.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-md object-cover"
                              src={manga.coverUrl ? getMangaImageUrl(manga.coverUrl) : '/images/default-manga-cover.jpg'}
                              alt={manga.title}
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                          onClick={() => handleEditManga(manga)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDeleteManga(manga.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
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
