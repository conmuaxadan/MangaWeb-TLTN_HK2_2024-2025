import {Route, Routes} from "react-router-dom"
import {routes} from "./routes/index.js"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import AuthGuard from "./components/guards/AuthGuard.jsx";

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
                                {route.Layout ? (
                                    <route.Layout>
                                        <route.Component/>
                                    </route.Layout>
                                ) : (
                                    <route.Component/>
                                )}
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
