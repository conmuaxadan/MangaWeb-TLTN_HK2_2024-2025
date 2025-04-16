import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext.tsx';

interface ProfileLayoutProps {
  children: ReactNode;
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Xác định tab đang active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <section className="relative pb-16 lg:pb-24 bg-gray-900 text-white min-h-screen">
      <div className="container-fluid relative">
        <div className="profile-banner relative text-transparent">
          <div className="relative shrink-0">
            <img 
              src="/images/avt_default.jpg"
              className="h-80 w-full object-cover" 
              id="profile-banner" 
              alt="Profile Banner" 
            />
            <div className="absolute inset-0 bg-black/70"></div>
          </div>
        </div>
      </div>
      
      <div className="container relative mx-auto px-4">
        <div className="md:flex">
          {/* Sidebar */}
          <div className="md:w-1/3 md:px-3 lg:w-1/4">
            <div className="relative -mt-32 md:-mt-32">
              <div className="rounded-md bg-gray-800 p-6 shadow">
                <div className="profile-pic mb-5 text-center">
                  <div>
                    <div className="relative mx-auto size-28">
                      <img 
                        src={user?.avatarUrl || "/images/avt_default.jpg"} 
                        className="h-full w-full rounded-full shadow ring-4 ring-gray-700" 
                        id="profile-image" 
                        alt="Profile" 
                      />
                    </div>
                    <div className="mt-4">
                      <h5 className="text-lg font-semibold">{user?.displayName || 'User'}</h5>
                      <p className="text-gray-400">{user?.email || ''}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-700">
                  <ul className="sidebar-nav mb-0 mt-3 list-none">
                    <li className={`navbar-item account-menu ${isActive('/profile') ? 'active' : ''}`}>
                      <Link to="/profile" className="navbar-link flex items-center rounded py-2 text-gray-400 hover:text-white">
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faUser} />
                        </span>
                        <h6 className="mb-0 font-semibold">Thông tin chung</h6>
                      </Link>
                    </li>
                    <li className={`navbar-item account-menu ${isActive('/profile/settings') ? 'active' : ''}`}>
                      <Link to="/profile/settings" className="navbar-link flex items-center rounded py-2 text-gray-400 hover:text-white">
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faCog} />
                        </span>
                        <h6 className="mb-0 font-semibold">Cài đặt</h6>
                      </Link>
                    </li>
                    <li className="navbar-item account-menu">
                      <button 
                        onClick={handleLogout}
                        className="navbar-link flex items-center rounded py-2 text-gray-400 hover:text-white w-full text-left"
                      >
                        <span className="mb-0 mr-2 text-[18px]">
                          <FontAwesomeIcon icon={faSignOutAlt} />
                        </span>
                        <h6 className="mb-0 font-semibold">Đăng xuất</h6>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="mt-[30px] md:mt-0 md:w-2/3 md:px-3 lg:w-3/4">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileLayout;
