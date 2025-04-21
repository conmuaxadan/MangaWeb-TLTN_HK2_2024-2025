import Header from "../Header.tsx";
import Footer from "../Footer.tsx";
import {ILayout} from "../../interfaces/ILayout.ts";

const Master: React.FC<ILayout> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <Header />
            <section className={'flex-grow'}>
                {children}
            </section>
            <Footer />
        </div>
    )
}

export default Master;