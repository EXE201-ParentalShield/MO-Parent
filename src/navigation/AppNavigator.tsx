import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { getFreeTrialStatus } from '../api/freeTrial';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TrialScreen from '../screens/TrialScreen';
import DashboardScreen from '../screens/DashboardStoryScreen';
import ActivityScreen from '../screens/ActivityStoryScreen';
import DevicesScreen from '../screens/DevicesScreen';
import AccessRequestsScreen from '../screens/AccessRequestsStoryScreen';
import SettingsScreen from '../screens/SettingsStoryScreen';
import CreateChildAccountScreen from '../screens/CreateChildAccountScreen';
import AddDeviceScreen from '../screens/AddDeviceScreen';
import UpgradePackageScreen from '../screens/UpgradePackageScreen';
import PaymentResultScreen from '../screens/PaymentResultScreen';
import FeatureIntroductionScreen from '../screens/FeatureIntroductionScreen';
import VNPayWebViewScreen from '../screens/VNPayWebViewScreen';
import AppsManagementScreen from '../screens/AppsManagementScreen';
import VideoManagementScreen from '../screens/VideoManagementScreen';

export type RootStackParamList = {
  FeatureIntroduction: undefined;
  Login: undefined;
  Register: undefined;
  Trial: undefined;
  Dashboard: undefined;
  Activity: undefined;
  Devices: undefined;
  AccessRequests: undefined;
  Settings: undefined;
  AppsManagement: undefined;
  VideoManagement: {
    appName?: string;
  };
  CreateChildAccount: undefined;
  AddDevice: undefined;
  UpgradePackage: undefined;
  VNPayWebView: {
    paymentUrl: string;
    paymentId: number;
    token: string;
    packageName?: string;
  };
  PaymentResult: {
    success: boolean;
    packageName?: string;
    amount?: string;
    transactionNo?: string;
    paidAt?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [initialAuthenticatedRoute, setInitialAuthenticatedRoute] = useState<'Dashboard' | 'Trial'>('Dashboard');
  const [isResolvingInitialRoute, setIsResolvingInitialRoute] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const resolveInitialRoute = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setInitialAuthenticatedRoute('Dashboard');
          setIsResolvingInitialRoute(false);
        }
        return;
      }

      if (isMounted) {
        setIsResolvingInitialRoute(true);
      }

      try {
        const trialStatus = await getFreeTrialStatus();
        if (isMounted) {
          setInitialAuthenticatedRoute(trialStatus.hasTrial ? 'Dashboard' : 'Trial');
        }
      } catch (error) {
        console.error('[AppNavigator] Failed to resolve initial route:', error);
        if (isMounted) {
          setInitialAuthenticatedRoute('Dashboard');
        }
      } finally {
        if (isMounted) {
          setIsResolvingInitialRoute(false);
        }
      }
    };

    resolveInitialRoute();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (isLoading || (isAuthenticated && isResolvingInitialRoute)) {
    return null; // or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
        initialRouteName={isAuthenticated ? initialAuthenticatedRoute : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3B82F6',
          },
          headerShadowVisible: false,
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#F9FAFB',
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen 
              name="FeatureIntroduction" 
              component={FeatureIntroductionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Trial" 
              component={TrialScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Trial" 
              component={TrialScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Tổng quan' }}
            />
            <Stack.Screen 
              name="Activity" 
              component={ActivityScreen}
              options={{ title: 'Hoạt động' }}
            />
            <Stack.Screen 
              name="Devices" 
              component={DevicesScreen}
              options={{ title: 'Thiết bị' }}
            />
            <Stack.Screen 
              name="AccessRequests" 
              component={AccessRequestsScreen}
              options={{ title: 'Yêu cầu truy cập' }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ title: 'Cài đặt' }}
            />
            <Stack.Screen
              name="AppsManagement"
              component={AppsManagementScreen}
              options={{ title: 'Quản lý ứng dụng' }}
            />
            <Stack.Screen
              name="VideoManagement"
              component={VideoManagementScreen}
              options={{ title: 'Quản lý video YouTube' }}
            />
            <Stack.Screen 
              name="CreateChildAccount" 
              component={CreateChildAccountScreen}
              options={{ title: 'Tạo tài khoản trẻ em' }}
            />
            <Stack.Screen 
              name="AddDevice" 
              component={AddDeviceScreen}
              options={{ title: 'Thêm thiết bị' }}
            />
            <Stack.Screen 
              name="UpgradePackage" 
              component={UpgradePackageScreen}
              options={{ title: 'Nâng cấp gói' }}
            />
            <Stack.Screen
              name="VNPayWebView"
              component={VNPayWebViewScreen}
              options={{ title: 'Thanh toán VNPay', headerBackTitle: 'Hủy' }}
            />
            <Stack.Screen 
              name="PaymentResult" 
              component={PaymentResultScreen}
              options={{ title: 'Kết quả thanh toán' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
