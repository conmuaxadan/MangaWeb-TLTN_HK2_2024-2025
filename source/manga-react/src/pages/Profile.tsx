import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileResponse } from '../interfaces/models/profile';
import profileService from '../services/profile-service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faClock, faComment, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../components/layouts/ProfileLayout.tsx';

const Profile: React.FC = () => {
  const { isLogin, user } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra token trong localStorage thay vì dựa vào isLogin
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Lấy số lượng bình luận của người dùng
        const comments = await profileService.getMyComments();
        if (comments && comments.result) {
          setCommentCount(comments.result.totalElements || 0);
        }

        // Sử dụng thông tin user từ AuthContext nếu có
        if (user) {
          setProfile(user);
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ProfileLayout>
      <div className="grid grid-cols-1 gap-[30px] pt-6">
        <div>
          <h5 className="text-xl font-semibold">Thông tin tài khoản:</h5>
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faEnvelope} className="mr-3 h-6 w-6 text-gray-400" />
              <div className="flex flex-1 flex-row gap-1 md:flex-row">
                <h6 className="mb-0 font-medium text-blue-500">Email:</h6>
                <span className="text-gray-400">{user?.email || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-3 h-6 w-6 text-gray-400" />
              <div className="flex flex-1 flex-row gap-1 md:flex-row">
                <h6 className="mb-0 font-medium text-blue-500">Tài khoản tạo lúc:</h6>
                <span className="text-gray-400">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <FontAwesomeIcon icon={faComment} className="mr-3 h-6 w-6 text-gray-400" />
              <div className="flex flex-1 flex-row gap-1 md:flex-row">
                <h6 className="mb-0 font-medium text-blue-500">Số bình luận:</h6>
                <span className="text-gray-400">{commentCount}</span>
              </div>
            </div>

            <div className="flex items-center">
              <FontAwesomeIcon icon={faBookmark} className="mr-3 h-6 w-6 text-gray-400" />
              <div className="flex flex-1 flex-row gap-1 md:flex-row">
                <h6 className="mb-0 font-medium text-blue-500">Chức danh:</h6>
                <span className="text-gray-400">MEMBER</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default Profile;
