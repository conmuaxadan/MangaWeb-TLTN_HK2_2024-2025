import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import mangaService from '../services/manga-service';
import {MangaResponse, ChapterResponse, ChapterPageResponse} from '../interfaces/models/manga';
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
import './MangaChapter.css';
import CommentSection from './CommentSection';

const MangaChapter: React.FC = () => {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
  const [manga, setManga] = useState<MangaResponse | null>(null);
  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [nextChapter, setNextChapter] = useState<ChapterResponse | null>(null);
  const [prevChapter, setPrevChapter] = useState<ChapterResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State cho thanh điều hướng
  const [navbarVisible, setNavbarVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const navbarRef = useRef<HTMLDivElement>(null);

  // Xử lý ẩn/hiện thanh điều hướng khi cuộn
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

      if (scrollingDown && !nearBottom && currentScrollY > 100) {
        // Cuộn xuống và không gần cuối trang -> ẩn navbar
        setNavbarVisible(false);
      } else {
        // Cuộn lên, gần cuối trang, hoặc ở đầu trang -> hiện navbar
        setNavbarVisible(true);
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
  }, [lastScrollY]);

  // Danh sách trang của chapter
  const [pages, setPages] = useState<ChapterPageResponse[]>([]);

  // Lưu trữ tất cả các chapter để sử dụng cho nút "Chương đầu tiên"
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);

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

          // Tăng lượt xem của chapter
          try {
            await mangaService.incrementChapterViews(currentChapter.id);
            console.log('Tăng lượt xem thành công cho chapter ID:', currentChapter.id);
          } catch (err) {
            console.error('Lỗi khi tăng lượt xem:', err);
            // Không hiển thị lỗi cho người dùng vì đây là tính năng ngầm
          }
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
  }, [id, chapterId]);

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
      <div className="container mx-auto px-4 py-8 bg-gray-900 min-h-screen">
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
    <main className="flex-grow transition origin-top w-full overflow-hidden min-h-screen bg-gray-900">
      {/* Fixed Navigation Bar at Bottom */}
      <div
        ref={navbarRef}
        className={`chapter-navbar ${navbarVisible ? '' : 'hidden'}`}
      >
        <div className="chapter-navbar-title">
          Chương {chapter.chapterNumber}: {chapter.title}
        </div>
        <div className="chapter-navbar-actions">
          {prevChapter && (
            <Link
              to={`/mangas/${manga.id}/chapters/${prevChapter.id}`}
              className="chapter-navbar-button"
              title="Chương trước"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </Link>
          )}

          <Link
            to={`/mangas/${manga.id}`}
            className="chapter-navbar-button"
            title="Quay về trang chi tiết manga"
          >
            <FontAwesomeIcon icon={faList} />
          </Link>

          <button
            onClick={scrollToTop}
            className="chapter-navbar-button"
            title="Lên đầu trang"
          >
            <FontAwesomeIcon icon={faAngleUp} />
          </button>

          {nextChapter && (
            <Link
              to={`/mangas/${manga.id}/chapters/${nextChapter.id}`}
              className="chapter-navbar-button"
              title="Chương sau"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </Link>
          )}
        </div>
      </div>

      <div className="chapter-content">
        <div className="w-full max-w-screen-sm mx-auto px-2 mb-6">
          {/* Chapter Title */}
          <h1 className="text-2xl text-gray-100 mb-6 font-bold">
            <Link
              to={`/mangas/${manga.id}`}
              className="text-blue-400 hover:text-blue-300 inline-flex items-center mb-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> {manga.title}
            </Link>
            <div className="mt-2">
              <span>Chương {chapter.chapterNumber}</span>
              {chapter.title && <span>: {chapter.title}</span>}
            </div>
            <div className="mt-1 text-sm text-gray-400">
              <FontAwesomeIcon icon={faEye} className="mr-1" /> {chapter.views || 0} lượt xem
            </div>
          </h1>

          {/* Chapter Navigation */}
          <div className="chapter-navigation">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                {prevChapter ? (
                  <Link
                    to={`/mangas/${manga.id}/chapters/${prevChapter.id}`}
                    className="chapter-navigation-button bg-gray-700 hover:bg-blue-600 text-white flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                    Chương trước
                  </Link>
                ) : (
                  <button
                    disabled
                    className="chapter-navigation-button bg-gray-800 text-gray-600 cursor-not-allowed"
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
                    className="chapter-navigation-button bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                  >
                    Chương sau
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="chapter-navigation-button bg-gray-800 text-gray-600 cursor-not-allowed"
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
          <div className="manga-page-container w-full max-w-screen-lg bg-black">
            {/* Sắp xếp trang theo index tăng dần trước khi hiển thị */}
            {[...pages].sort((a, b) => a.index - b.index).map((page) => (
              <div
                key={page.index}
                id={`page-${page.index}`}
                data-id={page.index}
                data-index={page.index}
                className="w-full"
              >
                <img
                  src={`http://localhost:8888/api/v1/upload/files/${page.pageUrl}`}
                  alt={`Page ${page.index + 1}`}
                  className="w-full h-auto"
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
            className="button w-full max-w-screen-sm button-primary py-4 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-300"
          >
            <div className="uppercase font-bold text-lg">Xem tiếp chương {nextChapter.chapterNumber}</div>
            <div className="text-sm mt-1 text-blue-200">{nextChapter.title}</div>
          </Link>
        ) : (
          <div className="button w-full max-w-screen-sm py-4 px-4 text-center bg-gray-800 text-gray-300 rounded-lg shadow-lg">
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
            className="uppercase button bg-gray-700 hover:bg-gray-600 text-gray-200 w-full px-3 py-2 text-center rounded-md transition-colors duration-300 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faList} className="mr-2" /> Chương đầu tiên
          </button>
          <button
            onClick={scrollToTop}
            className="uppercase button bg-gray-700 hover:bg-gray-600 text-gray-200 w-full px-3 py-2 text-center rounded-md transition-colors duration-300 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faAngleUp} className="mr-2" /> Lên đầu
          </button>
        </div>
      </div>
      {/* Footer Info */}
      <div className="chapter-info mt-12">
        <div className="max-w-md mx-auto text-center">
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

export default MangaChapter;
