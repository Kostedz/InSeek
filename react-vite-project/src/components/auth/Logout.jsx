import {useNavigate} from "react-router-dom";

const Logout = ({setUser}) => {
  const navigate = useNavigate();
  localStorage.removeItem("token");
  localStorage.removeItem("devAccess");
  Object.keys(localStorage)
      .filter((key) => key.startsWith("inseek.student.cv."))
      .forEach((key) => localStorage.removeItem(key));
  setUser(null);
  navigate('/');

}
export default Logout;
