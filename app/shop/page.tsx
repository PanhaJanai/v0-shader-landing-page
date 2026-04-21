// Import Swiper React components
"use client";
import type { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import Navbar from './components/NavigationBarNested';
import { useEffect, useRef, useState } from 'react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

import './styles.css';

// import required modules
import { Mousewheel, Pagination } from 'swiper/modules';
import NestedSwiper from './components/nestedSwiper';
import ProductCard from './components/ProductCard';

export default function App() {
  const categories = ["Women", "Men", "Kids", "Baby"];

  const clothes = [
    { name: "Lawn Mower 001", description: "This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle.", image: '400S.png' },
    { name: "Lawn Mower 002", description: "This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle.", image: '400S.png' },
    { name: "Lawn Mower 003", description: "This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle.", image: '400S.png' },
    { name: "Lawn Mower 004", description: "This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle.", image: '400S.png' }
  ];

  const [activeCategory, setActiveCategory] = useState("Women");

  const swiperRef = useRef<SwiperType | null>(null);
  useEffect(() => {
    if (swiperRef.current) {
      // We find the index of the category and tell Swiper to move there
      const index = categories.indexOf(activeCategory);
      if (index !== -1) {
        swiperRef.current.slideTo(index, 800);
      }
    }
  }, [activeCategory, categories]); // This only runs when these values change

  return (
    <>
      {/* <button onClick={handleNext} className="btn-next bg-amber-900">Next Category</button> */}
      <Navbar activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      <Swiper
        className="mySwiper swiper-h"
        spaceBetween={10}
        direction={'horizontal'}
        pagination={{
          clickable: true,
        }}
        modules={[Pagination]}
        onSlideChange={(swiper) => {
          const currentIndex = swiper.activeIndex;
          setTimeout(() => {
            setActiveCategory(categories[currentIndex]);
          }, 0);

          console.log("Current Index:", currentIndex);
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
      >
        <SwiperSlide>
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
            {/* <SwiperSlide>
              <ProductCard image='400S.png' name='Lawn Mover 001' description='This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle.'/>
            </SwiperSlide>
            <SwiperSlide>
              <ProductCard image='400S.png' name='Lawn Mover 002' description='This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle.'/>
            </SwiperSlide>
            <SwiperSlide>
              <ProductCard image='400S.png' name='Lawn Mover 003' description='This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle.'/>
            </SwiperSlide>
            <SwiperSlide>
              <ProductCard image='400S.png' name='Lawn Mover 004' description='This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle.'/>
            </SwiperSlide> */}
            {clothes.map((item, idx) => (
              <SwiperSlide key={idx}>
                <ProductCard 
                  image={item.image} 
                  name={item.name} 
                  description={item.description} 
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </SwiperSlide>
        <SwiperSlide>
          <NestedSwiper />
        </SwiperSlide>  
        <SwiperSlide>
          <NestedSwiper />
        </SwiperSlide> 
        <SwiperSlide>
          <NestedSwiper />
        </SwiperSlide> 
      </Swiper>
    </>
  );
}
