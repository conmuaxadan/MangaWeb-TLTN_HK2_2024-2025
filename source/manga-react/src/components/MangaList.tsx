import avtar from '../assets/avt.jpg';
import avtar1 from '../assets/avt1.jpg';
import avtar2 from '../assets/avt2.jpg';
import avtar3 from '../assets/avt3.jpg';
import avtar4 from '../assets/avt4.jpg';
import avtar5 from '../assets/avt5.jpg';
import avtar6 from '../assets/avt6.jpg';
import avtar7 from '../assets/avt7.jpg';
import * as React from 'react';
import MangaCard from './MangaCard';

interface Manga {
    id: number;
    title: string;
    image: string;
    chapter: string;
    timeAgo: string;
    link: string;
    chapterLink: string;
}

const mangaList: Manga[] = [
    {
        id: 1,
        title: "JoJo's Bizarre Adventure Part 7",
        image: avtar1,
        chapter: 'C. 95',
        timeAgo: '18 phút trước',
        link: '/mangas/1',
        chapterLink: '/mangas/1/chapters/1001',
    },
    {
        id: 2,
        title: 'Naruto',
        image: avtar2,
        chapter: 'C. 700',
        timeAgo: '29 phút trước',
        link: '/mangas/2',
        chapterLink: '/mangas/2/chapters/1002',
    },
    {
        id: 3,
        title: 'One Piece',
        image: avtar,
        chapter: 'C. 1090',
        timeAgo: '39 phút trước',
        link: '/mangas/3',
        chapterLink: '/mangas/3/chapters/1003',
    },
    {
        id: 4,
        title: 'Dragon Ball',
        image: avtar4,
        chapter: 'C. 519',
        timeAgo: '1 giờ trước',
        link: '/mangas/4',
        chapterLink: '/mangas/4/chapters/1004',
    },
    {
        id: 5,
        title: 'Bleach',
        image: avtar3,
        chapter: 'C. 686',
        timeAgo: '2 giờ trước',
        link: '/mangas/5',
        chapterLink: '/mangas/5/chapters/1005',
    },
    {
        id: 6,
        title: 'Attack on Titan',
        image: avtar5,
        chapter: 'C. 139',
        timeAgo: '3 giờ trước',
        link: '/mangas/6',
        chapterLink: '/mangas/6/chapters/1006',
    },
    {
        id: 7,
        title: 'Fairy Tail',
        image: avtar6,
        chapter: 'C. 545',
        timeAgo: '4 giờ trước',
        link: '/mangas/7',
        chapterLink: '/mangas/7/chapters/1007',
    },
    {
        id: 8,
        title: 'Fullmetal Alchemist',
        image: avtar7,
        chapter: 'C. 108',
        timeAgo: '5 giờ trước',
        link: '/mangas/8',
        chapterLink: '/mangas/8/chapters/1008',
    },
    {
        id: 9,
        title: "JoJo's Bizarre Adventure Part 7",
        image: avtar1,
        chapter: 'C. 95',
        timeAgo: '18 phút trước',
        link: '/mangas/1',
        chapterLink: '/mangas/1/chapters/1001',
    },
    {
        id: 10,
        title: 'Naruto',
        image: avtar2,
        chapter: 'C. 700',
        timeAgo: '29 phút trước',
        link: '/mangas/2',
        chapterLink: '/mangas/2/chapters/1002',
    },
    {
        id: 11,
        title: 'One Piece',
        image: avtar,
        chapter: 'C. 1090',
        timeAgo: '39 phút trước',
        link: '/mangas/3',
        chapterLink: '/mangas/3/chapters/1003',
    },
    {
        id: 12,
        title: 'Dragon Ball',
        image: avtar4,
        chapter: 'C. 519',
        timeAgo: '1 giờ trước',
        link: '/mangas/4',
        chapterLink: '/mangas/4/chapters/1004',
    },
    {
        id: 13,
        title: 'Bleach',
        image: avtar3,
        chapter: 'C. 686',
        timeAgo: '2 giờ trước',
        link: '/mangas/5',
        chapterLink: '/mangas/5/chapters/1005',
    },
    {
        id: 14,
        title: 'Attack on Titan',
        image: avtar5,
        chapter: 'C. 139',
        timeAgo: '3 giờ trước',
        link: '/mangas/6',
        chapterLink: '/mangas/6/chapters/1006',
    },
    {
        id: 15,
        title: 'Fairy Tail',
        image: avtar6,
        chapter: 'C. 545',
        timeAgo: '4 giờ trước',
        link: '/mangas/7',
        chapterLink: '/mangas/7/chapters/1007',
    },
    {
        id: 16,
        title: 'Fullmetal Alchemist',
        image: avtar7,
        chapter: 'C. 108',
        timeAgo: '5 giờ trước',
        link: '/mangas/8',
        chapterLink: '/mangas/8/chapters/1008',
    },
    {
        id: 17,
        title: 'Fullmetal Alchemist',
        image: avtar7,
        chapter: 'C. 108',
        timeAgo: '5 giờ trước',
        link: '/mangas/8',
        chapterLink: '/mangas/8/chapters/1008',
    },
    {
        id: 18,
        title: 'Fullmetal Alchemist',
        image: avtar7,
        chapter: 'C. 108',
        timeAgo: '5 giờ trước',
        link: '/mangas/8',
        chapterLink: '/mangas/8/chapters/1008',
    }
];

const MangaList: React.FC = () => {
    return (
        <div className="flex-grow min-h-screen">
            <div className="mx-2 py-8 lg:py-16">
                <div className="common-container mb-8 lg:mb-12">
                    <div className="uppercase font-bold text-xl text-gray-300">
                        Mới cập nhật
                    </div>
                </div>

                <div className="common-container">
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                        {mangaList.map((manga) => (
                            <MangaCard key={manga.id} manga={manga}/>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end mt-5">
                    <a
                        href="/newest"
                        className="flex items-center text-gray-600 hover:text-blue-600 transition text-sm font-bold cursor-pointer"
                    >
                        {/* Chevron Right Icon */}
                        <span className="mr-1">{'>'} </span>
                        {/* Text */}
                        <span>Xem danh sách truyện</span>
                    </a>
                </div>
            </div>

        </div>
    );
};

export default MangaList;