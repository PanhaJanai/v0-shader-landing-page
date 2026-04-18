"use client";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Pagination } from 'swiper/modules';
import '../styles.css';

const NestedSwiper = () => {
  return (

      <Swiper
        className="mySwiper2 swiper-v"
        direction={'vertical'}
        parallax={true}
        loop={true}
        spaceBetween={10}
        pagination={{
          clickable: true,
        }}
        modules={[Pagination, Mousewheel]}
        mousewheel={{
          thresholdTime: 500,  // Minimum time between slide triggers
          thresholdDelta: 20,  // Minimum "strength" of scroll required to trigger
          forceToAxis: true,
        }}
        speed={800}
      >
        <SwiperSlide>Vertical Slide 1</SwiperSlide>
        <SwiperSlide>Vertical Slide 2</SwiperSlide>
        <SwiperSlide>Vertical Slide 3</SwiperSlide>
        <SwiperSlide>Vertical Slide 4</SwiperSlide>
        <SwiperSlide>Vertical Slide 5</SwiperSlide>
      </Swiper>

  );
}

export default NestedSwiper;