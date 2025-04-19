import React, {useEffect, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import mangaService from '../services/manga-service.ts';
import profileService from '../services/profile-service.ts';
import {MangaResponse, ChapterResponse, MangaStatusDisplayNames} from '../interfaces/models/manga.ts';
import {formatDistanceToNow} from 'date-fns';
import {vi} from 'date-fns/locale';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faStar,
    faHeart as faHeartSolid,
    faEye,
    faClock,
    faUser,
    faRss,
    faTags,
    faPen,
    faList,
    faComment
} from '@fortawesome/free-solid-svg-icons';
import {faHeart as faHeartRegular} from '@fortawesome/free-regular-svg-icons';
import {useAuth} from '../contexts/AuthContext';

const MangaDetail: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const {isLogin} = useAuth();
    const [manga, setManga] = useState<MangaResponse | null>(null);
    const [chapters, setChapters] = useState<ChapterResponse[]>([]);
    const [totalComments, setTotalComments] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
    const chaptersPerPage = 20;

    useEffect(() => {
        const fetchMangaDetails = async () => {
            try {
                setLoading(true);
                if (!id) {
                    setError('Không tìm thấy ID manga');
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
                if (chaptersData) {
                    // Sắp xếp chapter theo số chapter giảm dần (mới nhất lên đầu)
                    const sortedChapters = [...chaptersData].sort((a, b) =>
                        b.chapterNumber - a.chapterNumber
                    );
                    setChapters(sortedChapters);
                }

                // Lấy tổng số bình luận
                const commentsCount = await profileService.countCommentsByMangaId(id);
                setTotalComments(commentsCount);

                setError(null);
            } catch (err) {
                console.error('Lỗi khi tải thông tin manga:', err);
                setError('Đã xảy ra lỗi khi tải thông tin manga');
            } finally {
                setLoading(false);
            }
        };

        fetchMangaDetails();
    }, [id]);

    // Kiểm tra trạng thái yêu thích
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (!id || !isLogin) return;

            try {
                const status = await profileService.isFavorite(id);
                setIsFavorite(status);
            } catch (error) {
                console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
            }
        };

        checkFavoriteStatus();
    }, [id, isLogin]);

    // Tính toán các chapter hiển thị trên trang hiện tại
    const indexOfLastChapter = currentPage * chaptersPerPage;
    const indexOfFirstChapter = indexOfLastChapter - chaptersPerPage;
    const currentChapters = chapters.slice(indexOfFirstChapter, indexOfLastChapter);
    const totalPages = Math.ceil(chapters.length / chaptersPerPage);

    // Xử lý chuyển trang
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Xử lý thêm/xóa yêu thích
    const handleToggleFavorite = async () => {
        if (!isLogin) {
            alert('Vui lòng đăng nhập để thêm vào danh sách yêu thích');
            return;
        }

        if (!id) return;

        try {
            setFavoriteLoading(true);

            if (isFavorite) {
                // Xóa khỏi danh sách yêu thích
                const success = await profileService.removeFavorite(id);
                if (success) {
                    setIsFavorite(false);
                    // Cập nhật số lượng yêu thích trên UI
                    if (manga) {
                        setManga({
                            ...manga,
                            loves: Math.max(0, (manga.loves || 0) - 1)
                        });
                    }
                }
            } else {
                // Thêm vào danh sách yêu thích
                const result = await profileService.addFavorite(id);
                if (result) {
                    setIsFavorite(true);
                    // Cập nhật số lượng yêu thích trên UI
                    if (manga) {
                        setManga({
                            ...manga,
                            loves: (manga.loves || 0) + 1
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi khi thao tác với danh sách yêu thích:', error);
        } finally {
            setFavoriteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !manga) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error || 'Không tìm thấy thông tin manga'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Breadcrumb */}
            <ul className="mb-2 inline-flex items-center gap-4">
                <li>
                    <Link className="text-blue-500 transition hover:text-blue-700" to="/">
                        <span>Trang chủ</span>
                    </Link>
                </li>
                <li className="text-gray-500">/</li>
                <li>
                    <Link className="text-blue-500 transition hover:text-blue-700" to={`/mangas/${manga?.id}`}>
                        <span>{manga?.title || 'Đang tải...'}</span>
                    </Link>
                </li>
            </ul>

            {/* Manga Header */}
            <article className="dark:text-foreground">
                <div className="mb-6">
                    <h1 className="my-0 mb-4 text-3xl font-semibold leading-tight text-center md:text-left">{manga.title}</h1>
                    <div className="flex flex-wrap justify-center md:justify-between items-center gap-4 text-gray-500">
                        <div className="flex gap-6">
                            <button
                                onClick={handleToggleFavorite}
                                disabled={favoriteLoading}
                                className="flex items-center hover:opacity-80 transition-opacity"
                            >
                                <FontAwesomeIcon
                                    icon={isFavorite ? faHeartSolid : faHeartRegular}
                                    className={`mr-2 ${isFavorite ? 'text-red-500' : 'text-gray-400'} ${favoriteLoading ? 'animate-pulse' : ''}`}
                                />
                                <span className="text-white">{manga.loves || 0}</span>
                            </button>
                            <span className="flex items-center">
                  <FontAwesomeIcon icon={faEye} className="mr-2 text-blue-500"/>
                  <span className="text-white">{manga.views || 0}</span>
                </span>
                            <span className="flex items-center">
                  <FontAwesomeIcon icon={faComment} className="mr-2 text-yellow-500"/>
                  <span className="text-white">{totalComments || 0}</span>
                </span>
                        </div>
                        <span className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-2 text-green-500"/>
                <span>
                  <span className="hidden md:inline">Cập nhật lúc: </span>
                  <span className="text-white font-medium">
                    {manga.lastChapterAddedAt
                        ? formatDistanceToNow(new Date(manga.lastChapterAddedAt), {addSuffix: true, locale: vi})
                        : 'Chưa cập nhật'}
                  </span>
                </span>
              </span>
                    </div>
                </div>

                {/* Manga Info */}
                <div className="detail-info mb-10">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
                        <div className="mx-auto md:mx-0" style={{maxWidth: '300px'}}>
                            <div className="relative w-full">
                                <div style={{position: 'relative', width: '100%', paddingBottom: '150%'}}>
                                    <div className="overflow-hidden rounded-lg shadow-lg"
                                         style={{position: 'absolute', inset: 0}}>
                                        <img
                                            className="h-full w-full object-cover"
                                            src={"http://localhost:8888/api/v1/upload/files/" + manga.coverUrl || '/images/default-manga-cover.jpg'}
                                            alt={manga.title}
                                        />
                                    </div>
                                </div>

                                {/* Đọc ngay button for mobile */}
                                <div className="mt-4 md:hidden">
                                    <Link
                                        to={chapters.length > 0 ? `/mangas/${manga.id}/chapters/${chapters[chapters.length - 1].id}` : '#'}
                                        className={`w-full justify-center whitespace-nowrap rounded-md font-medium transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      disabled:pointer-events-none disabled:opacity-50 flex h-auto items-center gap-4
                      bg-blue-500 px-4 py-3 text-[14px] text-white hover:bg-blue-600
                      ${chapters.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                      <span className="shrink-0">
                        <FontAwesomeIcon icon={faEye}/>
                      </span>
                                        Đọc ngay
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div>
                            <ul className="space-y-4">
                                {manga.anotherTitle && (
                                    <li className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-2">
                                        <p className="name text-gray-500 flex items-center">
                                            <FontAwesomeIcon icon={faStar} className="mr-2 text-yellow-500"/> Tên khác
                                        </p>
                                        <p className="other-name text-white">
                                            <span>{manga.anotherTitle}</span>
                                        </p>
                                    </li>
                                )}
                                <li className="author grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-2">
                                    <p className="name text-gray-500 flex items-center">
                                        <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-400"/> Tác giả
                                    </p>
                                    <p className="text-white">{manga.author}</p>
                                </li>
                                <li className="year grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-2">
                                    <p className="name text-gray-500 flex items-center">
                                        <FontAwesomeIcon icon={faClock} className="mr-2 text-yellow-400"/> Năm phát hành
                                    </p>
                                    <p className="text-white">
                                        {manga.yearOfRelease || new Date(manga.updatedAt).getFullYear()}
                                    </p>
                                </li>
                                <li className="status grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-2">
                                    <p className="name text-gray-500 flex items-center">
                                        <FontAwesomeIcon icon={faRss} className="mr-2 text-green-400"/> Tình trạng
                                    </p>
                                    <p className="text-white">
                                        {manga.status ? MangaStatusDisplayNames[manga.status] : 'Đang tiến hành'}
                                    </p>
                                </li>
                                <li className="kind grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-2">
                                    <p className="name text-gray-500 flex items-center">
                                        <FontAwesomeIcon icon={faTags} className="mr-2 text-purple-400"/> Thể loại
                                    </p>
                                    <p className="flex flex-wrap gap-2">
                                        {manga.genres.map((genre, index) => (
                                            <React.Fragment key={genre}>
                                                <Link
                                                    className="text-blue-400 transition hover:text-blue-300 bg-gray-800 px-2 py-1 rounded-md text-sm"
                                                    to={`/genres/${genre}`}
                                                >
                                                    {genre}
                                                </Link>
                                                {index < manga.genres.length - 1 && <span className="hidden">, </span>}
                                            </React.Fragment>
                                        ))}
                                    </p>
                                </li>

                                {/* Đọc ngay button for desktop */}
                                <li className="hidden md:block pt-4">
                                    <Link
                                        to={chapters.length > 0 ? `/mangas/${manga.id}/chapters/${chapters[chapters.length - 1].id}` : '#'}
                                        className={`justify-center whitespace-nowrap rounded-md font-medium transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      disabled:pointer-events-none disabled:opacity-50 flex h-auto items-center gap-4
                      bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 w-auto
                      ${chapters.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                      <span className="shrink-0">
                        <FontAwesomeIcon icon={faEye}/>
                      </span>
                                        Đọc ngay
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* Manga Description */}
                <div className="detail-content mb-10">
                    <h2 className="mb-4 flex items-center gap-4 text-2xl font-medium text-blue-500 border-b border-gray-700 pb-2">
                        <FontAwesomeIcon icon={faPen}/>
                        <span>Nội dung</span>
                    </h2>
                    <div className="w-full bg-gray-800 rounded-lg p-4 shadow-md">
                        <div className="w-full [&_pre]:whitespace-pre-wrap [&_pre]:break-words text-white">
                            <p className="leading-relaxed">{manga.description}</p>
                        </div>
                        <p className="text-gray-400 mt-4 text-sm border-t border-gray-700 pt-4">
                            Truyện tranh <Link className="text-blue-400 transition hover:text-blue-300 font-medium"
                                               to={`/mangas/${manga.id}`}>{manga.title}</Link> được
                            cập nhật nhanh và đầy đủ nhất tại <Link
                            className="text-blue-400 transition hover:text-blue-300 font-medium"
                            to="/">R-Manga</Link>.
                        </p>
                    </div>
                </div>

                {/* Chapter List */}
                <div id="nt_listchapter">
                    <h2 className="mb-4 flex items-center gap-4 text-2xl font-medium text-blue-500 border-b border-gray-700 pb-2">
                        <FontAwesomeIcon icon={faList}/>
                        <span>Danh sách chương</span>
                    </h2>
                    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 shadow-md">
                        <div
                            className="heading grid grid-cols-1 md:grid-cols-[5fr_4fr_3fr] border-b border-gray-700 pb-4 text-gray-300 font-medium">
                            <div className="no-wrap hidden md:block">Tên chương</div>
                            <div className="no-wrap hidden md:block text-center">Cập nhật</div>
                            <div className="no-wrap hidden md:block text-right">Lượt xem</div>
                        </div>
                        <nav>
                            <ul className="flex flex-col gap-2 py-2 text-sm">
                                {currentChapters.length > 0 ? (
                                    currentChapters.map((chapter) => (
                                        <li key={chapter.chapterNumber}
                                            className="grid grid-cols-1 md:grid-cols-[5fr_4fr_3fr] gap-2 py-3 border-b border-gray-700 last:border-0 hover:bg-gray-700 rounded transition-colors">
                                            <div>
                                                <Link
                                                    className="text-blue-400 transition hover:text-blue-300 font-medium block"
                                                    to={`/mangas/${manga.id}/chapters/${chapter.id}`}
                                                >
                                                    {chapter.title}
                                                </Link>
                                                <div
                                                    className="md:hidden flex justify-between mt-2 text-gray-400 text-xs">
                                                    <span>{formatDistanceToNow(new Date(chapter.updatedAt), {
                                                        addSuffix: true,
                                                        locale: vi
                                                    })}</span>
                                                    <span>{chapter.views || 0} lượt xem</span>
                                                </div>
                                            </div>
                                            <div className="no-wrap hidden md:block text-center text-gray-400">
                                                {formatDistanceToNow(new Date(chapter.updatedAt), {
                                                    addSuffix: true,
                                                    locale: vi
                                                })}
                                            </div>
                                            <div className="hidden md:block text-right text-gray-400">
                                                {chapter.views || 0} lượt xem
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="py-4 text-center text-gray-400">Chưa có chapter nào</li>
                                )}
                            </ul>
                        </nav>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                            <div className="pagination-outter w-full md:w-auto">
                                <ul className="pagination flex flex-wrap justify-center md:justify-start gap-2"
                                    role="navigation" aria-label="Pagination">
                                    <li className={`text-center ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <button
                                            onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                                            aria-label="Previous page"
                                        >
                                            &lt;
                                        </button>
                                    </li>

                                    {Array.from({length: totalPages}, (_, i) => i + 1)
                                        .filter(page =>
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        )
                                        .map((page, index, array) => {
                                            // Add ellipsis
                                            if (index > 0 && array[index - 1] !== page - 1) {
                                                return (
                                                    <React.Fragment key={`ellipsis-${page}`}>
                                                        <li className="text-center opacity-50 cursor-not-allowed">
                                                            <span className="px-3 py-2 text-gray-400">...</span>
                                                        </li>
                                                        <li>
                                                            <button
                                                                onClick={() => paginate(page)}
                                                                className={`px-3 py-2 rounded border ${
                                                                    currentPage === page
                                                                        ? 'bg-blue-600 text-white border-blue-700'
                                                                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                                }`}
                                                                aria-label={`Page ${page}`}
                                                                aria-current={currentPage === page ? 'page' : undefined}
                                                            >
                                                                {page}
                                                            </button>
                                                        </li>
                                                    </React.Fragment>
                                                );
                                            }

                                            return (
                                                <li key={page}>
                                                    <button
                                                        onClick={() => paginate(page)}
                                                        className={`px-3 py-2 rounded border ${
                                                            currentPage === page
                                                                ? 'bg-blue-600 text-white border-blue-700'
                                                                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                        }`}
                                                        aria-label={`Page ${page}`}
                                                        aria-current={currentPage === page ? 'page' : undefined}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            );
                                        })}

                                    <li className={`text-center ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <button
                                            onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                                            aria-label="Next page"
                                        >
                                            &gt;
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <p className="mb-0 py-2 text-gray-400 text-sm">
                                Đã hiển thị <span
                                className="text-white font-medium">{currentChapters.length} / {chapters.length}</span> chương
                            </p>
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
};

export default MangaDetail;