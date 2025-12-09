import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import sections from "../../constants/data"; // Import dữ liệu slide
import "./SlideShow.scss"; // Import CSS

function SlideShow() {
    const { slide } = sections;

    // Cấu hình của slick carousel
    const settings = {
        dots: true, // Hiển thị dot chỉ mục
        infinite: true, // Lặp vô hạn
        speed: 500, // Tốc độ chuyển slide
        slidesToShow: 4, // Hiển thị 6 ảnh cùng lúc
        slidesToScroll: 1, // Scroll từng ảnh một
        autoplay: true, // Tự động chạy slide
        autoplaySpeed: 3000, // Chuyển sau 5 giây
        centerMode: true, // Giúp căn giữa các ảnh
        centerPadding: "0px", // Đảm bảo không có padding thừa
        nextArrow: <SampleNextArrow />, // Custom nút next
        prevArrow: <SamplePrevArrow />, // Custom nút prev
        responsive: [
            {
                breakpoint: 1600, // Màn hình nhỏ hơn 1024px
                settings: {
                    slidesToShow: 3, // Hiển thị 4 ảnh
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 1300, // Màn hình nhỏ hơn 1024px
                settings: {
                    slidesToShow: 2, // Hiển thị 4 ảnh
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 800, // Màn hình nhỏ hơn 1024px
                settings: {
                    slidesToShow: 1, // Hiển thị 4 ảnh
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 480, // Màn hình nhỏ hơn 480px
                settings: {
                    slidesToShow: 1, // Hiển thị 1 ảnh
                    slidesToScroll: 1
                }
            }
        ]
    };

    return (
        <div className="slide-container">
            <div className="slide-container__title">
                TRANH NỔI BẬT
            </div>
            <Slider {...settings}>
                {slide.map((item) => (
                    <div key={item.id} className="slide-item">
                        <img src={item.image} alt={`Tranh ${item.id}`} className="slide-image" style={{backgroundColor: `${item.background}`}} />
                    </div>
                ))}
            </Slider>
        </div>
    );
}

// Custom nút Next
function SampleNextArrow(props) {
    const { className, style, onClick } = props;
    return (
        <div
            className={className}
            style={{ ...style, display: "block", right: "10px", zIndex: "1" }}
            onClick={onClick}
        >

        </div>
    );
}

// Custom nút Prev
function SamplePrevArrow(props) {
    const { className, style, onClick } = props;
    return (
        <div
            className={className}
            style={{ ...style, display: "block", left: "10px", zIndex: "1" }}
            onClick={onClick}
        >
            
        </div>
    );
}

export default SlideShow;
