import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const validateField = (field: 'username' | 'password', value: string) => {
    let error = '';

    if (field === 'username') {
      if (!value.trim()) {
        error = 'Tên đăng nhập không được để trống';
      } else if (value.trim().length < 3) {
        error = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      } else if (value.trim().length > 50) {
        error = 'Tên đăng nhập không được quá 50 ký tự';
      }
    } else {
      if (!value) {
        error = 'Mật khẩu không được để trống';
      } else if (value.length < 6) {
        error = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const usernameValid = validateField('username', username);
    const passwordValid = validateField('password', password);
    return usernameValid && passwordValid;
  };

  const mapLoginError = (message: string) => {
    const normalized = message.toLowerCase();

    if (normalized.includes('username') && normalized.includes('required')) {
      setErrors((prev) => ({ ...prev, username: 'Tên đăng nhập không được để trống' }));
      return;
    }

    if (normalized.includes('username') && (normalized.includes('not found') || normalized.includes('không tồn tại'))) {
      setErrors((prev) => ({ ...prev, username: 'Tên đăng nhập không đúng' }));
      return;
    }

    if (normalized.includes('invalid username')) {
      setErrors((prev) => ({ ...prev, username: 'Tên đăng nhập không đúng' }));
      return;
    }

    if (normalized.includes('password') && normalized.includes('required')) {
      setErrors((prev) => ({ ...prev, password: 'Mật khẩu không được để trống' }));
      return;
    }

    if (normalized.includes('password') && (normalized.includes('invalid') || normalized.includes('incorrect') || normalized.includes('không đúng'))) {
      setErrors((prev) => ({ ...prev, password: 'Mật khẩu không đúng' }));
      return;
    }

    if (normalized.includes('invalid credentials') || normalized.includes('invalid username or password')) {
      setErrors((prev) => ({
        ...prev,
        username: 'Tên đăng nhập hoặc mật khẩu không đúng',
        password: 'Tên đăng nhập hoặc mật khẩu không đúng',
      }));
      return;
    }

    if (normalized.includes('tên đăng nhập hoặc mật khẩu không đúng')) {
      setErrors((prev) => ({
        ...prev,
        username: 'Tên đăng nhập hoặc mật khẩu không đúng',
        password: 'Tên đăng nhập hoặc mật khẩu không đúng',
      }));
      return;
    }

    setFormError(message || 'Đăng nhập thất bại. Vui lòng thử lại.');
  };

  const handleLogin = async () => {
    setFormError('');
    setErrors({ username: '', password: '' });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
    } catch (error: any) {
      mapLoginError(error.message || '');
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 22 : 0}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
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
            <Text style={styles.subtitle}>Dành cho phụ huynh</Text>
          </View>

          <View style={styles.form}>
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <TextInput
                style={[styles.input, errors.username ? styles.inputError : null]}
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setFormError('');
                  if (errors.username) {
                    validateField('username', text);
                  }
                }}
                onBlur={() => validateField('username', username)}
                autoCapitalize="none"
                editable={!isLoading}
              />
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setFormError('');
                    if (errors.password) {
                      validateField('password', text);
                    }
                  }}
                  onBlur={() => validateField('password', password)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading ? styles.buttonDisabled : null]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
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
          </ScrollView>
        </TouchableWithoutFeedback>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
  },
  form: {
    width: '100%',
  },
  formError: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
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
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingRight: 52,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
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
