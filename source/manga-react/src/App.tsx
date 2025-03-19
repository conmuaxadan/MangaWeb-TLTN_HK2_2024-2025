import {Route, Routes} from "react-router-dom"
import {routes} from "./routes"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


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
            <ToastContainer/>
        </>
    )
}

export default App
