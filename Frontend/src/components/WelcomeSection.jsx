import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "/images/crops1.jpeg",
  "/images/crops2.jpeg", // Replace with your actual image paths
  "/images/crops3.jpeg",
  "/images/crops4.jpeg"
];

const WelcomeSection = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="text-left space-y-6 pl-6">
          <h1 className="text-4xl font-bold text-green-800">
            {t("home.welcomeMessage")}
          </h1>
          <p className="text-lg text-gray-700 text-justify">
            {t("home.description")}
          </p>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`Slide ${currentIndex + 1}`}
              className="rounded-3xl w-full h-[350px] object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75 }}
            />
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full ${currentIndex === index ? "bg-green-600" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
