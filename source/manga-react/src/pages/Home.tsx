import RecommendedManga from "../components/RecommendedManga.tsx";
import LatestUpdates from "../components/LatestUpdates.tsx";
import TopManga from "../components/TopManga.tsx";
import RecentComments from "../components/RecentComments.tsx";

const Home = () => {
    return (
        <main className="main bg-gray-900 text-white min-h-screen">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col gap-[40px]">
                    {/* Truyện đề cử */}
                    <RecommendedManga />

                    {/* Grid layout cho phần chính và sidebar */}
                    <div className="grid grid-cols-1 gap-[40px] lg:grid-cols-3">
                        {/* Phần chính - Truyện mới cập nhật */}
                        <div className="lg:col-span-2">
                            <LatestUpdates />
                        </div>

                        {/* Sidebar */}
                        <div className="flex flex-col gap-[20px]">
                            {/* Bảng xếp hạng */}
                            <TopManga />

                            {/* Bình luận gần đây */}
                            <RecentComments />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Home;