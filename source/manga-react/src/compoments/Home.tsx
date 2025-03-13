import MangaList from "./MangaList.tsx";
import Banner from "./Banner.tsx";

const Home = () => {
    return (
        <div className={'bg-gray-900'}>
            <Banner/>
            <div className="w-4/6">
                <MangaList title="Truyện Hot" />
            </div>

        </div>
    )
}

export default Home;