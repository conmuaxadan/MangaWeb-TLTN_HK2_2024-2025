import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Component hiển thị khi không có dữ liệu
export const NoDataDisplay: React.FC<{ message: string }> = React.memo(({ message }) => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center text-gray-500 dark:text-gray-400">
      <FontAwesomeIcon icon={faChartLine} className="text-5xl mb-4" />
      <p>{message}</p>
    </div>
  </div>
));

// Wrapper component cho biểu đồ với kiểm tra dữ liệu
export const ChartWrapper: React.FC<{
  title: string;
  hasData: boolean;
  noDataMessage: string;
  height?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  hideChartWhenNoData?: boolean; // Tùy chọn ẩn biểu đồ khi không có data
}> = React.memo(({ title, hasData, noDataMessage, height = "h-80", action, children, hideChartWhenNoData = false }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      {action && action}
    </div>
    <div className={height}>
      {hasData ? children : (hideChartWhenNoData ? null : <NoDataDisplay message={noDataMessage} />)}
    </div>
  </div>
));

// User Charts
export const NewUsersByDayChart: React.FC<{ data: Array<{ date: string; newUsers: number }> }> = React.memo(({ data }) => (
  <ChartWrapper
    title="Người dùng mới theo ngày"
    hasData={data && data.length > 0}
    noDataMessage="Không có dữ liệu về người dùng mới theo ngày"
  >
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(value) => `Ngày: ${new Date(value).toLocaleDateString('vi-VN')}`}
          formatter={(value) => [`${value} người dùng`, 'Người dùng mới']}
        />
        <Legend />
        <Bar dataKey="newUsers" name="Người dùng mới" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  </ChartWrapper>
));

export const UsersByAuthProviderChart: React.FC<{ data: Array<{ provider: string; count: number }> }> = React.memo(({ data }) => (
  <ChartWrapper
    title="Người dùng theo phương thức đăng nhập"
    hasData={data && data.length > 0}
    noDataMessage="Không có dữ liệu về phương thức đăng nhập"
  >
    <div className="h-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="provider"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.provider === 'GOOGLE' ? '#ef4444' : '#3b82f6'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value.toLocaleString()} người dùng`, '']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full">
        {data.map((item, index) => (
          <UserAuthProviderCard key={index} item={item} />
        ))}
      </div>
    </div>
  </ChartWrapper>
));

export const UserAuthProviderCard: React.FC<{ item: { provider: string; count: number } }> = React.memo(({ item }) => (
  <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex items-center">
    <div className={`p-3 rounded-full ${item.provider === 'GOOGLE' ? 'bg-red-500' : 'bg-blue-500'} text-white mr-4`}>
      <FontAwesomeIcon icon={item.provider === 'GOOGLE' ? ['fab', 'google'] : 'user'} className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.provider}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{item.count.toLocaleString()} người dùng</p>
    </div>
  </div>
));

