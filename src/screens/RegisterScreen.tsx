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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const validateField = (field: keyof typeof formData, value: string) => {
    let error = '';
    
    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Họ và tên không được để trống';
        } else if (value.trim().length < 2) {
          error = 'Họ và tên phải có ít nhất 2 ký tự';
        } else if (value.length > 100) {
          error = 'Họ và tên không được quá 100 ký tự';
        }
        break;
      case 'username':
        if (!value.trim()) {
          error = 'Tên đăng nhập không được để trống';
        } else if (value.length < 3) {
          error = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        } else if (value.length > 50) {
          error = 'Tên đăng nhập không được quá 50 ký tự';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email không được để trống';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Email không hợp lệ';
        } else if (value.length > 100) {
          error = 'Email không được quá 100 ký tự';
        }
        break;
      case 'phoneNumber':
        if (value && !/^[0-9+\-() ]{10,15}$/.test(value)) {
          error = 'Số điện thoại không hợp lệ';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Mật khẩu không được để trống';
        } else if (value.length < 6) {
          error = 'Mật khẩu phải có ít nhất 6 ký tự';
        } else if (value.length > 100) {
          error = 'Mật khẩu không được quá 100 ký tự';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Xác nhận mật khẩu không được để trống';
        } else if (value !== formData.password) {
          error = 'Mật khẩu xác nhận không khớp';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const fields: (keyof typeof formData)[] = ['fullName', 'username', 'email', 'password', 'confirmPassword'];
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    
    // Validate optional phone if provided
    if (formData.phoneNumber) {
      if (!validateField('phoneNumber', formData.phoneNumber)) {
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register(
        formData.username,
        formData.password,
        formData.fullName,
        formData.email,
        formData.phoneNumber
      );
    } catch (error: any) {
      const errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      // Set general error on password field
      setErrors(prev => ({ ...prev, password: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      validateField(field, value);
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              <Text style={styles.title}>Đăng ký tài khoản</Text>
              <Text style={styles.subtitle}>Shield Family - Phụ huynh</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Họ và tên <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChangeText={(value) => updateField('fullName', value)}
                  onBlur={() => validateField('fullName', formData.fullName)}
                  editable={!isLoading}
                />
                {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Tên đăng nhập <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.username && styles.inputError]}
                  placeholder="username"
                  value={formData.username}
                  onChangeText={(value) => updateField('username', value)}
                  onBlur={() => validateField('username', formData.username)}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="example@email.com"
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  onBlur={() => validateField('email', formData.email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={[styles.input, errors.phoneNumber && styles.inputError]}
                  placeholder="0123456789"
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateField('phoneNumber', value)}
                  onBlur={() => validateField('phoneNumber', formData.phoneNumber)}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
                {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Mật khẩu <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  onBlur={() => validateField('password', formData.password)}
                  secureTextEntry
                  editable={!isLoading}
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Xác nhận mật khẩu <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                  secureTextEntry
                  editable={!isLoading}
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.glow,
    opacity: 0.4,
  },
  logo: {
    width: 80,
    height: 80,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#374151',
    opacity: 1,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ff6b6b',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(255, 240, 240, 0.9)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  loginLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
