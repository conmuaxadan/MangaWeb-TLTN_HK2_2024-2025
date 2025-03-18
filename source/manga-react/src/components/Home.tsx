import MangaList from "./MangaList.tsx";
import Banner from "./Banner.tsx";

const Home = () => {
    return (
        <div className={'bg-zinc-800'}>

            <div className="max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto">
                <Banner/>
                <MangaList/>
            </div>

        </div>
    )
}

export default Home;