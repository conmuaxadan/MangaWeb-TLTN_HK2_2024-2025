import Home from "../components/Home.tsx";
import Login from "../components/Login.tsx";
import Master from "../components/layouts/Master.tsx";
import {IRoute} from "../interfaces/IRoute.ts";
import {RouteType} from "../consts/RouteType.ts";
import Register from "../components/Register.tsx";

export const routes: IRoute[] = [
    {
        path: '/',
        Component: Home,
        Layout: Master,
        routeType: RouteType.PUBLIC
    },
    {
        path: '/login',
        Component: Login,
        Layout: Master,
        routeType: RouteType.PUBLIC
    },
    {
        path: '/register',
        Component: Register,
        Layout: Master,
        routeType: RouteType.PUBLIC
    }

]