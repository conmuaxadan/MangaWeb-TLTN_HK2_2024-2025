import { ILayout } from "./ILayout"

export interface IRoute {
    path: string
    Component: React.ComponentType
    Layout: React.ComponentType<ILayout>
    routeType: number
}