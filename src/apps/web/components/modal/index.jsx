import React, { useRef } from "react";
import "./Modal.scss"; // CSS riêng cho modal
import { ImCross } from "react-icons/im";

const Modal = ({ isVisible, onClose, children }) => {
    const modalRef = useRef(null);

    // Đóng modal khi click bên ngoài
    const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            onClose();
        }
    };

    if (!isVisible) return null;

    return (
        <>
            <div className="backModal" onClick={handleClickOutside}></div>
            <div className="innerModal" ref={modalRef}>
                <div className="innerModal--buttonClose" onClick={onClose}>
                    <ImCross />
                </div>
                <div className="innerModal--content">{children}</div>
            </div>
        </>
    );
};

export default Modal;
