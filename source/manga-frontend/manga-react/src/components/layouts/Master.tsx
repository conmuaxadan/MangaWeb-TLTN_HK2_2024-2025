import Header from "../Header.tsx";
import Footer from "../Footer.tsx";
import {ILayout} from "../../interfaces/ILayout.ts";

const Master: React.FC<ILayout> = ({ children }) => {
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