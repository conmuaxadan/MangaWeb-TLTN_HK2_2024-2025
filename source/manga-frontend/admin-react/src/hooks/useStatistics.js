import { useState, useEffect, useCallback } from 'react';
import statisticsService from '../services/statistics-service.js';

export const useStatistics = () => {
  // State cho tab hiện tại
  const [activeTab, setActiveTab] = useState('users');

  // State cho date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State cho manga views limit
  const [mangaViewsLimit, setMangaViewsLimit] = useState(10);

  // State cho thống kê tổng hợp
  const [overviewStats, setOverviewStats] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // State cho thống kê lượt xem theo ngày
  const [viewsByDay, setViewsByDay] = useState([]);
  const [isLoadingViewsByDay, setIsLoadingViewsByDay] = useState(false);

  // State cho thống kê lượt xem theo truyện
  const [viewsByManga, setViewsByManga] = useState([]);
  const [isLoadingViewsByManga, setIsLoadingViewsByManga] = useState(false);

  // State cho date range picker (legacy)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // State cho số ngày hiển thị
  const [daysToShow, setDaysToShow] = useState(7);

  // State cho số lượng truyện hiển thị
  const [mangaLimit, setMangaLimit] = useState(10);

  // Lấy thống kê tổng hợp
  const fetchOverviewStats = useCallback(async () => {
    setIsLoadingOverview(true);
    try {
      const stats = await statisticsService.getOverviewStatistics();
      setOverviewStats(stats);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê tổng hợp:', error);
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  // Lấy thống kê lượt xem theo ngày
  const fetchViewsByDay = useCallback(async (days = daysToShow, startDate = '', endDate = '') => {
    setIsLoadingViewsByDay(true);
    try {
      let data;
      if (startDate && endDate) {
        data = await statisticsService.getViewsByDateRange(startDate, endDate);
      } else {
        data = await statisticsService.getViewsByDay(days);
      }
      setViewsByDay(data || []);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê lượt xem theo ngày:', error);
      setViewsByDay([]);
    } finally {
      setIsLoadingViewsByDay(false);
    }
  }, [daysToShow]);

  // Lấy thống kê lượt xem theo truyện
  const fetchViewsByManga = useCallback(async (days = 0, limit = mangaLimit, startDate = '', endDate = '') => {
    setIsLoadingViewsByManga(true);
    try {
      let data;
      if (startDate && endDate) {
        data = await statisticsService.getViewsByMangaDateRange(startDate, endDate, limit);
      } else {
        data = await statisticsService.getViewsByManga(days, limit);
      }
      setViewsByManga(data || []);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê lượt xem theo truyện:', error);
      setViewsByManga([]);
    } finally {
      setIsLoadingViewsByManga(false);
    }
  }, [mangaLimit]);

  // Xử lý thay đổi số ngày
  const handleDaysChange = (newDays) => {
    setDaysToShow(newDays);
    // Reset date range khi thay đổi số ngày
    setDateRange({ startDate: '', endDate: '' });
  };

  // Xử lý thay đổi date range
  const handleDateRangeChange = (newStartDate, newEndDate) => {
    setDateRange({ startDate: newStartDate, endDate: newEndDate });
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    // Reset số ngày khi sử dụng date range
    setDaysToShow(0);
  };

  // Xử lý thay đổi số lượng truyện
  const handleMangaLimitChange = (newLimit) => {
    setMangaLimit(newLimit);
    setMangaViewsLimit(newLimit);
  };

  // Làm mới tất cả dữ liệu
  const refreshAllData = useCallback(() => {
    fetchOverviewStats();
    if (dateRange.startDate && dateRange.endDate) {
      fetchViewsByDay(0, dateRange.startDate, dateRange.endDate);
      fetchViewsByManga(0, mangaLimit, dateRange.startDate, dateRange.endDate);
    } else {
      fetchViewsByDay(daysToShow);
      fetchViewsByManga(daysToShow, mangaLimit);
    }
  }, [fetchOverviewStats, fetchViewsByDay, fetchViewsByManga, daysToShow, mangaLimit, dateRange]);

  // Load dữ liệu ban đầu
  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);

  // Sync mangaViewsLimit với mangaLimit
  useEffect(() => {
    if (mangaViewsLimit !== mangaLimit) {
      setMangaLimit(mangaViewsLimit);
    }
  }, [mangaViewsLimit, mangaLimit]);

  // Load thống kê lượt xem khi thay đổi tham số
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchViewsByDay(0, dateRange.startDate, dateRange.endDate);
    } else if (daysToShow > 0) {
      fetchViewsByDay(daysToShow);
    }
  }, [fetchViewsByDay, daysToShow, dateRange]);

  // Load thống kê theo truyện khi thay đổi tham số
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchViewsByManga(0, mangaLimit, dateRange.startDate, dateRange.endDate);
    } else {
      fetchViewsByManga(daysToShow, mangaLimit);
    }
  }, [fetchViewsByManga, daysToShow, mangaLimit, dateRange]);

  // Tạo stats object theo format mà Statistics page expect
  const stats = {
    users: {
      totalUsers: overviewStats?.totalUsers || 0,
      newUsersToday: overviewStats?.newUsersToday || 0,
      newUsersThisWeek: overviewStats?.newUsersThisWeek || 0,
      newUsersThisMonth: overviewStats?.newUsersThisMonth || 0,
      usersByDay: overviewStats?.usersByDay || [],
      usersByAuthProvider: overviewStats?.usersByAuthProvider || []
    },
    mangaStats: {
      totalMangas: overviewStats?.totalMangas || 0,
      activeMangas: overviewStats?.totalMangas || 0,
      deletedMangas: 0,
      newMangasToday: overviewStats?.newMangasToday || 0,
      mangasByGenre: overviewStats?.mangasByGenre || {},
      mangasByStatus: overviewStats?.mangasByStatus || {}
    },
    mangas: [],
    views: {
      totalViews: overviewStats?.totalViews || 0,
      viewsToday: overviewStats?.viewsToday || 0,
      viewsThisWeek: overviewStats?.viewsThisWeek || 0,
      viewsThisMonth: overviewStats?.viewsThisMonth || 0,
      viewsByDay: viewsByDay,
      viewsByManga: viewsByManga
    }
  };

  // Tính loading state tổng hợp
  const loading = isLoadingOverview || isLoadingViewsByDay || isLoadingViewsByManga;

  // Refresh function
  const refreshData = () => {
    refreshAllData();
  };

  return {
    // Interface mà Statistics page expect
    activeTab,
    startDate,
    endDate,
    mangaViewsLimit,
    stats,
    loading,
    setActiveTab,
    setStartDate,
    setEndDate,
    setMangaViewsLimit,
    refreshData,

    // Legacy interface (để backward compatibility)
    overviewStats,
    viewsByDay,
    viewsByManga,
    isLoadingOverview,
    isLoadingViewsByDay,
    isLoadingViewsByManga,
    daysToShow,
    mangaLimit,
    dateRange,
    handleDaysChange,
    handleMangaLimitChange,
    handleDateRangeChange,
    refreshAllData,
    fetchOverviewStats,
    fetchViewsByDay,
    fetchViewsByManga
  };
};

export default useStatistics;
