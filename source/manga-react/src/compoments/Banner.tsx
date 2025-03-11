import bannerImage from '../assets/banner.jpg';
import avtar from '../assets/avt.jpg';

const Banner = () => {
    return (
        <div className="w-full h-[700px] bg-center bg-no-repeat bg-cover relative" style={{ backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="absolute w-full h-full top-0 left-0 bg-black opacity-30" />

            <div className="w-full h-full flex items-center justify-center p-4 relative z-20">
                <div className="flex flex-col space-y-5 items-baseline w-[50%] ml-20">
                    <p className="text-white bg-gradient-to-r from-red-600 to-red-300 text-md py-1 px-3">Hot</p>
                    <div className="flex flex-col space-y-4">
                        <h2 className="text-white text-3xl font-bold">Doraemon</h2>
                        <p className="text-white text-lg">
                            One Piece kể về cuộc hành trình của Monkey D. Luffy - thuyền trưởng của băng hải tặc Mũ Rơm và các đồng đội của cậu. Luffy tìm kiếm vùng biển bí ẩn nơi cất giữ kho báu lớn nhất thế giới One Piece, với ước mơ trở thành Vua Hải Tặc.
                        </p>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 text-white bg-black font-bold text-lg rounded-md">Chi tiết</button>
                            <button className="p-2 text-white bg-red-600 font-bold text-lg rounded-md">Đọc ngay</button>
                        </div>
                    </div>
                </div>
                <div className="w-[50%] flex justify-center">
                    <div className="w-[300px] h-[400px] relative">
                        <img src={avtar} alt="temp" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Banner;