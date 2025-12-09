import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation(); // Lấy đường dẫn hiện tại

  useEffect(() => {
    window.scrollTo(0, 0); // Cuộn về đầu trang mỗi khi pathname thay đổi
  }, [pathname]); // Thực hiện khi pathname thay đổi

  return null;
}

export default ScrollToTop;
