import Master from "../components/layouts/Master.tsx";
import {IRoute} from "../interfaces/IRoute.ts";
import {
    Home,
    Login,
    Register,
    Authenticate,
    MangaDetail,
    Chapter,
    Profile,
    ProfileSettings,
    AdvancedSearch
} from "../pages";

// Định nghĩa các route cho ứng dụng
export const routes: IRoute[] = [
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
]