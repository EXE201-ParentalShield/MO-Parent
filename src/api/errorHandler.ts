// Shield Parent App - Error Handler
export const handleApiError = (error: any): string => {
  if (error.response) {
    const { status, data, config } = error.response;
    
    // Extract message from response
    let message = data?.message || data?.Message || '';
    
    // Translate common BE error messages to Vietnamese
    const translations: Record<string, string> = {
      'Invalid credentials': 'Tên đăng nhập hoặc mật khẩu không đúng',
      'Account not found': 'Không tìm thấy tài khoản này',
      'Device already registered': 'Thiết bị đã được đăng ký',
      'Device not found': 'Không tìm thấy thiết bị',
      'User not found': 'Không tìm thấy người dùng',
      'Username already exists': 'Tên đăng nhập đã tồn tại',
      'Email already exists': 'Email đã tồn tại',
    };
    
    // Check if message needs translation
    if (message && translations[message]) {
      message = translations[message];
    }
    
    switch (status) {
      case 400:
        return message || 'Dữ liệu không hợp lệ';
      case 401:
        // Keep login failures as credential errors instead of session-expired.
        if (config?.url?.includes('/auth/login')) {
          return message || 'Tên đăng nhập hoặc mật khẩu không đúng';
        }
        return message || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại';
      case 403:
        return 'Bạn không có quyền thực hiện thao tác này';
      case 404:
        return 'Không tìm thấy dữ liệu';
      case 409:
        return message || 'Dữ liệu đã tồn tại';
      case 500:
        return 'Lỗi server. Vui lòng thử lại sau';
      default:
        return message || 'Đã có lỗi xảy ra';
    }
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Timeout - Kết nối quá chậm';
  }
  
  if (error.message === 'Network Error') {
    return 'Không thể kết nối đến server';
  }
  
  return 'Đã có lỗi xảy ra. Vui lòng thử lại';
};

export const logError = (error: any, context: string) => {
  if (!__DEV__) {
    console.error(`[${context}]`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};
