# Shield Family Parent App

Ứng dụng React Native dành cho phụ huynh để quản lý và giám sát hoạt động trực tuyến của con em.

## 🚀 Tính năng

### Đã hoàn thành
- ✅ Đăng nhập cho phụ huynh
- ✅ Dashboard tổng quan
- ✅ Theo dõi hoạt động của trẻ
- ✅ Quản lý thiết bị
- ✅ Xét duyệt yêu cầu truy cập
- ✅ Cài đặt bảo vệ và giới hạn thời gian

### Sắp tới
- 🔄 Tích hợp API thực tế
- 🔄 Push notifications
- 🔄 Báo cáo chi tiết theo tuần/tháng
- 🔄 Quản lý nhiều con
- 🔄 Lọc web và app nâng cao

## 📱 Cấu trúc dự án

```
shield-parent-app/
├── src/
│   ├── screens/           # Các màn hình chính
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ActivityScreen.tsx
│   │   ├── DevicesScreen.tsx
│   │   ├── AccessRequestsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/        # React Navigation
│   │   └── AppNavigator.tsx
│   ├── contexts/          # Context API
│   │   └── AuthContext.tsx
│   ├── components/        # Reusable components
│   └── utils/            # Utilities và constants
│       ├── constants.ts
│       └── storage.ts
├── App.tsx
└── package.json
```

## 🛠️ Cài đặt

### Yêu cầu
- Node.js 18+
- npm hoặc yarn
- Expo CLI
- Android Studio (cho Android)
- Xcode (cho iOS - chỉ trên macOS)

### Các bước cài đặt

1. **Cài đặt dependencies:**
```bash
cd shield-parent-app
npm install
```

2. **Chạy trên Development:**
```bash
npm start
```

3. **Chạy trên Android:**
```bash
npm run android
```

4. **Chạy trên iOS (chỉ macOS):**
```bash
npm run ios
```

5. **Chạy trên Web:**
```bash
npm run web
```

## 🔧 Configuration

### Android
- Package name: `com.shieldfamily.parent`
- Permissions: INTERNET, ACCESS_NETWORK_STATE, CAMERA, READ/WRITE_EXTERNAL_STORAGE
- Min SDK: 21
- Target SDK: 34

### iOS
- Bundle ID: `com.shieldfamily.parent`
- Deployment Target: iOS 13.0+

## 📦 Dependencies chính

- **React Navigation** - Navigation framework
- **React Query** - Data fetching và caching
- **AsyncStorage** - Local storage
- **Expo** - Development platform

## 🎨 Design System

### Colors
- Primary: `#3b82f6` (Blue)
- Success: `#10b981` (Green)
- Danger: `#ef4444` (Red)
- Warning: `#f59e0b` (Orange)

## 🔐 Authentication

Hiện tại sử dụng mock authentication. Để đăng nhập:
- Email: bất kỳ
- Password: bất kỳ

**TODO:** Tích hợp với API backend thực tế

## 📱 Testing

```bash
# Test login flow
Email: parent@test.com
Password: 123456

# Test features
- Dashboard hiển thị thống kê
- Activity tracking
- Device management
- Access request approval
```

## 🚀 Build Production

### Android APK
```bash
expo build:android
```

### iOS IPA (requires Apple Developer Account)
```bash
expo build:ios
```

### EAS Build (recommended)
```bash
npm install -g eas-cli
eas build --platform android
```

## 📝 Notes

- App được tối ưu cho Android trước
- Sử dụng mock data cho development
- Cần tích hợp API backend
- UI/UX được thiết kế đơn giản, dễ sử dụng cho phụ huynh

## 🤝 Contributing

1. Clone repo
2. Tạo branch mới: `git checkout -b feature/TenTinhNang`
3. Commit: `git commit -m 'Thêm tính năng X'`
4. Push: `git push origin feature/TenTinhNang`
5. Tạo Pull Request

## 📄 License

MIT License - Shield Family © 2026

## 👨‍💻 Author

Shield Family Team

---

**Made with ❤️ for safer digital parenting**
