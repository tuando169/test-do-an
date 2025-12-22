import React from 'react';
import Modal from '@mui/material/Modal';
import { Box, Button } from '@mui/material';
import "./PopUpWelcome.css";

const PopUpWelcome = ({ open, handleClose, exhibition }) => {

    const formatDate = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleDateString("vi-VN").replace(/\//g, "-"); // => dd/mm/yyyy
    };
    const created = formatDate(exhibition?.created_at);
    const updated = formatDate(exhibition?.updated_at);

    const dateText = created === updated ? created : `${created} – ${updated}`;

    return (
        <>
            <div className='popUpWelcome'>
                <Modal
                    open={open}
                    onClose={() => handleClose('free')}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1300,
                        
                    }}
                    BackdropProps={{
                        sx: {
                        backgroundColor: 'rgba(255, 255, 255, 0.7)', // trắng mờ
                        backdropFilter: 'blur(5px)', // thêm hiệu ứng mờ
                        },
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: '95%', sm: '90%', md: '20%' },
                            textAlign: 'center',
                            boxShadow: 24,
                            animation: 'slideDown 0.5s forwards, fadeIn 0.5s forwards',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            outline: 'none',      
                            '&:focus': {
                                outline: 'none',    
                            },
                        }}
                    >
                        <div className='popUpMove__image' style={{ marginBottom: '10px' }}>
                            <img src={exhibition?.thumbnail || exhibition?.cover_image_url}/>
                        </div>
                        <div className='popUpMove__content title' style={{ marginBottom: '20px' }}>
                            {exhibition?.title || exhibition?.name}
                        </div>
                        <div className='popUpMove__content description' style={{ marginBottom: '20px' }}>
                            {exhibition?.author || exhibition?.username}
                        </div>
                        {/* <div className='popUpMove__content date' style={{ marginBottom: '20px' }}>
                            {dateText}
                        </div> */}
                        <Button
                                onClick={() => handleClose('tour')}
                                className='button1'
                            >
                                Bắt Đầu Tour Hướng Dẫn
                        </Button>
                        <Button
                                onClick={() => handleClose('free')}
                                className='button2'
                            >
                                Vào Triển Lãm
                        </Button>
                    </Box>
                </Modal>
            </div>
        </>
    );
};

export default PopUpWelcome;
