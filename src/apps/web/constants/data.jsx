import images from "./images";

const danhSachKhongGian = [

    {
        id: 1,
        image: images.kg1,
        title: "Nghệ thuật Sáng tạo",
        author: "Đại học quốc gia Hà Nội",
        type: "Kiến trúc",
        description: "Bước vào không gian 3D của Đại học Quốc gia Hà Nội, bạn sẽ được khám phá một bảo tàng số sống động, nơi kết hợp hài hòa giữa kiến trúc hiện đại và di sản văn hóa. Không gian này không chỉ tái hiện những công trình mang tính biểu tượng của trường, mà còn mở ra một thế giới nghệ thuật phong phú, nơi các ý tưởng sáng tạo được truyền tải qua những mô hình 3D chân thực, hiệu ứng ánh sáng động và trải nghiệm tương tác trực tuyến.",
        prop: "nghe_thuat_sang_tao",
        spaceImage: images.d1,
        spaceVideo: images.v1,
        web: "/nghe-thuat-sang-tao",
        spaceKind: "3D"
    },
    {
        id: 2,
        image: images.kg2,
        title: "Tranh Trưng Bày",
        author: "Trường Khoa học liên ngành và Nghệ thuật",
        type: "Tranh vẽ",
        description: "Bước vào khu vực Tranh Trưng Bày của Trường Khoa học Liên ngành và Nghệ thuật, bạn sẽ lạc vào một thế giới nơi màu sắc, đường nét và ý tưởng hòa quyện để kể những câu chuyện đầy cảm hứng. Không gian này là sự kết hợp giữa truyền thống và hiện đại, nơi những tác phẩm nghệ thuật không chỉ được trưng bày đơn thuần mà còn mang lại trải nghiệm tương tác số hóa, giúp người xem khám phá chiều sâu ý nghĩa của từng tác phẩm.",
        prop: "tranh_trung_bay",
        spaceImage: images.d1,
        spaceVideo: images.v2,
        web: "/space/tranh_trung_bay",
        spaceKind: "gallery"
    },
    {
        id: 3,
        image: images.kg3,
        title: "Gogh Beyond",
        author: "Vincent van Gogh",
        type: "Tranh vẽ",
        description: "Through the use of cutting-edge projection technology and an original score, Beyond Van Gogh breathes new life into over 300 of Van Gogh's artworks",
        prop: "gogh_beyond",
        spaceImage: images.d1,
        spaceVideo: images.v1,
        web: "/nghe-thuat-sang-tao",
        spaceKind: "3D"
    },
    {
        id: 4,
        image: images.kg4,
        title: "Nhìn lên đáy giếng",
        author: "Hachul Lệ Đổ & Vũ Diệu Hương",
        type: "Tranh vẽ",
        description: "Triển lãm “Nhìn lên đáy giếng”, triển lãm đôi đạt giải thưởng RMIT Digital Art and Design Grant 2024, gồm hai tác phẩm nghệ thuật: “Sự tích Trần Thanh Dương” của Hachul Lệ Đổ và “Đảo Ngây Thơ” của Vũ Diệu Hương. Triển lãm “Nhìn lên đáy giếng” chính thức được ra mắt trong khuôn khổ Liên hoan Sáng tạo & Thiết kế Việt Nam (VFCD) và được bảo trợ bởi The Outpost Art Organisation./Các tác phẩm của nghệ sĩ Hachul Lệ Đổ và Vũ Diệu Hương lấy cảm hứng từ bản sắc văn hóa đa dạng và di sản của Việt Nam. Với sự hiểu biết rằng truyền thống Việt Nam không phải là đối tượng nghiên cứu đồng nhất theo một thuật ngữ đơn nhất, các nghệ sĩ ủng hộ một cách tiếp cận mang tính cộng tác thông qua nhiều phương tiện sáng tạo kỹ thuật số.",
        prop: "nhin_len_day_gieng",
        spaceImage: images.d1,
        spaceVideo: images.v1,
        web: "/nghe-thuat-sang-tao",
        spaceKind: "3D"
    },
    {
        id: 5,
        image: images.kg5,
        title: "ego - người",
        author: "Đa nghệ sĩ",
        type: "Tranh vẽ và điêu khắc",
        description: "Được chọn là 1 trong 50 sự kiện của Lễ hội Thiết kế sáng tạo TP Hà Nội năm 2022, lễ khai mạc triển lãm “Ego – Người” trưng bày các tác phẩm của họa sĩ Ngô Xuân Bính vừa được Sở Văn hóa và Thể thao Hà Nội, Hội Mỹ thuật Việt Nam tổ chức tại Bảo tàng Hà Nội./Về Lễ hội và triển lãm nói trên, Phó Giám đốc Sở Văn hóa và Thể thao  Hà Nội – Trần Thị Vân Anh cho biết, Lễ hội Thiết kế sáng tạo TP Hà Nội năm 2022 với chủ đề “Sáng tạo và công nghệ” được tổ chức tại nhiều không gian khác nhau trên địa bàn thành phố.",
        prop: "ego_nguoi",
        spaceImage: images.d1,
        spaceVideo: images.v1,
        web: "/nghe-thuat-sang-tao",
        spaceKind: "3D"
    },
    {
        id: 6,
        image: images.kg6,
        title: "Nghệ Thuật Ánh Sáng Metashow",
        author: "Đa nghệ sĩ",
        type: "Nghệ thuật ánh sáng",
        description: "Triển lãm Nghệ thuật Ánh Sáng MetaShow – nơi trải nghiệm ánh sáng và nghệ thuật đầy sáng tạo với hơn 30 chủ đề đa dạng như Kính vạn hoa, Biển hoa hồng, Dãi ngân hà, Van Gogh, Cung điện gương, Thị trấn AI, Vũ trụ cánh đồng lúa mì, Biển hướng dương, Mắt kim cương, Phòng chiếu 4K…/Sử dụng công nghệ ánh sáng laser, VR/AR, projection mapping sống động./Không gian triển lãm chia thành hai khu vực với hiệu ứng âm thanh, hình ảnh mãn nhãn.",
        prop: "nghe_thuat_anh_sang_metashow",
        spaceImage: images.d1,
        spaceVideo: images.v1,
        web: "/nghe-thuat-sang-tao",
        spaceKind: "3D"
    },
    {
        id: 7,
        image: images.kg7,
        title: "BƯỚC QUA MỘT KHÚC ĐƯỜNG CA",
        author: "Đa nghệ sĩ",
        type: "Nghệ thuật ánh sáng",
        description: "Sau khi được đón nhận nồng nhiệt tại Thành phố Hồ Chí Minh, Bước qua một khúc đường ca (Walking Through a Songline) – một triển lãm ánh sáng nghệ thuật do Đại sứ quán Australia tại Việt Nam tổ chức – sẽ ra mắt công chúng tại Hà Nội tại Bảo tàng Phụ nữ Việt Nam từ ngày 28 tháng 4 đến ngày 21 tháng 5. Đây là triển lãm mới nhất do Đại sứ quán Australia tổ chức nhằm giới thiệu các nền văn hóa độc đáo và sống động thuộc các Quốc gia Đầu tiên của Australia tới khán giả Việt Nam. Triển lãm nằm trong chuỗi các hoạt động kỷ niệm 50 năm quan hệ ngoại giao Australia - Việt Nam vào năm 2023.",
        prop: "buoc_qua_mot_khuc_duong_ca",
        spaceImage: images.d1,
        spaceVideo: images.v1,
        web: "/nghe-thuat-sang-tao",
        spaceKind: "3D"
    },
    {
        id: 8,
        image: images.kg8,
        title: "Ánh sáng tình tôi",
        author: "Phan Như Lâm",
        type: "Tranh vẽ",
        description: "Chiêm ngưỡng những bức tranh ở triển lãm Ánh sáng tình tôi, người xem dễ dàng nhận thấy đó là cách tự chữa lành cho Phan Như Lâm trong nhiều khía cạnh, mà đầu tiên là tâm lý sáng tác. Ngoài ra, họa sĩ còn dành nhiều ánh sáng và sự tụng ca cho các nhân vật nữ, để rồi từ họ nhận về những ánh sáng cho chính mình, giám tuyển Lý Đợi nhận xét.",
        prop: "anh_sang_tinh_toi",
        spaceImage: images.d1,
        spaceVideo: images.v1,
        web: "/nghe-thuat-sang-tao",
        spaceKind: "3D"
    },
];

