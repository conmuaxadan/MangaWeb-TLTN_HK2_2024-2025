import Home from "../compoments/Home.tsx";
import Master from "../compoments/layouts/Master.tsx";
import {IRoute} from "../interfaces/IRoute.ts";
import {RouteType} from "../consts/RouteType.ts";

export const routes: IRoute[] = [
    {
        path: '/',
        Component: Home,
        Layout: Master,
        routeType: RouteType.PUBLIC
    }
]