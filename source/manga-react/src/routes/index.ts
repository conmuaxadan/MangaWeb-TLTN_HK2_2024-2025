import Home from "../components/Home.tsx";
import Login from "../components/Login.tsx";
import Master from "../components/layouts/Master.tsx";
import {IRoute} from "../interfaces/IRoute.ts";
import Register from "../components/Register.tsx";
import Authenticate from "../components/Authenticate.tsx";
import MangaDetail from "../components/MangaDetail.tsx";
import MangaChapter from "../components/MangaChapter.tsx";

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
        requireAuth: true
    },

    // Route hiển thị chapter
    {
        path: '/mangas/:id/chapters/:chapterNumber',
        Component: MangaChapter,
        Layout: Master,
        requireAuth: true
    },

    // Có thể thêm các route yêu cầu đăng nhập ở đây
    // {
    //     path: '/profile',
    //     Component: Profile,
    //     Layout: Master,
    //     requireAuth: true
    // },
]