const user = [
    {
        id: 1,
        name: "Ngô Thị Hồng nhung",
        prop: "ngo_thi_hong_nhung",
        account: "user@gmail.com",
        password: "user",
        avatar: images.user1
    },
    {
        id: 2,
        name: "Đỗ Tuấn Minh",
        prop: "minh2813",
        account: "minh@gmail.com",
        password: "minh",
        avatar: images.user1
    }
]

const slide=[
    {
        id: 1,
        image: images.s1,
        title: "Tranh1",
        author: "Tacgia1",
        background: "#FFFFFF"
    },
    {
        id: 2,
        image: images.s2,
        title: "Tranh2",
        author: "Tacgia2",
        background: "#AA1636"
    },
    {
        id: 3,
        image: images.s3,
        title: "Tranh3",
        author: "Tacgia3",
        background: "#FFFFFF"
    },
    {
        id: 4,
        image: images.s4,
        title: "Tranh4",
        author: "Tacgia4",
        background: "#2E1516"
    },
    {
        id: 5,
        image: images.s5,
        title: "Tranh5",
        author: "Tacgia5",
        background: "#2E1516"
    },
    {
        id: 6,
        image: images.s6,
        title: "Tranh6",
        author: "Tacgia6",
        background: "#2E1516"
    },
    {
        id: 7,
        image: images.s7,
        title: "Tranh7",
        author: "Tacgia7",
        background: "#1E1B54"
    },
    {
        id: 8,
        image: images.s8,
        title: "Tranh8",
        author: "Tacgia8",
        background: "#ED008C"
    },
    {
        id: 9,
        image: images.s9,
        title: "Tranh9",
        author: "Tacgia9",
        background: "#E6E6E4"
    },
    {
        id: 10,
        image: images.s10,
        title: "Tranh10",
        author: "Tacgia10",
        background: "#2E1516"
    },
    {
        id: 11,
        image: images.s11,
        title: "Tranh11",
        author: "Tacgia11",
        background: "#2E1516"
    },
    {
        id: 12,
        image: images.s12,
        title: "Tranh12",
        author: "Tacgia12",
        background: "#2E1516"
    },
    {
        id: 13,
        image: images.s13,
        title: "Tranh13",
        author: "Tacgia13",
        background: "#2E1516"
    },
    {
        id: 14,
        image: images.s14,
        title: "Tranh14",
        author: "Tacgia14",
        background: "#F8A1AE"
    },
    {
        id: 15,
        image: images.s15,
        title: "Tranh15",
        author: "Tacgia15",
        background: "#6C57A6"
    },
    {
        id: 16,
        image: images.s16,
        title: "Tranh16",
        author: "Tacgia16",
        background: "#37B0BC"
    },
    {
        id: 17,
        image: images.s17,
        title: "Tranh17",
        author: "Tacgia17",
        background: "#B05527"
    },
]

const sections = { danhSachKhongGian, user, slide };

export default sections;