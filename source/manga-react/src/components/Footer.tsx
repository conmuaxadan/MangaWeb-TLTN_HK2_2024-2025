const Footer = () => {
    return (
        <div className="bg-gray-950 flex items-center p-6">
            <div className="max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto">
                <div className="flex flex-col items-center text-sm text-gray-500 w-full">
                    <div className="mb-6 text-center">
                        <div className="text-green-200">Contact for work, copyright and more:</div>
                        <div><a href="mailto:ad.raindrop@gmail.com"
                                className="text-gray-400 hover:text-gray-300">ad.raindrop@gmail.com</a></div>
                    </div>
                    <div className="mb-6 text-center">
                        <div className="mb-1"><a className="text-gray-400 hover:text-gray-300">Điều khoản dịch vụ</a>
                        </div>
                        <div className="mb-1"><a className="text-gray-400 hover:text-gray-300">Chính sách bảo mật</a>
                        </div>
                    </div>
                    <div> © 2025 - raindrop</div>
                </div>
            </div>
        </div>
    )
}

export default Footer;