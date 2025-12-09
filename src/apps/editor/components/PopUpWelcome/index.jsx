import React from 'react';
import Modal from '@mui/material/Modal';
import { Box, Button } from '@mui/material';
import "./PopUpWelcome.css";

const PopUpWelcome = ({ open, handleClose, link }) => {
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
                        
                    }}
                    BackdropProps={{
                        sx: {
                        backgroundColor: 'rgba(255, 255, 255, 0.7)', // trắng mờ
                        backdropFilter: 'blur(5px)', // thêm hiệu ứng mờ nhẹ
                        },
                    }}
                >
                    <Box
                        sx={{
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
                            <img src='./images/nature.jpg'/>
                        </div>
                        <div className='popUpMove__content title' style={{ marginBottom: '20px' }}>
                            THIS IS TITLE
                        </div>
                        <div className='popUpMove__content description' style={{ marginBottom: '20px' }}>
                            THIS IS DESCRIPTION: WELCOME TO "TRIEN LAM MY THUAT 3D" BY VIETSOFTPRO
                        </div>
                        <div className='popUpMove__content date' style={{ marginBottom: '20px' }}>
                            2025-03-01 - 2025-10-10
                        </div>
                        <Button
                                onClick={() => handleClose('tour')}
                                className='button1'
                            >
                                START TOUR GUIDED
                        </Button>
                        <Button
                                onClick={() => handleClose('free')}
                                className='button2'
                            >
                                ENTER THE EXHIBITION
                        </Button>
                    </Box>
                </Modal>
            </div>
        </>
    );
};

export default PopUpWelcome;
