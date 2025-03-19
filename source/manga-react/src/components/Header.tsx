import {useEffect, useState} from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Header = () => {
    const [showSearch, setShowSearch] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isLogin, setIsLogin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLogin(true);
        }else{
            setIsLogin(false);
        }
    }, []);

    const handleSearchClick = () => {
        setShowSearch(true);
    };

    const handleBodyClick = () => {
        setShowSearch(false);
    };

    const handleInputClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    const handleMenuClick = () => {
        setShowMenu(!showMenu);
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLogin(false);
    }


    return (
        <div>
            {showSearch ? (
                <div>
                <div className="fixed inset-0 bg-black opacity-70 z-50 " onClick={handleBodyClick} >
                </div>
                <div onClick={handleInputClick}
                     className="fixed top-0 left-0 w-full bg-zinc-900 p-4 z-50 transform transition-all flex flex-col items-center shadow">
                    <div className="max-w-screen-md w-full">
                        <input
                            type="text"
                            placeholder="Tìm kiếm truyện"
                            className="px-4 py-2 text-black bg-gray-300 focus:bg-gray-300 transition duration-300 ease-in-out rounded-lg w-full outline-none focus:ring focus:ring-gray-300"
                        />
                    </div>
                </div>
                </div>
            ) : (
                <nav className="bg-zinc-900 px-2 z-40 top-0 left-0 w-full fixed">
                    <div className="max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto">
                        <div className="flex justify-between items-stretch py-2 gap-4">
                            <div className="flex-1 items-center gap-3 hidden lg:flex">
                                <a href="/"
                                   className="mr-2 font-display font-bold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60">
                                    Trang chủ
                                </a>
                                <a href="/"
                                   className="mr-2 font-display font-bold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60">
                                    Thể loại
                                </a>
                                <a href="/"
                                   className="mr-2 font-display font-bold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60">
                                    Lịch sử
                                </a>
                                <a href="/"
                                   className="font-display font-bold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60">
                                    Hot
                                </a>
                            </div>
                            <div className="flex-1 flex lg:justify-center items-center max-w-full">
                                <a
                                    href="/"
                                    aria-current="page"
                                    className="font-display font-extrabold uppercase select-none rounded-full flex items-center h-11 text-gray-300 text-opacity-60"
                                >
                                    R-Manga
                                </a>
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

                                                    <a href="/login"
                                                       className="p-2 text-white hover:bg-gray-100 hover:text-black">Đăng
                                                        nhập</a>
                                                <a href="/register"
                                                   className="p-2 text-white hover:bg-gray-100 hover:text-black">Đăng ký</a>
                                                </>
                                            ):(
                                                <a href="/"
                                                   onClick={handleLogout}
                                                   className="p-2 text-white hover:bg-gray-100 hover:text-black">Đăng
                                                    xuất</a>
                                                )}
                                            <div className="lg:hidden flex flex-col">
                                                <div className="border-b border-amber-50"></div>
                                                <a href="/login"
                                                   className="p-2 text-white hover:bg-gray-100 text-black">Thể loại</a>
                                                <a href="/register"
                                                   className="p-2 text-white hover:bg-gray-100 text-black">Lịch sử</a>
                                                <a href="/register"
                                                   className="p-2 text-white hover:bg-gray-100 text-black">Bảng xếp
                                                    hạng</a>
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