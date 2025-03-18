import {Swiper, SwiperSlide} from 'swiper/react';
import {Navigation} from 'swiper/modules';
// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/navigation';

import avtar from '../assets/avt.jpg';
import avtar1 from "../assets/avt1.jpg";
import avtar2 from "../assets/avt2.jpg";
import avtar4 from "../assets/avt4.jpg";
import avtar3 from "../assets/avt3.jpg";
import avtar5 from "../assets/avt5.jpg";
import avtar6 from "../assets/avt6.jpg";
import avtar7 from "../assets/avt7.jpg";

const mangaList = [
    {id: 1, title: 'JoJo\'s Bizarre Adventure Part 7', image: avtar1},
    {id: 2, title: 'Naruto', image: avtar2},
    {id: 3, title: 'One Piece', image: avtar},
    {id: 4, title: 'Dragon Ball', image: avtar4},
    {id: 5, title: 'Bleach', image: avtar3},
    {id: 6, title: 'Attack on Titan', image: avtar5},
    {id: 7, title: 'Fairy Tail', image: avtar6},
    {id: 8, title: 'Fullmetal Alchemist', image: avtar7},
];


const Banner = () => {
    return (
        <Swiper
            modules={[Navigation]}
            spaceBetween={1}
            slidesPerView={1}
            navigation
            loop={true}
        >
            {mangaList.map((manga) => (
                <SwiperSlide key={manga.id}>

                    <div
                        className="mx-auto h-[250px] sm:h-[250px] md:h-[350px] lg:h-[500px] bg-center bg-no-repeat bg-cover relative rounded-2xl"
                        style={{
                            backgroundImage: `url(${manga.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}>
                        <a href="/mangas/1">
                            <div className="absolute w-full h-full top-0 left-0 bg-black opacity-50 rounded-2xl"/>
                            <div className="w-full h-full flex p-4 relative z-20 items-end">
                                <div className="flex flex-col space-y-5 items-baseline w-full md:w-[50%] ml-0 md:pl-20">
                                    <div className="flex flex-col space-y-4">
                                        <h2 className="text-white text-2xl md:text-3xl font-bold">{manga.title}</h2>
                                        <p className="text-white md:text-lg line-clamp-3">
                                            One Piece kể về cuộc hành trình của Monkey D. Luffy - thuyền trưởng của băng
                                            hải tặc Mũ Rơm và các đồng đội của cậu. Luffy tìm kiếm vùng biển bí ẩn nơi
                                            cất giữ kho báu lớn nhất thế giới One Piece, với ước mơ trở thành Vua Hải
                                            Tặc.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-5 items-baseline w-full md:w-[50%]">
                                    <img className="hidden md:ml-30 lg:ml-60 md:flex sm:w-1/2 md:w-2/5"
                                        width="240" height="320" src={manga.image} alt={manga.title}/>
                                </div>
                            </div>
                        </a>
                    </div>

                </SwiperSlide>
            ))}
        </Swiper>
    )
}

export default Banner;