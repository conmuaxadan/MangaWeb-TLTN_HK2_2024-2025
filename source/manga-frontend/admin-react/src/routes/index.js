import AdminLayout from "../components/layouts/AdminLayout.jsx";

// Admin pages
import Dashboard from "../pages/admin/Dashboard.jsx";
import UserManagement from "../pages/admin/UserManagement.jsx";
import MangaManagement from "../pages/admin/MangaManagement.jsx";
import ChapterManagement from "../pages/admin/ChapterManagement.jsx";
import GenreManagement from "../pages/admin/GenreManagement.jsx";
import CommentManagement from "../pages/admin/CommentManagement.jsx";
import Statistics from "../pages/admin/Statistics.jsx";
import RoleManagement from "../pages/admin/RoleManagement.jsx";
import PermissionManagement from "../pages/admin/PermissionManagement.jsx";
import Login from "../pages/admin/Login.jsx";

// Translator pages
import TranslatorMyMangas from "../pages/translator/TranslatorMyMangas.jsx";
import TranslatorMyChapters from "../pages/translator/TranslatorMyChapters.jsx";

// Common components
import DefaultRedirect from "../components/common/DefaultRedirect.jsx";
import Unauthorized from "../pages/common/Unauthorized.jsx";

// Định nghĩa các route cho ứng dụng
export const routes = [
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
    {
        path: '/unauthorized',
        Component: Unauthorized,
        Layout: null,
        requireAuth: false
    },

    // Admin routes
    {
        path: '/admin',
        Component: DefaultRedirect,
        Layout: null,
        requireAuth: true
    },
    {
        path: '/admin/dashboard',
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

    // Translator routes
    {
        path: '/translator',
        Component: DefaultRedirect,
        Layout: null,
        requireAuth: true
    },
    {
        path: '/translator/my-mangas',
        Component: TranslatorMyMangas,
        Layout: AdminLayout,
        requireAuth: true
    },
    {
        path: '/translator/my-chapters',
        Component: TranslatorMyChapters,
        Layout: AdminLayout,
        requireAuth: true
    },
]
