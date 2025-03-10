const Header = () => {
    return (
        <div className="p-4 bg-black flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <h1 className="text-[40px] uppercase font-bold text-red-700">Manga</h1>
                <nav className="flex items-center space-x-4">
                    <a href="#" className= "text-white">Home</a>
                    <a href="#" className= "text-white">Tags</a>
                    <a href="#" className= "text-white">About</a>
                    <a href="#" className= "text-white">Contact</a>
                </nav>
            </div>

        </div>
    )
}

export default Header;