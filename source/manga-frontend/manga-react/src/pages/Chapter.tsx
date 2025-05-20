import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import mangaService from '../services/manga-service.ts';
import profileService from '../services/profile-service.ts';
import historyService from '../services/history-service';
import sessionService from '../services/session-service';
import {MangaResponse, ChapterResponse, ChapterPageResponse} from '../interfaces/models/manga.ts';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faHome,
  faChevronLeft,
  faChevronRight,
  faList,
  faAngleUp,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import CommentSection from '../components/CommentSection.tsx';
import { getMangaPageUrl } from '../utils/file-utils';

const Chapter: React.FC = () => {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
  const { user, isLogin } = useAuth();
  const [manga, setManga] = useState<MangaResponse | null>(null);
  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [nextChapter, setNextChapter] = useState<ChapterResponse | null>(null);
  const [prevChapter, setPrevChapter] = useState<ChapterResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>("");
  const [scrollPercentage, setScrollPercentage] = useState<number>(0);

  // Danh sách trang của chapter
  const [pages, setPages] = useState<ChapterPageResponse[]>([]);

  // State cho thanh điều hướng
  const [navbarVisible, setNavbarVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const navbarRef = useRef<HTMLDivElement>(null);

  // Lấy session ID khi component mount và cuộn lên đầu trang
  useEffect(() => {
    // Tự động cuộn lên đầu trang khi vào trang chapter
    window.scrollTo(0, 0);

    // Đảm bảo sessionId được tạo và lưu trước khi sử dụng
    const storedSessionId = sessionService.getSessionId();
    console.log('SessionId from service:', storedSessionId);
    console.log('SessionId from localStorage:', localStorage.getItem('manga_session_id'));

    // Đảm bảo sessionId được lưu vào localStorage và state
    if (storedSessionId) {
      localStorage.setItem('manga_session_id', storedSessionId);
      setSessionId(storedSessionId);
    }

    console.log('Using session ID:', storedSessionId);
  }, []);

  // State để theo dõi việc đã gửi lịch sử đọc hay chưa
  const [hasRecordedHistory, setHasRecordedHistory] = useState<boolean>(false);

  // Xử lý ẩn/hiện thanh điều hướng khi cuộn và theo dõi tiến trình đọc
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

      // Tính toán phần trăm cuộn
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = Math.round((window.scrollY / docHeight) * 100);
      setScrollPercentage(scrollPercent);

      // Gửi lịch sử đọc khi người dùng đã cuộn qua hơn 50% và chưa gửi trước đó
      if (scrollPercent > 50 && !hasRecordedHistory && id && chapter) {
        console.log('Người dùng đã cuộn qua 50% của chapter, gửi lịch sử đọc');

        // Đánh dấu đã gửi để không gửi lại
        setHasRecordedHistory(true);

        // Đảm bảo có sessionId bằng cách lấy từ nhiều nguồn
        let currentSessionId = sessionId || localStorage.getItem('manga_session_id') || sessionService.getSessionId();

        console.log('Using sessionId for anonymous reading history:', {
          'sessionId from state': sessionId,
          'sessionId from localStorage': localStorage.getItem('manga_session_id'),
          'sessionId from service': sessionService.getSessionId(),
          'final sessionId used': currentSessionId
        });

        // Xử lý lưu lịch sử đọc
        if (isLogin) {
          // Người dùng đã đăng nhập
          historyService.markAsRead(id, chapter.id)
            .then(() => console.log('Lưu lịch sử đọc thành công sau khi cuộn qua 50%'))
            .catch(err => console.error('Lỗi khi lưu lịch sử đọc:', err));
        } else if (currentSessionId) {
          // Người dùng không đăng nhập, sử dụng sessionId
          historyService.markAnonymousRead(id, chapter.id, currentSessionId)
            .then(result => {
              if (result) {
                console.log('Lưu lịch sử đọc ẩn danh thành công sau khi cuộn qua 50%');
              } else {
                console.error('Lưu lịch sử đọc ẩn danh thất bại: API trả về null');
              }
            })
            .catch(err => console.error('Lỗi khi lưu lịch sử đọc ẩn danh:', err));
        }
      }

      if (scrollingDown && !nearBottom && currentScrollY > 100) {
        // Cuộn xuống và không gần cuối trang -> ẩn navbar
        setNavbarVisible(false);
      } else {
        // Cuộn lên, gần cuối trang, hoặc ở đầu trang -> hiện navbar
        setNavbarVisible(true);
      }

      // Xác định trang hiện tại đang đọc dựa trên vị trí cuộn
      if (pages.length > 0) {
        const pageElements = document.querySelectorAll('[data-id]');
        let visiblePage = 0;

        pageElements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          // Nếu phần tử hiển thị trong viewport
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const pageIndex = parseInt(element.getAttribute('data-index') || '0', 10);
            if (pageIndex > visiblePage) {
              visiblePage = pageIndex;
            }
          }
        });

        if (visiblePage !== currentPage) {
          setCurrentPage(visiblePage);
          // Đã loại bỏ việc gọi markAsRead khi cuộn trang
          // Vì chúng ta sẽ chỉ gọi markAsRead một lần khi mở chapter
        }
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Thêm class cho body
    document.body.classList.add('reading-mode');

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('reading-mode');
    };
  }, [lastScrollY, pages, currentPage, isLogin, id, chapterId, chapter, hasRecordedHistory, sessionId]);

  // Lưu trữ tất cả các chapter để sử dụng cho nút "Chương đầu tiên"
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);

  // Đã loại bỏ việc gọi API tăng lượt xem khi người dùng cuộn trang
  // Vì chúng ta sẽ chỉ gọi API tăng lượt xem một lần khi mở chapter

  // Cuộn lên đầu trang và reset trạng thái khi chuyển giữa các chapter
  useEffect(() => {
    // Tự động cuộn lên đầu trang khi chapterId thay đổi
    window.scrollTo(0, 0);

    // Reset trạng thái đã ghi lịch sử đọc khi chuyển chapter
    setHasRecordedHistory(false);
  }, [chapterId]);

  // Xử lý điều hướng bằng phím mũi tên
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Kiểm tra xem người dùng có đang nhập vào input, textarea hay không
      const activeElement = document.activeElement;
      const isInputActive = activeElement instanceof HTMLInputElement ||
                           activeElement instanceof HTMLTextAreaElement;

      // Nếu đang nhập vào input/textarea, không xử lý phím
      if (isInputActive) return;

      switch (event.key) {
        case 'ArrowLeft':
          // Lùi chapter nếu có
          if (prevChapter) {
            event.preventDefault();
            window.location.href = `/mangas/${manga.id}/chapters/${prevChapter.id}`;
          }
          break;
        case 'ArrowRight':
          // Tiến chapter nếu có
          if (nextChapter) {
            event.preventDefault();
            window.location.href = `/mangas/${manga.id}/chapters/${nextChapter.id}`;
          }
          break;
      }
    };

    // Thêm event listener
    window.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [manga?.id, prevChapter, nextChapter]);

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setLoading(true);
        if (!id || !chapterId) {
          setError('Không tìm thấy ID manga hoặc ID chapter');
          return;
        }

        // Lấy thông tin chi tiết manga
        const mangaData = await mangaService.getMangaById(id);
        if (!mangaData) {
          setError('Không thể tải thông tin manga');
          return;
        }
        setManga(mangaData);

        // Lấy danh sách chapter
        const chaptersData = await mangaService.getChaptersByMangaId(id);
        if (!chaptersData || chaptersData.length === 0) {
          setError('Không tìm thấy chapter nào');
          return;
        }

        // Sắp xếp chapter theo số chapter tăng dần
        const sortedChapters = [...chaptersData].sort((a, b) => a.chapterNumber - b.chapterNumber);
        setChapters(sortedChapters);

        // Tìm chapter hiện tại bằng ID
        const currentChapter = sortedChapters.find(c => c.id === chapterId);

        if (!currentChapter) {
          setError('Không tìm thấy chapter này');
          return;
        }

        setChapter(currentChapter);

        // Tìm chapter kế tiếp và chapter trước
        const currentIndex = sortedChapters.findIndex(c => c.id === chapterId);

        if (currentIndex < sortedChapters.length - 1) {
          setNextChapter(sortedChapters[currentIndex + 1]);
        }

        if (currentIndex > 0) {
          setPrevChapter(sortedChapters[currentIndex - 1]);
        }

        // Lấy thông tin chi tiết chapter
        if (!currentChapter.id) {
          // Nếu không có ID, sử dụng chính chapter hiện tại
          setPages(currentChapter.pages || []);
        } else {
          // Nếu có ID, gọi API để lấy thông tin chi tiết
          const chapterData = await mangaService.getChapterById(currentChapter.id);
          if (!chapterData) {
            setError('Không thể tải thông tin chi tiết chapter');
            return;
          }
          setPages(chapterData.pages || []);

          // Đánh dấu đã đọc chapter (sẽ tự động tăng lượt xem qua Kafka)
          // Đảm bảo có sessionId bằng cách lấy từ nhiều nguồn
          let currentSessionId = sessionId;

          // Nếu không có trong state, thử lấy từ localStorage
          if (!currentSessionId) {
            currentSessionId = localStorage.getItem('manga_session_id');
          }

          // Nếu vẫn không có, tạo mới và lưu vào cả state và localStorage
          if (!currentSessionId) {
            currentSessionId = sessionService.getSessionId();
            localStorage.setItem('manga_session_id', currentSessionId);
            setSessionId(currentSessionId);
          }

          console.log('Kiểm tra điều kiện lưu lịch sử đọc:', {
            isLogin,
            id,
            'sessionId từ state': sessionId,
            'sessionId được sử dụng': currentSessionId,
            'sessionId từ localStorage': localStorage.getItem('manga_session_id'),
            'Kiểm tra sessionId': !!currentSessionId
          });

          // Lưu lịch sử đọc đã được chuyển sang xử lý khi người dùng cuộn qua 50% của chapter
          console.log('Chapter đã được tải, lịch sử đọc sẽ được lưu khi người dùng cuộn qua 50%');
        }

        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải thông tin chapter:', err);
        setError('Đã xảy ra lỗi khi tải thông tin chapter');
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [id, chapterId, isLogin]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !manga || !chapter) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-800 min-h-screen">
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg shadow-lg mt-10">
          <p className="font-medium">{error || 'Không tìm thấy thông tin chapter'}</p>
          <div className="mt-4">
            <Link to="/" className="text-white bg-red-700 hover:bg-red-800 px-4 py-2 rounded-md inline-flex items-center">
              <FontAwesomeIcon icon={faHome} className="mr-2" /> Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-grow transition origin-top w-full overflow-hidden min-h-screen bg-gray-800">
      {/* Fixed Navigation Bar at Bottom */}
      <div
        ref={navbarRef}
        className={`fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-95 backdrop-blur-sm border-t border-gray-700 z-50 py-2 px-4 flex justify-between items-center shadow-lg transition-all duration-300 ${navbarVisible ? '' : 'translate-y-full opacity-0'}`}
      >
        <div className="text-white font-medium truncate mr-4">
          {chapter.title}
        </div>
        <div className="flex items-center space-x-2">
          {prevChapter && (
            <Link
              to={`/mangas/${manga.id}/chapters/${prevChapter.id}`}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:bg-blue-600 text-white transition-colors"
              title="Chương trước"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </Link>
          )}

          <Link
            to={`/mangas/${manga.id}`}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:bg-blue-600 text-white transition-colors"
            title="Quay về trang chi tiết manga"
          >
            <FontAwesomeIcon icon={faList} />
          </Link>

          <button
            onClick={scrollToTop}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:bg-blue-600 text-white transition-colors"
            title="Lên đầu trang"
          >
            <FontAwesomeIcon icon={faAngleUp} />
          </button>

          {nextChapter && (
            <Link
              to={`/mangas/${manga.id}/chapters/${nextChapter.id}`}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 hover:bg-blue-600 text-white transition-colors"
              title="Chương sau"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </Link>
          )}
        </div>
      </div>

      <div className="w-full py-6 px-4">
        <div className="w-full max-w-screen-sm mx-auto mb-6">
          {/* Chapter Title */}
          <h1 className="text-2xl text-gray-100 mb-6 font-bold">
            <Link
              to={`/mangas/${manga.id}`}
              className="text-blue-400 hover:text-blue-300 inline-flex items-center mb-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> {manga.title}
            </Link>
            <div className="mt-2">
              {<span>{chapter.title}</span>}
            </div>
            <div className="mt-1 text-sm text-gray-400">
              <FontAwesomeIcon icon={faEye} className="mr-1" /> {chapter.views || 0} lượt xem
            </div>
          </h1>

          {/* Chapter Navigation */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                {prevChapter ? (
                  <Link
                    to={`/mangas/${manga.id}/chapters/${prevChapter.id}`}
                    className="h-12 rounded-lg bg-gray-700 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-300"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                    Chương trước
                  </Link>
                ) : (
                  <button
                    disabled
                    className="h-12 rounded-lg bg-gray-700 text-gray-500 cursor-not-allowed flex items-center justify-center w-full"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                    Chương trước
                  </button>
                )}
              </div>
              <div>
                {nextChapter ? (
                  <Link
                    to={`/mangas/${manga.id}/chapters/${nextChapter.id}`}
                    className="h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors duration-300"
                  >
                    Chương sau
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="h-12 rounded-lg bg-gray-700 text-gray-500 cursor-not-allowed flex items-center justify-center w-full"
                  >
                    Chương sau
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Pages */}
        <div className="select-none flex flex-col items-center mt-8">
          {/* Pages - Continuous reading style */}
          <div className="w-full max-w-screen-lg mx-auto bg-black">
            {/* Sắp xếp trang theo index tăng dần trước khi hiển thị */}
            {[...pages].sort((a, b) => a.index - b.index).map((page) => (
              <div
                key={page.index}
                id={`page-${page.index}`}
                data-id={page.index}
                data-index={page.index}
                className="w-full mb-1"
              >
                <img
                  src={getMangaPageUrl(page.pageUrl)}
                  alt={`Page ${page.index + 1}`}
                  className="w-full h-auto mx-auto"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-12 w-full flex justify-center">
        {nextChapter ? (
          <Link
            to={`/mangas/${manga.id}/chapters/${nextChapter.id}`}
            className="w-full max-w-screen-sm py-4 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-300"
          >
            <div className="uppercase font-bold text-lg">Xem tiếp chương {nextChapter.chapterNumber}</div>
            <div className="text-sm mt-1 text-blue-200">{nextChapter.title}</div>
          </Link>
        ) : (
          <div className="w-full max-w-screen-sm py-4 px-4 text-center bg-gray-700 text-gray-300 rounded-lg shadow-lg">
            <div className="uppercase font-bold text-lg">Đã hết chapter</div>
            <div className="text-sm mt-1 text-gray-400">Vui lòng đợi chapter mới</div>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="mt-4 w-full flex justify-center">
        <div className="max-w-screen-sm w-full flex gap-3">
          <button
            onClick={() => {
              // Lấy chapter đầu tiên (có chương số nhỏ nhất)
              const firstChapter = chapters.sort((a, b) => a.chapterNumber - b.chapterNumber)[0];
              if (firstChapter) {
                window.location.href = `/mangas/${manga.id}/chapters/${firstChapter.id}`;
              }
            }}
            className="uppercase bg-gray-700 hover:bg-gray-600 text-gray-200 w-full px-3 py-2 text-center rounded-md transition-colors duration-300 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faList} className="mr-2" /> Chương đầu tiên
          </button>
          <button
            onClick={scrollToTop}
            className="uppercase bg-gray-700 hover:bg-gray-600 text-gray-200 w-full px-3 py-2 text-center rounded-md transition-colors duration-300 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faAngleUp} className="mr-2" /> Lên đầu
          </button>
        </div>
      </div>
      {/* Footer Info */}
      <div className="mt-12 w-full bg-gray-900 py-6 px-4 border-t border-gray-800">
        <div className="max-w-md mx-auto text-center text-gray-300">
          <div className="mb-3">
            Bạn đang xem và đọc truyện tranh manga <strong>{manga.title}</strong> tại R-Manga.
          </div>
          <div className="mb-3">
            Chương (chapter, chap) hiện tại mà bạn đang đọc là <strong>chapter {chapter.chapterNumber}</strong>
            <span> ({chapter.title})</span>.
          </div>
          {nextChapter && (
              <div className="mb-3">
                <span>Chương kế tiếp của truyện là <strong>chapter {nextChapter.chapterNumber}</strong></span>
              </div>
          )}
        </div>
      </div>

      {/* Comment Section */}
      <div className="mt-8 w-full flex justify-center">
        <div className="max-w-screen-sm w-full">
          {chapter && manga && (
            <CommentSection chapterId={chapter.id || ''} mangaId={manga.id} />
          )}
        </div>
      </div>


    </main>
  );
};

export default Chapter;
