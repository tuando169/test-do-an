import { Link } from 'react-router-dom';
import { MdArrowOutward } from 'react-icons/md';

function AboutInfo() {
  return (
    <div className='container-main flex flex-col pt-14 '>
      <div className=' w-full flex flex-col'>
        <div className='w-full flex flex-col'>
          <div className='mb-14'>
            {/* ======= DESKTOP ======= */}
            <div className='gap-10 flex max-md:hidden'>
              <div className='col-6 w-1/2'>
                <div className='flex flex-col'>
                  {/* IMAGE LEFT */}
                  <div className='flex flex-wrap h-[30vh] w-full justify-between'>
                    <div
                      className='h-[70%] w-[30%]  bg-center bg-cover bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Chair 1_2.png")',
                      }}
                    ></div>

                    <div
                      className='h-full w-[65%]  bg-center bg-cover bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 1_1.png")',
                      }}
                    ></div>
                  </div>

                  {/* TITLE */}
                  <div className='my-6 text-2xl font-medium text-[#2E2E2E]'>
                    VỀ CHÚNG TÔI
                  </div>

                  {/* TEXT */}
                  <div className='text-[#515151] mb-4'>
                    Chúng tôi là một đội ngũ sáng tạo đam mê với việc xây dựng
                    và phát triển các không gian trưng bày độc đáo và đầy ấn
                    tượng, với sự kết hợp của công nghệ Virtual Reality (VR).
                    Mục tiêu của chúng tôi là mang đến những trải nghiệm trực
                    quan, hấp dẫn và sống động cho khách tham quan, giúp họ có
                    thể tương tác và khám phá trong một không gian ảo nhưng lại
                    mang đến cảm giác thật sự.
                  </div>
                  <div className='text-[#515151]'>
                    Với sự phát triển mạnh mẽ của công nghệ VR, chúng tôi tạo ra
                    những không gian trưng bày không chỉ để giới thiệu sản phẩm,
                    nghệ thuật hay thông tin, mà còn để kích thích sự sáng tạo
                    và khơi gợi trí tưởng tượng của người tham gia.
                  </div>

                  {/* BUTTON */}
                  <div className='flex items-center mt-3'>
                    <Link
                      to='/contact'
                      className='flex items-center px-4 py-2  border-2 border-[#2E2E2E] bg-[#2E2E2E] text-white font-semibold transition-all duration-150 hover:bg-white hover:!text-[#2E2E2E] hover:border-[#2E2E2E]'
                    >
                      <span>LIÊN HỆ</span>
                      <span className='ml-1 flex items-center'>
                        <MdArrowOutward />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* RIGHT IMAGES */}
              <div className='col-6 w-1/2'>
                <div className='flex flex-col h-full'>
                  <div className='flex flex-wrap h-full w-full'>
                    <div
                      className='h-[29%] w-[47.5%] mr-[5%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 2_2.png")',
                      }}
                    ></div>
                    <div
                      className='h-[29%] md:w-[42%] w-[40%] bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Chair 2_1.png")',
                      }}
                    ></div>

                    <div
                      className='h-[29%] w-[30%] mt-[6%] mb-[6%] mr-[5%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 1_2.png")',
                      }}
                    ></div>
                    <div
                      className='h-[29%] w-[60%] mt-[6%] mb-[6%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Chair 2_2.png")',
                      }}
                    ></div>

                    <div
                      className='h-[29%] w-[65%] mr-[5%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 3_2.png")',
                      }}
                    ></div>
                    <div
                      className='h-[15%] md:w-[25%] w-[22%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 3_1.png")',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ======= MOBILE ======= */}
            <div className='r2 hidden max-md:flex flex-wrap'>
              <div className='w-full'>
                <div className='flex flex-col'>
                  <div className='my-6 text-2xl font-medium text-[#2E2E2E]'>
                    VỀ CHÚNG TÔI
                  </div>

                  <div className='text-[#515151] mb-4'>
                    Chúng tôi là một đội ngũ sáng tạo đam mê với việc xây dựng
                    và phát triển các không gian trưng bày độc đáo và đầy ấn
                    tượng, với sự kết hợp của công nghệ Virtual Reality (VR).
                    Mục tiêu của chúng tôi là mang đến những trải nghiệm trực
                    quan, hấp dẫn và sống động cho khách tham quan, giúp họ có
                    thể tương tác và khám phá trong một không gian ảo nhưng lại
                    mang đến cảm giác thật sự.
                  </div>

                  <div className='text-[#515151]'>
                    Với sự phát triển mạnh mẽ của công nghệ VR, chúng tôi tạo ra
                    những không gian trưng bày không chỉ để giới thiệu sản phẩm,
                    nghệ thuật hay thông tin, mà còn để kích thích sự sáng tạo
                    và khơi gợi trí tưởng tượng của người tham gia.
                  </div>
                </div>
              </div>

              <div className='w-full mt-6'>
                <div className='flex flex-col h-[60vh]'>
                  <div className='flex flex-wrap h-full w-full'>
                    <div
                      className='h-[29%] w-[47.5%] mr-[5%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 2_2.png")',
                      }}
                    ></div>

                    <div
                      className='h-[29%] w-[47.5%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Chair 2_1.png")',
                      }}
                    ></div>

                    <div
                      className='h-[29%] w-[20%] mt-[6%] mb-[6%] mr-[5%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 1_2.png")',
                      }}
                    ></div>

                    <div
                      className='h-[29%] w-[47.5%] mt-[6%] mb-[6%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Chair 2_2.png")',
                      }}
                    ></div>

                    <div
                      className='h-[29%] w-[65%] mr-[5%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 3_2.png")',
                      }}
                    ></div>

                    <div
                      className='h-[15%] w-[30%]  bg-cover bg-center bg-no-repeat'
                      style={{
                        backgroundImage: 'url("./Object/Statue 3_1.png")',
                      }}
                    ></div>
                  </div>
                </div>

                <div className='flex items-center mt-4'>
                  <Link
                    to='/contact'
                    className='flex items-center px-4 py-2 border border-[#2E2E2E] bg-[#2E2E2E] text-white font-semibold transition-all duration-150 hover:bg-white hover:text-[#2E2E2E]'
                  >
                    <span>LIÊN HỆ</span>
                    <span className='ml-1'>
                      <MdArrowOutward />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutInfo;
