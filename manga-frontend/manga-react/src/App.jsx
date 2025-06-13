import {Route, Routes} from "react-router-dom"
import {routes} from "./routes"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/guards/AuthGuard";

function App() {
    return (
        <AuthProvider>
            <Routes>
                {routes.map((route, index) => (
                    <Route
                        key={index}
                        path={route.path}
                        element={(
                            <AuthGuard requireAuth={route.requireAuth}>
                                <route.Layout>
                                    <route.Component/>
                                </route.Layout>
                            </AuthGuard>
                        )}
                    />
                ))}
            </Routes>
            <ToastContainer/>
        </AuthProvider>
    )
}

export default App
