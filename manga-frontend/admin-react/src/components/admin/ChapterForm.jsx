import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faPlus, faSearch, faTimes, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import mangaService from '../../services/manga-service.js';
import chapterService from '../../services/chapter-service.js';
import { toast } from 'react-toastify';
import { getMangaPageUrl } from '../../utils/file-utils.js';

const ChapterForm = ({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  isLoading = false
}) => {
  // Form state
  const [chapterNumber, setChapterNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [mangaId, setMangaId] = useState('');
  const [pageFiles, setPageFiles] = useState([]);
  const [pagePreviews, setPagePreviews] = useState([]);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedManga, setSelectedManga] = useState(null);
  const searchRef = useRef(null);

  // Loading state
  const [loadingMangas, setLoadingMangas] = useState(false);

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setChapterNumber(initialData.chapterNumber || 1);
      setTitle(initialData.title || '');
      setMangaId(initialData.mangaId || '');

      if (initialData.pages) {
        // Sắp xếp các trang theo index trước khi hiển thị
        const sortedPages = [...initialData.pages].sort((a, b) => a.index - b.index);
        const previews = sortedPages.map(page => {
          return { url: getMangaPageUrl(page.pageUrl) };
        });
        setPagePreviews(previews);
      }

      // Nếu có mangaId, thực hiện tìm kiếm nhanh để lấy thông tin manga
      if (initialData.mangaId) {
        fetchMangaById(initialData.mangaId);
      }
    }
  }, [initialData]);

  // Tìm kiếm manga theo ID
  const fetchMangaById = async (mangaId) => {
    try {
      // Gọi API tìm kiếm nhanh với từ khóa là ID
      const results = await mangaService.quickSearchManga(mangaId);
      if (results && results.length > 0) {
        const manga = results.find(m => m.id === mangaId);
        if (manga) {
          setSelectedManga(manga);
        }
      }
    } catch (err) {
      console.error(`Lỗi khi lấy thông tin manga ID ${mangaId}:`, err);
    }
  };

  // Hàm trích xuất số thứ tự từ tên file
  const extractPageNumber = (fileName) => {
    // Tìm số trong tên file
    const match = fileName.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    return 0;
  };

  // Handle page files change
  const handlePageFilesChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);

      // Sắp xếp files theo số thứ tự trong tên file
      newFiles.sort((a, b) => {
        const numA = extractPageNumber(a.name);
        const numB = extractPageNumber(b.name);
        return numA - numB;
      });

      setPageFiles(prev => [...prev, ...newFiles]);

      // Tạo thông tin preview với tên file và số thứ tự
      const newPreviews = newFiles.map(file => {
        const url = URL.createObjectURL(file);
        return {
          url,
          fileName: file.name,
          fileNumber: extractPageNumber(file.name)
        };
      });

      // Cập nhật pagePreviews
      setPagePreviews(prev => {
        // Nếu prev là mảng chuỗi (từ initialData), chuyển đổi thành mảng PageInfo
        const prevPageInfos = prev.map(p => {
          if (typeof p === 'string') {
            return { url: p };
          }
          return p;
        });
        return [...prevPageInfos, ...newPreviews];
      });

      // Clear error if exists
      if (errors.pages) {
        setErrors(prev => ({ ...prev, pages: '' }));
      }

      // Hiển thị thông báo đã thêm trang
      toast.success(`Đã thêm ${newFiles.length} trang mới theo thứ tự số trong tên file`, {
        position: "top-right",
        autoClose: 2000,
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
  const handleRemovePage = async (index) => {
    // Nếu đang chỉnh sửa chapter và có initialData (có ID chapter)
    if (initialData && initialData.id) {
      // Hiển thị hộp thoại xác nhận
      if (!window.confirm(`Bạn có chắc chắn muốn x��a trang ${index + 1}?`)) {
        return;
      }

      // Hiển thị thông báo đang xóa
      const loadingToast = toast.loading(`Đang xóa trang ${index + 1}...`, {
        position: "top-right"
      });

      try {
        // Gọi API xóa trang
        const updatedChapter = await chapterService.deleteChapterPage(initialData.id, index);

        if (updatedChapter) {
          // Xóa file tại vị trí index
          setPageFiles(prev => prev.filter((_, i) => i !== index));

          // Kiểm tra xem preview có phải là URL object không
          const preview = pagePreviews[index];
          if (preview && preview.url && preview.url.startsWith('blob:')) { // Sửa ở đây
            // Nếu là URL object, revoke để tránh memory leak
            URL.revokeObjectURL(preview.url); // Sửa ở đây
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
      // Xóa file tại vị trí index
      setPageFiles(prev => prev.filter((_, i) => i !== index));

      // Kiểm tra xem preview có phải là URL object không
      const preview = pagePreviews[index];
      if (preview && preview.url && preview.url.startsWith('blob:')) {
        // Nếu là URL object, revoke để tránh memory leak
        URL.revokeObjectURL(preview.url);
      }

      // Xóa preview tại vị trí index
      setPagePreviews(prev => prev.filter((_, i) => i !== index));

      // Hiển thị thông báo đã xóa
      toast.success(`Đã xóa trang ${index + 1}`, {
        position: "top-right",
        autoClose: 1000
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
            await chapterService.deleteChapterPage(initialData.id, i);
          }

          // Revoke tất cả các URL object để tránh memory leak
          pagePreviews.forEach(preview => {
            if (preview && preview.url && preview.url.startsWith('blob:')) {
              URL.revokeObjectURL(preview.url);
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
        // Revoke tất cả các URL object để tránh memory leak
        pagePreviews.forEach(preview => {
          if (preview && preview.url && preview.url.startsWith('blob:')) {
            URL.revokeObjectURL(preview.url);
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
  const handleReplacePage = (index) => {
    // Tạo một input file ẩn
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Xử lý sự kiện khi người dùng chọn file
    fileInput.onchange = async (e) => {
      const target = e.target;
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
            const updatedChapter = await chapterService.updateChapterPage(initialData.id, index, file);

            if (updatedChapter) {
              // Cập nhật preview
              if (pagePreviews[index] && pagePreviews[index].url && pagePreviews[index].url.startsWith('blob:')) {
                URL.revokeObjectURL(pagePreviews[index].url);
              }

              // Tạo URL mới cho preview
              const newPreviewUrl = URL.createObjectURL(file);

              // Cập nhật mảng pagePreviews
              setPagePreviews(prev => {
                const newPreviewsArray = [...prev];
                newPreviewsArray[index] = {
                  url: newPreviewUrl,
                  fileName: file.name,
                  fileNumber: extractPageNumber(file.name)
                };
                return newPreviewsArray;
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
          // Nếu có preview cũ, revoke nó
          if (pagePreviews[index] && pagePreviews[index].url && pagePreviews[index].url.startsWith('blob:')) {
            URL.revokeObjectURL(pagePreviews[index].url);
          }

          // Tạo URL mới cho preview
          const newPreviewUrl = URL.createObjectURL(file);

          // Cập nhật mảng pagePreviews
          setPagePreviews(prev => {
            const newPreviews = [...prev];
            newPreviews[index] = {
              url: newPreviewUrl,
              fileName: file.name,
              fileNumber: extractPageNumber(file.name)
            };
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
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Gọi API tìm kiếm nhanh thay vì lọc trên client
      const results = await mangaService.quickSearchManga(value);
      console.log('Kết quả tìm kiếm nhanh manga:', results);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Lỗi khi tìm kiếm nhanh manga:', err);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle manga selection from search results
  const handleSelectManga = async (manga) => {
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
      // Sử dụng thông tin số chapter cao nhất đã có trong kết quả tìm kiếm nhanh
      const nextChapterNumber = manga.highestChapterNumber + 1;
      setChapterNumber(nextChapterNumber);

      // Hiển thị thông báo
      toast.info(`Đã tự động điền số chapter: ${nextChapterNumber}`, {
        position: "top-right",
        autoClose: 2000
      });
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
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

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
  const handleSubmit = (e) => {
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
      pagePreviews.forEach(preview => {
        if (preview && preview.url && preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [pagePreviews]);

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        {initialData ? 'Chỉnh sửa chapter' : 'Thêm chapter mới'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manga Selection */}
        <div>
          <label htmlFor="mangaSearch" className="block text-sm font-medium text-gray-700 mb-1">
            Truyện <span className="text-red-500">*</span>
          </label>
          {loadingMangas ? (
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-500" />
              <span className="text-sm text-gray-500">Đang tải danh sách truyện...</span>
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
            type="number" step="0.1"
            id="chapterNumber"
            value={chapterNumber}
            onChange={(e) => setChapterNumber(parseFloat(e.target.value))}
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
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trang <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-gray-500 italic">
              Gợi ý: Đặt tên file theo dạng 1.jpg, 2.jpg, 3.jpg... để sắp xếp đúng thứ tự
            </span>
          </div>

          <div className="flex space-x-2 mb-2">
            <label
              htmlFor="pages"
              className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Thêm trang (nhiều file)
              <input
                type="file"
                id="pages"
                accept="image/*"
                multiple
                onChange={handlePageFilesChange}
                disabled={isLoading}
                className="sr-only"
                title="Chọn nhiều file cùng lúc, các file sẽ được sắp xếp theo số thứ tự trong tên file"
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
                    src={preview.url}
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
                    {preview.fileName && (
                      <span className="ml-1 text-yellow-300" title={preview.fileName}>
                        (File: {preview.fileNumber || '?'})
                      </span>
                    )}
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
