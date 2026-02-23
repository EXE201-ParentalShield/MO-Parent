import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ActivityScreen from '../screens/ActivityScreen';
import DevicesScreen from '../screens/DevicesScreen';
import AccessRequestsScreen from '../screens/AccessRequestsScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Activity: undefined;
  Devices: undefined;
  AccessRequests: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
