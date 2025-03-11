import { useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Header = () => {
    const [showSearch, setShowSearch] = useState(false);

    const handleSearchClick = () => {
        setShowSearch(true);
    };

    const handleBodyClick = () => {
        setShowSearch(false);
    };

    const handleInputClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    return (
        <div>
            {showSearch ? (
                <div className="fixed inset-0 bg-black z-50" onClick={handleBodyClick}>
                    <div className="p-4 bg-gray-800 flex items-center justify-center" onClick={handleInputClick}>
                        <input type="text" placeholder="Search..." className="p-2 text-black bg-white w-full max-w-md rounded-2xl"/>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <nav className="flex items-center space-x-4">
                            <a href="#" className="text-white">Trang chủ</a>
                            <a href="#" className="text-white">Thể loại</a>
                            <a href="#" className="text-white">Discord</a>
                            <a href="#" className="text-white">Contact</a>
                        </nav>
                    </div>
                    <h1 className="text-[30px] font-bold text-blue-500 flex-grow text-center">R-Manga</h1>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleSearchClick} className="p-2 text-white bg-gray-700 rounded-3xl w-10">
                            <i className="fas fa-search"></i>
                        </button>
                        <button className="ml-5 p-2 text-white bg-gray-950 w-25 rounded-md">Đăng nhập</button>
                    </div>
                </div>
            )}
            <div className={`${showSearch ? 'bg-black' : 'bg-gray-900'}`}>
                {/* Body content goes here */}
            </div>
        </div>
    );
};

export default Header;