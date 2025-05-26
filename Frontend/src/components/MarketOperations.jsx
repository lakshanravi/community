import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const MarketOperations = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white px-6 py-12 md:px-16 lg:px-32">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Text Content */}
        <div>
          <h2 className="text-4xl font-extrabold text-green-800 mb-4">
            {t('marketOperations.title')}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 whitespace-pre-line text-justify">
            {t('marketOperations.para1')}
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 whitespace-pre-line text-justify">
            {t('marketOperations.para2')}
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 whitespace-pre-line text-justify">
            {t('marketOperations.para3')}
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 whitespace-pre-line text-justify">
            {t('marketOperations.para4')}
          </p>
        </div>

        {/* Animated and translated alt text for Image */}
        <div className="w-full flex justify-center">
          <motion.img
            src="/images/market.jpeg"
            alt={t('marketOperations.imageAlt')}
            className="w-full max-w-xs object-cover"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
        </div>
      </div>
    </section>
  );
};

export default MarketOperations;
