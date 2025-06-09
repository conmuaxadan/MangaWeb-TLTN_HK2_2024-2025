import { useState, useEffect, useCallback } from 'react';
import statisticsService from '../services/statistics-service.js';

export const useStatistics = () => {
  // State cho tab hiện tại
  const [activeTab, setActiveTab] = useState('users');

  // State cho date range
  const [_startDate, _setStartDateInternal] = useState('');
  const [_endDate, _setEndDateInternal] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

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
  const fetchViewsByDay = useCallback(async (days = 0, startDate = '', endDate = '') => { // Default days to 0 for clarity when range is used
    setIsLoadingViewsByDay(true);
    try {
      let data;
      if (startDate && endDate) {
        data = await statisticsService.getViewsByDateRange(startDate, endDate);
      } else if (days > 0) { // Only fetch by days if days is positive
        data = await statisticsService.getViewsByDay(days);
      } else {
        data = []; // Default to empty if no valid parameters
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
  const fetchViewsByManga = useCallback(async (days = 0, limit = mangaLimit, startDate = '', endDate = '') => { // Default days to 0
    setIsLoadingViewsByManga(true);
    try {
      let data;
      if (startDate && endDate) {
        data = await statisticsService.getViewsByMangaDateRange(startDate, endDate, limit);
      } else if (days > 0) { // Only fetch by days if days is positive
        data = await statisticsService.getViewsByManga(days, limit);
      } else {
        data = []; // Default to empty
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
    // Reset date range when changing number of days explicitly
    _setStartDateInternal('');
    _setEndDateInternal('');
    setDateRange({ startDate: '', endDate: '' });
  };

  // Hàm mới cho setStartDate được export ra
  const setStartDate = useCallback((newDate) => {
    _setStartDateInternal(newDate);
    setDateRange(prevRange => ({ ...prevRange, startDate: newDate }));
    if (newDate) { // If a start date is set, user is intending to use date range
      setDaysToShow(0);
    } else if (!_endDate) { // If start date is cleared AND end date is also clear
      // Optionally revert daysToShow to a default to show "last N days"
      // setDaysToShow(7); // This would trigger a fetch for 7 days via useEffect
    }
  }, [_endDate, setDaysToShow]);

  // Hàm mới cho setEndDate được export ra
  const setEndDate = useCallback((newDate) => {
    _setEndDateInternal(newDate);
    setDateRange(prevRange => ({ ...prevRange, endDate: newDate }));
    if (newDate) { // If an end date is set, user is intending to use date range
      setDaysToShow(0);
    } else if (!_startDate) { // If end date is cleared AND start date is also clear
      // Optionally revert daysToShow to a default
      // setDaysToShow(7);
    }
  }, [_startDate, setDaysToShow]);


  // Xử lý thay đổi số lượng truyện
  const handleMangaLimitChange = (newLimit) => {
    setMangaLimit(newLimit);
    setMangaViewsLimit(newLimit);
  };

  // Làm mới tất cả dữ liệu
  const refreshAllData = useCallback(() => {
    fetchOverviewStats();
    // Logic làm mới dựa trên state hiện tại của dateRange và daysToShow
    if (dateRange.startDate && dateRange.endDate) {
      fetchViewsByDay(0, dateRange.startDate, dateRange.endDate);
      fetchViewsByManga(0, mangaLimit, dateRange.startDate, dateRange.endDate);
    } else if (daysToShow > 0) {
      fetchViewsByDay(daysToShow);
      fetchViewsByManga(daysToShow, mangaLimit);
    } else {
      // Fallback or default fetch if neither range nor positive daysToShow is set
      // e.g., fetch for default days or clear data
      fetchViewsByDay(7); // Example: default to 7 days if no range
      fetchViewsByManga(7, mangaLimit); // Example
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
    // Consider what to do if neither condition is met (e.g., daysToShow is 0, and range is incomplete)
    // Maybe fetch nothing or a default. Current fetchViewsByDay handles days=0 by defaulting to empty.
  }, [fetchViewsByDay, daysToShow, dateRange]); // dateRange is the key

  // Load thống kê theo truyện khi thay đổi tham số
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchViewsByManga(0, mangaLimit, dateRange.startDate, dateRange.endDate);
    } else if (daysToShow > 0) { // Ensure manga views also respect daysToShow > 0
      fetchViewsByManga(daysToShow, mangaLimit);
    }
  }, [fetchViewsByManga, daysToShow, mangaLimit, dateRange]); // dateRange is the key

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
  const refreshData = () => { // Ensure this function is correctly defined or uses refreshAllData
    refreshAllData();
  };

  return {
    // Interface mà Statistics page expect
    activeTab,
    startDate: _startDate, // Use the renamed internal state for display value
    endDate: _endDate,     // Use the renamed internal state for display value
    mangaViewsLimit,
    stats,
    loading,
    setActiveTab,
    setStartDate, // Export the new wrapped setStartDate
    setEndDate,   // Export the new wrapped setEndDate
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
    refreshAllData,
    fetchOverviewStats,
    fetchViewsByDay,
    fetchViewsByManga
  };
};

export default useStatistics;
