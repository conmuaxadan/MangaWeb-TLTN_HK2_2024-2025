import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StatsCard = React.memo(({ title, value, increase, icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${color} text-white mr-4`}>
            <FontAwesomeIcon icon={icon} className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
          </div>
        </div>
        {increase !== undefined && (
          <div className="mt-4">
            <div className="text-sm text-green-600 dark:text-green-400">
              +{increase} hôm nay
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default StatsCard;
