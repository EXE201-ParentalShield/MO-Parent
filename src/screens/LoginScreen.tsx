import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import { getFreeTrialStatus } from '../api/freeTrial';

const { width } = Dimensions.get('window');

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const validateField = (field: 'username' | 'password', value: string) => {
    let error = '';
    
    if (field === 'username') {
      if (!value.trim()) {
        error = 'Tên đăng nhập không được để trống';
      } else if (value.length < 3) {
        error = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      } else if (value.length > 50) {
        error = 'Tên đăng nhập không được quá 50 ký tự';
      }
    } else if (field === 'password') {
      if (!value) {
        error = 'Mật khẩu không được để trống';
      } else if (value.length < 6) {
        error = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const usernameValid = validateField('username', username);
    const passwordValid = validateField('password', password);
    return usernameValid && passwordValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      
      console.log('[Login] Login successful, checking trial status...');
      
      // Check trial status để quyết định navigate đi đâu
      try {
        const trialStatus = await getFreeTrialStatus();
        console.log('[Login] Trial status:', JSON.stringify(trialStatus, null, 2));
        
        if (trialStatus.hasTrial) {
          // Đã có trial (dù active hay expired) → Dashboard
          console.log('[Login] User has trial, navigating to Dashboard');
          navigation.replace('Dashboard');
        } else {
          // Chưa có trial → Trial screen
          console.log('[Login] User has no trial, navigating to Trial');
          navigation.replace('Trial');
        }
      } catch (trialError) {
        console.error('[Login] Error checking trial:', trialError);
        // Nếu lỗi khi check trial, vào Dashboard
        navigation.replace('Dashboard');
      }
      
    } catch (error: any) {
      const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrors(prev => ({ ...prev, password: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd, '#FFFFFF']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoGlow} />
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Shield Family</Text>
            <Text style={styles.subtitle}>Dành cho Phụ huynh</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) validateField('username', text);
                }}
                onBlur={() => validateField('username', username)}
                autoCapitalize="none"
                editable={!isLoading}
              />
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) validateField('password', text);
                }}
                onBlur={() => validateField('password', password)}
                secureTextEntry
                editable={!isLoading}
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.glow,
    opacity: 0.4,
  },
  logo: {
    width: 100,
    height: 100,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    opacity: 1,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(255, 240, 240, 0.95)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
    padding: 8,
  },
  forgotPasswordText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#1f2937',
  },
  registerLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
