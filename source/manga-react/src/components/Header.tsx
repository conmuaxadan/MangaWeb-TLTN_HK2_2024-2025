import {useState, useRef} from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
    const [showSearch, setShowSearch] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const { isLogin, logout } = useAuth();
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearchClick = () => {
        setShowSearch(true);
        // Focus vào input khi hiển thị form tìm kiếm
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 100);
    };

    const handleBodyClick = () => {
        setShowSearch(false);
        setSearchKeyword('');
    };

    const handleInputClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchKeyword(e.target.value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchKeyword.trim()) {
            navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
            setShowSearch(false);
            setSearchKeyword('');
        }
    };

    const handleMenuClick = () => {
        setShowMenu(!showMenu);
    }

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate('/');
    }


    return (
        <div>
            {showSearch ? (
                <div>
                <div className="fixed inset-0 bg-black opacity-70 z-50 " onClick={handleBodyClick} >
                </div>
                <div onClick={handleInputClick}
                     className="fixed top-0 left-0 w-full bg-zinc-900 p-4 z-50 transform transition-all flex flex-col items-center shadow">
                    <form onSubmit={handleSearchSubmit} className="max-w-screen-md w-full">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchKeyword}
                                onChange={handleSearchInputChange}
                                placeholder="Tìm kiếm truyện"
                                className="px-4 py-2 text-black bg-gray-300 focus:bg-gray-300 transition duration-300 ease-in-out rounded-lg w-full outline-none focus:ring focus:ring-gray-300"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                            >
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </form>
                </div>
                </div>
            ) : (
                <nav className="bg-zinc-900 px-2 z-40 top-0 left-0 w-full fixed">
                    <div className="max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto">
                        <div className="flex justify-between items-stretch py-2 gap-4">
                            <div className="flex-1 items-center gap-3 hidden lg:flex">
                                <Link to="/"
                                   className="mr-2 font-display font-bold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60">
                                    Trang chủ
                                </Link>
                                <Link to="/search"
                                   className="mr-2 font-display font-bold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60">
                                    Tìm kiếm
                                </Link>
                                <Link to="/"
                                   className="mr-2 font-display font-bold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60">
                                    Lịch sử
                                </Link>
                                <Link to="/"
                                   className="font-display font-bold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60">
                                    Hot
                                </Link>
                            </div>
                            <div className="flex-1 flex lg:justify-center items-center max-w-full">
                                <Link
                                    to="/"
                                    aria-current="page"
                                    className="font-display font-extrabold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60"
                                >
                                    R-Manga
                                </Link>
                            </div>
                            <div className="flex-1 flex justify-end max-w-full">
                                <button onClick={handleSearchClick}
                                        className="p-2 text-white bg-gray-700 rounded-3xl w-12 h-12">
                                    <i className="fas fa-search"></i>
                                </button>
                                <div className="relative ml-2">
                                    <button onClick={handleMenuClick}
                                            className="p-2 text-white bg-gray-700 rounded-3xl w-12 h-12">
                                        <i className="fas fa-bars"></i>
                                    </button>
                                    {showMenu && (
                                        <div
                                            className="min-w-30 bg-gray-700 absolute shadow-lg rounded-lg mt-2 right-0 overflow-hidden flex flex-col whitespace-nowrap text-white z-10">
                                            {!isLogin ? (
                                                <>
                                                    <Link to="/login"
                                                       className="p-2 text-white hover:bg-gray-100 hover:text-black">Đăng
                                                        nhập</Link>
                                                    <Link to="/register"
                                                       className="p-2 text-white hover:bg-gray-100 hover:text-black">Đăng ký</Link>
                                                </>
                                            ):(
                                                <>
                                                    <Link to="/profile"
                                                       className="p-2 text-white hover:bg-gray-100 hover:text-black">Trang cá nhân</Link>
                                                    <a href="#"
                                                       onClick={handleLogout}
                                                       className="p-2 text-white hover:bg-gray-100 hover:text-black">Đăng
                                                        xuất</a>
                                                </>
                                            )}
                                            <div className="lg:hidden flex flex-col">
                                                <div className="border-b border-amber-50"></div>
                                                <Link to="/search"
                                                   className="p-2 text-white hover:bg-gray-100 hover:text-black">Tìm kiếm</Link>
                                                <Link to="/"
                                                   className="p-2 text-white hover:bg-gray-100 hover:text-black">Lịch sử</Link>
                                                <Link to="/"
                                                   className="p-2 text-white hover:bg-gray-100 hover:text-black">Bảng xếp
                                                    hạng</Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>)}
            <div className="h-15"></div>
        </div>
    );
};

export default Header;