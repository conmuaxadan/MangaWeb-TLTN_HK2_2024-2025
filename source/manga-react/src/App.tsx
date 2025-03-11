import Header from "./compoments/Header.tsx";
import Banner from "./compoments/Banner.tsx";
import MangaList from "./compoments/MangaList.tsx";
import Footer from "./compoments/Footer.tsx";

function App() {
  return (
      <div className="bg-gray-900">
        <Header/>
        <Banner/>
        <MangaList/>
        <Footer/>
      </div>
  )
}

export default App
