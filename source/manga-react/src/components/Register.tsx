const Register = () => {
    return (
        <div className="flex-grow min-h-screen bg-zinc-800">
            <div className="min-h-screen w-full flex justify-center items-center">
                <div className="max-w-screen-md md:w-5/12 m-4 p-8">
                    <div className="w-full flex justify-center">
                        <h1 className="text-xl font-bold text-white mb-12 font-head">
                            Đăng ký
                        </h1>
                    </div>
                    <form>
                        <div className="mb-8">
                            <label htmlFor="username" className="block text-white">
                                Tên đăng nhập
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Tên đăng nhập"
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                            />
                        </div>

                        <div className="mb-8">
                            <label htmlFor="email" className="block text-white">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Email"
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                            />
                        </div>

                        <div className="mb-8">
                            <label htmlFor="password" className="block text-white">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Mật khẩu"
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                            />
                        </div>

                        <div className="mb-8">
                            <label htmlFor="re-password" className="block text-white">
                                Nhập lại mật khẩu
                            </label>
                            <input
                                id="re-password"
                                type="password"
                                placeholder="Nhập lại mật khẩu"
                                className="w-full mt-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                            />
                        </div>

                        <div className="w-full flex justify-center mb-8">
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Đăng ký
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
export default Register;