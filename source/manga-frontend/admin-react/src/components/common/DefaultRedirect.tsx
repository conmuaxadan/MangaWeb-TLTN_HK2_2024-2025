import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const DefaultRedirect = () => {
  const { hasMangaManagement, hasSystemManagement, hasTranslatorManagement } = useAuth();

  if (hasSystemManagement || hasMangaManagement) {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (hasTranslatorManagement) {
    return <Navigate to="/translator/my-mangas" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default DefaultRedirect;
