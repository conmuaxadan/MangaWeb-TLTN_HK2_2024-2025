import AdminLayout from "../components/layouts/AdminLayout.tsx";
import {IRoute} from "../interfaces/IRoute.ts";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import MangaManagement from "../pages/admin/MangaManagement";
import ChapterManagement from "../pages/admin/ChapterManagement";
import GenreManagement from "../pages/admin/GenreManagement";
import CommentManagement from "../pages/admin/CommentManagement";
import Statistics from "../pages/admin/Statistics";
import RoleManagement from "../pages/admin/RoleManagement";
import PermissionManagement from "../pages/admin/PermissionManagement";
import Login from "../pages/admin/Login";

// Định nghĩa các route cho ứng dụng
export const routes: IRoute[] = [
    // Route xác thực
    {
        path: '/',
        Component: Login,
        Layout: null,
        requireAuth: false
    },
    {
        path: '/login',
        Component: Login,
        Layout: null,
        requireAuth: false
    },

    // Admin routes
    {
        path: '/admin',
        Component: Dashboard,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/admin/users',
        Component: UserManagement,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/admin/mangas',
        Component: MangaManagement,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/admin/chapters',
        Component: ChapterManagement,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/admin/genres',
        Component: GenreManagement,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/admin/comments',
        Component: CommentManagement,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/admin/statistics',
        Component: Statistics,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/admin/roles',
        Component: RoleManagement,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/admin/permissions',
        Component: PermissionManagement,
        Layout: AdminLayout,
        requireAuth: true
    },
]