// Manga Charts
export const MangaGenreChart: React.FC<{ data: Record<string, number> }> = React.memo(({ data }) => {
  const chartData = Object.entries(data)
    .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
    .slice(0, 8) // Lấy 8 thể loại phổ biến nhất
    .map(([genre, count]) => ({
      genre,
      count
    }));

  return (
    <ChartWrapper
      title="Truyện theo thể loại"
      hasData={Object.keys(data).length > 0}
      noDataMessage="Không có dữ liệu về thể loại"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius={90} data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="genre" />
          <PolarRadiusAxis />
          <Radar name="Số lượng truyện" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip formatter={(value) => [`${value} truyện`, '']}/>
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

export const MangaStatusChart: React.FC<{ data: Record<string, number> }> = React.memo(({ data }) => {
  console.log('MangaStatusChart data:', data); // Debug log

  const chartData = Object.entries(data).map(([status, count]) => {
    // Chuyển đổi trạng thái sang tên hiển thị
    const statusDisplayName = {
      'ONGOING': 'Đang tiến hành',
      'COMPLETED': 'Hoàn thành',
      'PAUSED': 'Tạm ngưng'
    }[status] || status;

    return {
      name: statusDisplayName,
      value: count,
      originalStatus: status
    };
  }).filter(item => item.value > 0); // Chỉ hiển thị status có giá trị > 0

  const statusColors = {
    'ONGOING': '#eab308',  // yellow-500
    'COMPLETED': '#14b8a6', // teal-500
    'PAUSED': '#ef4444'     // red-500
  };

  return (
    <ChartWrapper
      title="Truyện theo trạng thái"
      hasData={chartData.length > 0}
      noDataMessage="Không có dữ liệu về trạng thái"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={statusColors[entry.originalStatus] || '#8884d8'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value.toLocaleString()} truyện`, '']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

export const MostViewedMangaChart: React.FC<{ data: Array<{ title: string; views: number }> }> = React.memo(({ data }) => (
  <ChartWrapper
    title="Truyện được xem nhiều nhất"
    hasData={data && data.length > 0}
    noDataMessage="Chưa có dữ liệu về truyện được xem nhiều nhất"
  >
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{
          top: 5,
          right: 30,
          left: 100,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          type="category"
          dataKey="title"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => [`${value.toLocaleString()} lượt xem`, '']}
        />
        <Legend />
        <Bar dataKey="views" name="Lượt xem" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  </ChartWrapper>
));

// View Charts
export const ViewsByDayChart: React.FC<{
  data: Array<any>;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}> = React.memo(({ data, startDate, endDate, setStartDate, setEndDate }) => {
  const dateRangeSelector = (
    <div className="flex items-center space-x-4">
      <FontAwesomeIcon icon={faChartLine} className="text-gray-500 dark:text-gray-400" />
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-700 dark:text-gray-300">Từ:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        />
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-700 dark:text-gray-300">Đến:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        />
      </div>
    </div>
  );

  return (
    <ChartWrapper
      title="Lượt xem theo ngày"
      hasData={data && data.length > 0}
      noDataMessage="Không có dữ liệu lượt xem theo ngày"
      action={dateRangeSelector}
      hideChartWhenNoData={true}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            }}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(value) => `Ngày: ${new Date(value).toLocaleDateString('vi-VN')}`}
            formatter={(value, name, entry) => {
              const formattedValue = value.toLocaleString();
              let displayName;

              // Xác định tên hiển thị dựa trên dataKey
              if (entry && entry.dataKey) {
                switch(entry.dataKey) {
                  case 'views':
                    displayName = 'Tổng lượt xem';
                    break;
                  case 'registeredUserViews':
                    displayName = 'Người dùng đăng nhập';
                    break;
                  case 'anonymousViews':
                    displayName = 'Người dùng không đăng nhập';
                    break;
                  default:
                    displayName = name;
                }
              } else {
                displayName = name;
              }

              return [`${formattedValue} lượt xem`, displayName];
            }}
          />
          <Legend />
          <Bar dataKey="views" name="Tổng lượt xem" fill="#10b981" />
          <Bar dataKey="registeredUserViews" name="Người dùng đăng nhập" fill="#3b82f6" />
          <Bar dataKey="anonymousViews" name="Người dùng không đăng nhập" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});

export const ViewsByMangaChart: React.FC<{
  data: Array<any>;
  limit: number;
  setLimit: (value: number) => void;
  startDate: string;
  endDate: string;
}> = React.memo(({ data, limit, setLimit, startDate, endDate }) => {
  const limitSelector = (
    <div className="flex items-center space-x-2">
      <FontAwesomeIcon icon={faChartLine} className="text-gray-500 dark:text-gray-400" />
      <select
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        value={limit}
        onChange={(e) => setLimit(Number(e.target.value))}
      >
        <option value="5">5 truyện</option>
        <option value="10">10 truyện</option>
        <option value="20">20 truyện</option>
      </select>
    </div>
  );

  return (
    <ChartWrapper
      title="Lượt xem theo truyện"
      hasData={data && data.length > 0}
      noDataMessage="Không có dữ liệu lượt xem theo truyện"
      height="h-96"
      action={limitSelector}
      hideChartWhenNoData={true}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 30,
            left: 150, // Thêm khoảng trống cho tiêu đề truyện
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="title"
            width={140}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value, name, entry) => {
              const formattedValue = value.toLocaleString();
              let displayName;

              // Xác định tên hiển thị dựa trên dataKey
              if (entry && entry.dataKey) {
                switch(entry.dataKey) {
                  case 'totalViews':
                    displayName = 'Tổng lượt xem';
                    break;
                  case 'registeredUserViews':
                    displayName = 'Người dùng đăng nhập';
                    break;
                  case 'anonymousViews':
                    displayName = 'Người dùng không đăng nhập';
                    break;
                  default:
                    displayName = name;
                }
              } else {
                displayName = name;
              }

              return [`${formattedValue} lượt xem`, displayName];
            }}
          />
          <Legend />
          <Bar dataKey="totalViews" name="Tổng lượt xem" stackId="a" fill="#10b981" />
          <Bar dataKey="registeredUserViews" name="Người dùng đăng nhập" stackId="b" fill="#3b82f6" />
          <Bar dataKey="anonymousViews" name="Người dùng không đăng nhập" stackId="b" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
});
