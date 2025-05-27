import {
    Home,
    Login,
    Register,
    Authenticate,
    MangaDetail,
    Chapter,
    Profile,
    ProfileSettings,
    AdvancedSearch,
    FavoriteList,
    ReadingHistoryList,
    GenreDetail,
    LinkedAccounts,
    ForgotPassword
} from "../pages/index.js";
import { Master } from "../components/layouts/index.jsx";

// Định nghĩa các route cho ứng dụng
export const routes = [
    // Route công khai - không yêu cầu đăng nhập
    {
        path: '/',
        Component: Home,
        Layout: Master,
        requireAuth: false
    },

    // Route xác thực - không cho phép người dùng đã đăng nhập truy cập
    {
        path: '/login',
        Component: Login,
        Layout: Master,
        requireAuth: false
    },
    {
        path: '/register',
        Component: Register,
        Layout: Master,
        requireAuth: false
    },
    {
        path: '/forgot-password',
        Component: ForgotPassword,
        Layout: Master,
        requireAuth: false
    },
    {
        path: '/authenticate',
        Component: Authenticate,
        Layout: Master,
        requireAuth: false
    },

    // Route chi tiết manga
    {
        path: '/mangas/:id',
        Component: MangaDetail,
        Layout: Master,
        requireAuth: false
    },

    // Route hiển thị chapter
    {
        path: '/mangas/:id/chapters/:chapterId',
        Component: Chapter,
        Layout: Master,
        requireAuth: false
    },

    // Route tìm kiếm nâng cao
    {
        path: '/search',
        Component: AdvancedSearch,
        Layout: Master,
        requireAuth: false
    },

    // Route hiển thị truyện theo thể loại
    {
        path: '/genre/:genreName',
        Component: GenreDetail,
        Layout: Master,
        requireAuth: false
    },

    // Các route yêu cầu đăng nhập
    {
        path: '/profile',
        Component: Profile,
        Layout: Master,
        requireAuth: true
    },
    {
        path: '/profile/settings',
        Component: ProfileSettings,
        Layout: Master,
        requireAuth: true
    },
    {
        path: '/profile/favorites',
        Component: FavoriteList,
        Layout: Master,
        requireAuth: true
    },
    {
        path: '/profile/reading-history',
        Component: ReadingHistoryList,
        Layout: Master,
        requireAuth: true
    },
    {
        path: '/profile/linked-accounts',
        Component: LinkedAccounts,
        Layout: Master,
        requireAuth: true
    },
]