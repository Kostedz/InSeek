import {Outlet} from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
function PageLayout ({user}) {
  return (
    <div id="pagelayout" className="flex min-h-screen flex-col bg-canvas text-ink">
      <Header user={user}/>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
export default PageLayout;
