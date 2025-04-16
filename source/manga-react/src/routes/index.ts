import Master from "../components/layouts/Master.tsx";
import {IRoute} from "../interfaces/IRoute.ts";
import {
    HomePage,
    LoginPage,
    RegisterPage,
    AuthenticatePage,
    MangaDetailPage,
    MangaChapterPage,
    ProfilePage,
    ProfileSettingsPage,
    AdvancedSearchPage
} from "../pages";

// Định nghĩa các route cho ứng dụng
export const routes: IRoute[] = [
    // Route công khai - không yêu cầu đăng nhập
    {
        path: '/',
        Component: HomePage,
        Layout: Master,
        requireAuth: false
    },

    // Route xác thực - không cho phép người dùng đã đăng nhập truy cập
    {
        path: '/login',
        Component: LoginPage,
        Layout: Master,
        requireAuth: false
    },
    {
        path: '/register',
        Component: RegisterPage,
        Layout: Master,
        requireAuth: false
    },
    {
        path: '/authenticate',
        Component: AuthenticatePage,
        Layout: Master,
        requireAuth: false
    },

    // Route chi tiết manga
    {
        path: '/mangas/:id',
        Component: MangaDetailPage,
        Layout: Master,
        requireAuth: false
    },

    // Route hiển thị chapter
    {
        path: '/mangas/:id/chapters/:chapterId',
        Component: MangaChapterPage,
        Layout: Master,
        requireAuth: false
    },

    // Route tìm kiếm nâng cao
    {
        path: '/search',
        Component: AdvancedSearchPage,
        Layout: Master,
        requireAuth: false
    },

    // Các route yêu cầu đăng nhập
    {
        path: '/profile',
        Component: ProfilePage,
        Layout: Master,
        requireAuth: true
    },
    {
        path: '/profile/settings',
        Component: ProfileSettingsPage,
        Layout: Master,
        requireAuth: true
    },
]