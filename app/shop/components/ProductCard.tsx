"use client";
import { SwiperSlide } from 'swiper/react';
import '../styles.css';

const ProductCard = ({ image, name, description }: { image: string, name: string, description: string }) => {
  return (
    <div className="flex flex-col md:flex-row-reverse w-full h-full items-center justify-between bg-white p-6 md:p-12 gap-8">
      
      {/* Right side on Desktop / Top side on Mobile */}
      <div className="w-full md:w-1/2 h-64 md:h-full flex items-center justify-center overflow-hidden rounded-xl">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover shadow-lg"
          data-swiper-parallax="-20%" 
        />
      </div>

      {/* Left side on Desktop / Bottom side on Mobile */}
      <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4 text-center md:text-left">
        <h2 
          className="text-3xl md:text-5xl font-bold text-gray-900"
          data-swiper-parallax="-300"
        >
          {name}
        </h2>
        <p 
          className="text-lg text-gray-600 leading-relaxed"
          data-swiper-parallax="-500"
        >
          {description}
        </p>
        <div data-swiper-parallax="-700">
            <button className="mt-4 px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
                Shop Now
            </button>
        </div>
      </div>

    </div>
  );
};

// Inside your page.tsx slides:
<SwiperSlide>
  <ProductCard 
    image="/400S.png" 
    name="Smooth Slide" 
    description="This premium product features a sleek design and high-quality materials, perfect for your modern lifestyle."
  />
</SwiperSlide>

export default ProductCard;