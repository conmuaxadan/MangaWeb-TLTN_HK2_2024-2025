import { v4 as uuidv4 } from 'uuid';

const SESSION_ID_KEY = 'manga_session_id';

class SessionService {
    /**
     * Lấy sessionId hiện tại hoặc tạo mới nếu chưa có
     * @returns sessionId
     */
    getSessionId(): string {
        let sessionId = localStorage.getItem(SESSION_ID_KEY);
        
        if (!sessionId) {
            sessionId = this.createNewSessionId();
            localStorage.setItem(SESSION_ID_KEY, sessionId);
        }
        
        return sessionId;
    }
    
    /**
     * Tạo một sessionId mới
     * @returns sessionId mới
     */
    private createNewSessionId(): string {
        return uuidv4();
    }
}

export default new SessionService();
