import Header from "../Header.jsx";
import Footer from "../Footer.jsx";

const Master = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900">
            <Header />
            <section className={'flex-grow pt-16'}>
                {children}
            </section>
            <Footer />
        </div>
    )
}

export default Master;