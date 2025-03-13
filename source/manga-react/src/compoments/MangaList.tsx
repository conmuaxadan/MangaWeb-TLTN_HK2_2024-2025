import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/navigation';
import avtar from '../assets/avt.jpg';
import avtar1 from '../assets/avt1.jpg';
import avtar2 from '../assets/avt2.jpg';
import avtar3 from '../assets/avt3.jpg';
import avtar4 from '../assets/avt4.jpg';
import avtar5 from '../assets/avt5.jpg';
import avtar6 from '../assets/avt6.jpg';
import avtar7 from '../assets/avt7.jpg';
import * as React from "react";

const mangaList = [
    { id: 1, title: 'JoJo\'s Bizarre Adventure Part 7', image: avtar1 },
    { id: 2, title: 'Naruto', image: avtar2 },
    { id: 3, title: 'One Piece', image: avtar },
    { id: 4, title: 'Dragon Ball', image: avtar4 },
    { id: 5, title: 'Bleach', image: avtar3 },
    { id: 6, title: 'Attack on Titan', image: avtar5 },
    { id: 7, title: 'Fairy Tail', image: avtar6 },
    { id: 8, title: 'Fullmetal Alchemist', image: avtar7 },
];

interface MangaListProps {
    title: string;
}

const MangaList: React.FC<MangaListProps> = ({title}) => {
    return (
        <div>
            <div className="text-white p-10 ml-10">
                <h2 className="text-3xl font-bold mb-4">{title}</h2>
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={1}
                    slidesPerView={5}
                    navigation
                >
                    {mangaList.map((manga) => (
                        <SwiperSlide key={manga.id}>
                            <div className="w-[200px] h-[300px] relative group">
                                <div className="group-hover:scale-105 transition-transform duration-500 ease-in-out w-full h-full">
                                    <div className="absolute w-full h-full top-0 left-0 bg-black/30"></div>
                                    <img src={manga.image} alt={manga.title} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-5 left-2">
                                        <p className="uppercase text-md">{manga.title}</p>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default MangaList;