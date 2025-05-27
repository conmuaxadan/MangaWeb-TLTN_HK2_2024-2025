import RecommendedManga from "../components/RecommendedManga.jsx";
import LatestUpdates from "../components/LatestUpdates.jsx";
import TopManga from "../components/TopManga.jsx";
import RecentComments from "../components/RecentComments.jsx";
import NavigationToolbar from "../components/NavigationToolbar.jsx";
import PersonalRecommendations from "../components/PersonalRecommendations.jsx";

const Home = () => {
    return (
        <main className="main bg-gray-100 text-gray-900 min-h-screen">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col gap-[40px]">
                    {/* Thanh công cụ điều hướng - chỉ hiển thị trên PC */}
                    <NavigationToolbar />

                    {/* Truyện đề cử */}
                    <RecommendedManga />

                    {/* Có thể bạn muốn đọc - Chỉ hiển thị khi đã đăng nhập */}
                    <PersonalRecommendations />

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