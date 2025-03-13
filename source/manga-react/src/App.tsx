import {Route, Routes} from "react-router-dom"
import {routes} from "./routes"


function App() {
    return (
        <>
            <Routes>
                {routes.map((route, index) => (
                    <Route
                        key={index}
                        path={route.path}
                        element={(
                            <route.Layout>
                                <route.Component/>
                            </route.Layout>
                        )
                        }
                    />
                ))}
            </Routes>
        </>
    )
}

export default App
