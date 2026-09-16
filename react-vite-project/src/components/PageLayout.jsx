import {Outlet} from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
function PageLayout ({user}) {
  return (
    <div id="pagelayout" className="min-h-screen flex flex-col">
      <Header user={user}/>
      <Outlet />
      <Footer />
    </div>
  );
}
export default PageLayout;
