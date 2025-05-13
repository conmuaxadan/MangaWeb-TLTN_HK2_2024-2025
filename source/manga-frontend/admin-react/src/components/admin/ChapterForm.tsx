import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faSpinner, faTrash, faPlus, faSearch, faTimes, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { ChapterResponse, MangaResponse } from '../../interfaces/models/manga';
import mangaService from '../../services/manga-service';
import { toast } from 'react-toastify';

interface ChapterFormProps {
  initialData?: ChapterResponse;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  onDelete?: (chapterId: string) => void;
  isLoading?: boolean;
}

const ChapterForm: React.FC<ChapterFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false
}) => {
  // Form state
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [mangaId, setMangaId] = useState<string>('');
  const [pageFiles, setPageFiles] = useState<File[]>([]);
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available mangas
  const [availableMangas, setAvailableMangas] = useState<MangaResponse[]>([]);
  const [loadingMangas, setLoadingMangas] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MangaResponse[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedManga, setSelectedManga] = useState<MangaResponse | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load mangas
  useEffect(() => {
    const fetchMangas = async () => {
      setLoadingMangas(true);
      try {
        const mangas = await mangaService.getAllMangas();
        if (mangas) {
          setAvailableMangas(mangas);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách truyện:', error);
      } finally {
        setLoadingMangas(false);
      }
    };

    fetchMangas();
  }, []);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setChapterNumber(initialData.chapterNumber || 1);
      setTitle(initialData.title || '');
      setMangaId(initialData.mangaId || '');

      // For existing chapters, we can't show the actual pages because we don't have the files
      // We can only show the URLs
      if (initialData.pages) {
        // Sắp xếp các trang theo index trước khi hiển thị
        const sortedPages = [...initialData.pages].sort((a, b) => a.index - b.index);
        const previews = sortedPages.map(page => {
          // Thêm tiền tố API Gateway nếu URL không bắt đầu bằng http
          if (page.pageUrl.startsWith('http')) {
            return page.pageUrl;
          } else {
            return `http://localhost:8888/api/v1/upload/files/${page.pageUrl}`;
          }
        });
        setPagePreviews(previews);
      }

      // Find the manga for display
      if (initialData.mangaId) {
        const manga = availableMangas.find(m => m.id === initialData.mangaId);
        if (manga) {
          setSelectedManga(manga);
        }
      }
    }
  }, [initialData, availableMangas]);

  // Handle page files change
  const handlePageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setPageFiles(prev => [...prev, ...newFiles]);

      // Create preview URLs
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPagePreviews(prev => [...prev, ...newPreviews]);

      // Clear error if exists
      if (errors.pages) {
        setErrors(prev => ({ ...prev, pages: '' }));
      }

      // Hiển thị thông báo đã thêm trang
      toast.success(`Đã thêm ${newFiles.length} trang mới`, {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: true
      });

      // Nếu đang chỉnh sửa chapter, hiển thị thông báo hướng dẫn
      if (initialData && initialData.id) {
        toast.info('Các trang mới sẽ được thêm vào sau các trang hiện có khi bạn nhấn "Cập nhật"', {
          position: "top-right",
          autoClose: 5000
        });
      }
    }
  };

  // Handle remove page
  const handleRemovePage = async (index: number) => {
    // Nếu đang chỉnh sửa chapter và có initialData (có ID chapter)
    if (initialData && initialData.id) {
      // Hiển thị hộp thoại xác nhận
      if (!window.confirm(`Bạn có chắc chắn muốn xóa trang ${index + 1}?`)) {
        return;
      }

      // Hiển thị thông báo đang xóa
      const loadingToast = toast.loading(`Đang xóa trang ${index + 1}...`, {
        position: "top-right"
      });

      try {
        // Gọi API xóa trang
        const updatedChapter = await mangaService.deleteChapterPage(initialData.id, index);

        if (updatedChapter) {
          // Xóa file tại vị trí index
          setPageFiles(prev => prev.filter((_, i) => i !== index));

          // Kiểm tra xem preview có phải là URL object không
          const preview = pagePreviews[index];
          if (preview && preview.startsWith('blob:')) {
            // Nếu là URL object, revoke để tránh memory leak
            URL.revokeObjectURL(preview);
          }

          // Xóa preview tại vị trí index
          setPagePreviews(prev => prev.filter((_, i) => i !== index));

          // Đóng thông báo loading và hiển thị thông báo thành công
          toast.dismiss(loadingToast);
          toast.success(`Đã xóa trang ${index + 1}`, {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: true
          });
        }
      } catch (error) {
        // Đóng thông báo loading và hiển thị thông báo lỗi
        toast.dismiss(loadingToast);
        toast.error(`Lỗi khi xóa trang ${index + 1}`, {
          position: "top-right"
        });
        console.error('Lỗi khi xóa trang:', error);
      }
    } else {
      // Nếu đang tạo chapter mới hoặc không có initialData
      // Chỉ xóa trang khỏi state

      // Xóa file tại vị trí index
      setPageFiles(prev => prev.filter((_, i) => i !== index));

      // Kiểm tra xem preview có phải là URL object không
      const preview = pagePreviews[index];
      if (preview && preview.startsWith('blob:')) {
        // Nếu là URL object, revoke để tránh memory leak
        URL.revokeObjectURL(preview);
      }

      // Xóa preview tại vị trí index
      setPagePreviews(prev => prev.filter((_, i) => i !== index));

      // Hiển thị thông báo đã xóa
      toast.success(`Đã xóa trang ${index + 1}`, {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: true
      });
    }
  };

  // Handle remove all pages
  const handleRemoveAllPages = async () => {
    if (pageFiles.length === 0 && pagePreviews.length === 0) {
      toast.info('Không có trang nào để xóa', {
        position: "top-right",
        autoClose: 2000
      });
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa tất cả ${pagePreviews.length} trang?`)) {
      // Nếu đang chỉnh sửa chapter và có initialData (có ID chapter)
      if (initialData && initialData.id && initialData.pages && initialData.pages.length > 0) {
        // Hiển thị thông báo đang xóa
        const loadingToast = toast.loading('Đang xóa tất cả các trang...', {
          position: "top-right"
        });

        try {
          // Xóa từng trang trên server
          // Bắt đầu từ trang cuối cùng để tránh vấn đề với index
          for (let i = initialData.pages.length - 1; i >= 0; i--) {
            await mangaService.deleteChapterPage(initialData.id, i);
          }

          // Revoke tất cả các URL object để tránh memory leak
          pagePreviews.forEach(preview => {
            if (preview && preview.startsWith('blob:')) {
              URL.revokeObjectURL(preview);
            }
          });

          // Xóa tất cả các file và preview
          setPageFiles([]);
          setPagePreviews([]);

          // Đóng thông báo loading và hiển thị thông báo thành công
          toast.dismiss(loadingToast);
          toast.success('Đã xóa tất cả các trang', {
            position: "top-right",
            autoClose: 2000
          });
        } catch (error) {
          // Đóng thông báo loading và hiển thị thông báo lỗi
          toast.dismiss(loadingToast);
          toast.error('Lỗi khi xóa các trang', {
            position: "top-right"
          });
          console.error('Lỗi khi xóa các trang:', error);
        }
      } else {
        // Nếu đang tạo chapter mới hoặc không có initialData
        // Chỉ xóa các trang khỏi state

        // Revoke tất cả các URL object để tránh memory leak
        pagePreviews.forEach(preview => {
          if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
          }
        });

        // Xóa tất cả các file và preview
        setPageFiles([]);
        setPagePreviews([]);

        // Hiển thị thông báo đã xóa
        toast.success('Đã xóa tất cả các trang', {
          position: "top-right",
          autoClose: 2000
        });
      }
    }
  };

  // Handle replace page
  const handleReplacePage = (index: number) => {
    // Tạo một input file ẩn
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Xử lý sự kiện khi người dùng chọn file
    fileInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];

        // Nếu đang chỉnh sửa chapter và có initialData (có ID chapter)
        if (initialData && initialData.id) {
          // Hiển thị thông báo đang tải lên
          const loadingToast = toast.loading(`Đang cập nhật trang ${index + 1}...`, {
            position: "top-right"
          });

          try {
            // Gọi API cập nhật trang
            const updatedChapter = await mangaService.updateChapterPage(initialData.id, index, file);

            if (updatedChapter) {
              // Cập nhật preview
              if (pagePreviews[index] && pagePreviews[index].startsWith('blob:')) {
                URL.revokeObjectURL(pagePreviews[index]);
              }

              // Tạo URL mới cho preview
              const newPreview = URL.createObjectURL(file);

              // Cập nhật mảng pagePreviews
              setPagePreviews(prev => {
                const newPreviews = [...prev];
                newPreviews[index] = newPreview;
                return newPreviews;
              });

              // Cập nhật mảng pageFiles
              setPageFiles(prev => {
                const newFiles = [...prev];
                newFiles[index] = file;
                return newFiles;
              });

              // Đóng thông báo loading và hiển thị thông báo thành công
              toast.dismiss(loadingToast);
              toast.success(`Đã cập nhật trang ${index + 1}`, {
                position: "top-right",
                autoClose: 1500
              });
            }
          } catch (error) {
            // Đóng thông báo loading và hiển thị thông báo lỗi
            toast.dismiss(loadingToast);
            toast.error(`Lỗi khi cập nhật trang ${index + 1}`, {
              position: "top-right"
            });
            console.error('Lỗi khi cập nhật trang:', error);
          }
        } else {
          // Nếu đang tạo chapter mới hoặc không có initialData
          // Chỉ cập nhật preview và file trong state

          // Nếu có preview cũ, revoke nó
          if (pagePreviews[index] && pagePreviews[index].startsWith('blob:')) {
            URL.revokeObjectURL(pagePreviews[index]);
          }

          // Tạo URL mới cho preview
          const newPreview = URL.createObjectURL(file);

          // Cập nhật mảng pagePreviews
          setPagePreviews(prev => {
            const newPreviews = [...prev];
            newPreviews[index] = newPreview;
            return newPreviews;
          });

          // Cập nhật mảng pageFiles
          setPageFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = file;
            return newFiles;
          });

          toast.success(`Đã thay thế trang ${index + 1}`, {
            position: "top-right",
            autoClose: 1500
          });
        }
      }

      // Xóa input file ẩn
      document.body.removeChild(fileInput);
    };

    // Kích hoạt sự kiện click để mở hộp thoại chọn file
    fileInput.click();
  };

  // Handle manga search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Filter mangas based on search term
    const results = availableMangas.filter(manga =>
      manga.title.toLowerCase().includes(value.toLowerCase())
    );

    setSearchResults(results);
    setShowSearchResults(true);
  };

  // Handle manga selection from search results
  const handleSelectManga = async (manga: MangaResponse) => {
    setSelectedManga(manga);
    setMangaId(manga.id);
    setSearchTerm('');
    setShowSearchResults(false);

    // Clear error if exists
    if (errors.mangaId) {
      setErrors(prev => ({
        ...prev,
        mangaId: ''
      }));
    }

    // Nếu đang tạo chapter mới (không có initialData), tự động điền số chapter
    if (!initialData) {
      try {
        // Lấy số chapter cao nhất của truyện
        const highestChapterNumber = await mangaService.getHighestChapterNumber(manga.id);

        // Điền số chapter mới = số chapter cao nhất + 1
        setChapterNumber(highestChapterNumber + 1);

        // Hiển thị thông báo
        toast.info(`Đã tự động điền số chapter: ${highestChapterNumber + 1}`, {
          position: "top-right",
          autoClose: 2000
        });
      } catch (error) {
        console.error('Lỗi khi lấy số chapter cao nhất:', error);
      }
    }
  };

  // Handle clear manga selection
  const handleClearManga = () => {
    setSelectedManga(null);
    setMangaId('');
    setSearchTerm('');
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Kiểm tra mangaId và chapterNumber chỉ khi tạo mới
    if (!initialData) {
      if (!mangaId) {
        newErrors.mangaId = 'Vui lòng chọn truyện';
      }

      if (chapterNumber <= 0) {
        newErrors.chapterNumber = 'Số chapter phải lớn hơn 0';
      }
    }

    // Luôn kiểm tra title
    if (!title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }

    // Kiểm tra trang chỉ khi tạo mới hoặc khi cập nhật và có tải lên trang mới
    if (!initialData && pageFiles.length === 0) {
      newErrors.pages = 'Vui lòng chọn ít nhất một trang';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create FormData object
    const formData = new FormData();

    // Chỉ thêm chapterNumber và mangaId khi tạo mới, không thêm khi cập nhật
    if (!initialData) {
      formData.append('chapterNumber', chapterNumber.toString());
      formData.append('mangaId', mangaId);
    }

    // Luôn thêm title (không được để trống)
    if (title.trim() === '') {
      // Nếu title trống và đang cập nhật, sử dụng title hiện tại
      if (initialData && initialData.title) {
        formData.append('title', initialData.title);
      } else {
        // Nếu đang tạo mới, sử dụng title mặc định
        formData.append('title', `Chương ${chapterNumber}`);
      }
    } else {
      formData.append('title', title);
    }

    // Add page files (nếu có)
    if (pageFiles.length > 0) {
      pageFiles.forEach(file => {
        formData.append('pages', file);
      });
    }

    onSubmit(formData);
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      pagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [pagePreviews]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        {initialData ? 'Chỉnh sửa chapter' : 'Thêm chapter mới'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manga Selection */}
        <div>
          <label htmlFor="mangaSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Truyện <span className="text-red-500">*</span>
          </label>
          {loadingMangas ? (
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải danh sách truyện...</span>
            </div>
          ) : (
            <div className="relative" ref={searchRef}>
              {selectedManga ? (
                <div className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  <span className="text-gray-900 dark:text-white">{selectedManga.title}</span>
                  <button
                    type="button"
                    onClick={handleClearManga}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="mangaSearch"
                    placeholder="Tìm kiếm truyện..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    disabled={isLoading || loadingMangas || !!initialData}
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.mangaId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
                  />
                </div>
              )}

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md max-h-60 overflow-auto">
                  {searchResults.map(manga => (
                    <div
                      key={manga.id}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      onClick={() => handleSelectManga(manga)}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{manga.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{manga.author}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.mangaId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.mangaId}</p>
          )}
        </div>

        {/* Chapter Number */}
        <div>
          <label htmlFor="chapterNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Số chapter <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="chapterNumber"
            value={chapterNumber}
            onChange={(e) => setChapterNumber(parseInt(e.target.value))}
            disabled={isLoading || (!!initialData && initialData.chapterNumber)}
            min="1"
            className={`w-full px-3 py-2 border ${
              errors.chapterNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
          />
          {errors.chapterNumber && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.chapterNumber}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border ${
              errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
          )}
        </div>

        {/* Pages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trang <span className="text-red-500">*</span>
          </label>

          <div className="flex space-x-2 mb-2">
            <label
              htmlFor="pages"
              className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Thêm trang
              <input
                type="file"
                id="pages"
                accept="image/*"
                multiple
                onChange={handlePageFilesChange}
                disabled={isLoading}
                className="sr-only"
              />
            </label>

            {pagePreviews.length > 0 && (
              <button
                type="button"
                onClick={handleRemoveAllPages}
                className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                title="Xóa tất cả các trang"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Xóa tất cả ({pagePreviews.length})
              </button>
            )}
          </div>

          {errors.pages && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pages}</p>
          )}

          {/* Page Previews */}
          {pagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
              {pagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Page ${index + 1}`}
                    className="w-full h-40 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => handleReplacePage(index)}
                      className="bg-blue-500 text-white rounded-full p-1.5 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-110"
                      title="Thay thế trang này"
                    >
                      <FontAwesomeIcon icon={faExchangeAlt} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePage(index)}
                      className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-110"
                      title="Xóa trang này"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-1 text-xs">
                    Trang {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Đang xử lý...
              </span>
            ) : initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChapterForm;
