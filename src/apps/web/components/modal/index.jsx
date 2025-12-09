import { useRef } from 'react';
import { ImCross } from 'react-icons/im';

export default function Modal({ isVisible, onClose, children }) {
  const modalRef = useRef(null);

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-[100]
        flex items-center justify-center
        transition-opacity duration-300
        ${
          isVisible
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }
      `}
      onClick={handleClickOutside}
    >
      {/* Overlay */}
      <div
        className={`
          absolute inset-0 bg-[#2c2c2c]/50
          transition-opacity duration-300
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
      ></div>

      {/* Modal box */}
      <div
        ref={modalRef}
        className={`
          relative bg-white  
          p-12 max-w-[90vw] max-h-[95vh] overflow-auto
          transform transition-all duration-500
          ${
            isVisible
              ? 'translate-y-0 opacity-100'
              : '-translate-y-20 opacity-0'
          }
        `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className='absolute right-0 top-0 bg-[#2e2e2e] text-white p-4 hover:text-red-400'
        >
          <ImCross size={14} />
        </button>

        {/* Modal content */}
        <div className='flex flex-col items-center justify-center'>
          {children}
        </div>
      </div>
    </div>
  );
}
