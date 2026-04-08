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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const validateField = (field: keyof typeof formData, value: string, passwordValue = formData.password) => {
    let error = '';

    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Họ và tên không được để trống';
        } else if (value.trim().length < 2) {
          error = 'Họ và tên phải có ít nhất 2 ký tự';
        } else if (value.trim().length > 100) {
          error = 'Họ và tên không được quá 100 ký tự';
        }
        break;
      case 'username':
        if (!value.trim()) {
          error = 'Tên đăng nhập không được để trống';
        } else if (value.trim().length < 3) {
          error = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        } else if (value.trim().length > 50) {
          error = 'Tên đăng nhập không được quá 50 ký tự';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email không được để trống';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Email không hợp lệ';
        } else if (value.trim().length > 100) {
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
        } else if (value !== passwordValue) {
          error = 'Mật khẩu xác nhận không khớp';
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const fields: (keyof typeof formData)[] = ['fullName', 'username', 'email', 'password', 'confirmPassword'];
    let isValid = true;

    fields.forEach((field) => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    if (formData.phoneNumber && !validateField('phoneNumber', formData.phoneNumber)) {
      isValid = false;
    }

    return isValid;
  };

  const mapRegisterError = (message: string) => {
    const normalized = message.toLowerCase();

    if (normalized.includes('username')) {
      setErrors((prev) => ({ ...prev, username: message }));
      return;
    }

    if (normalized.includes('email')) {
      setErrors((prev) => ({ ...prev, email: message }));
      return;
    }

    if (normalized.includes('password') && normalized.includes('match')) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Mật khẩu xác nhận không khớp' }));
      return;
    }

    if (normalized.includes('full name')) {
      setErrors((prev) => ({ ...prev, fullName: message }));
      return;
    }

    if (normalized.includes('phone')) {
      setErrors((prev) => ({ ...prev, phoneNumber: message }));
      return;
    }

    setFormError(message || 'Đăng ký thất bại. Vui lòng thử lại.');
  };

  const handleRegister = async () => {
    setFormError('');
    setErrors({
      username: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      email: '',
      phoneNumber: '',
    });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register(
        formData.username.trim(),
        formData.password,
        formData.fullName.trim(),
        formData.email.trim(),
        formData.phoneNumber.trim()
      );
      navigation.replace('Trial');
    } catch (error: any) {
      mapRegisterError(error.message || '');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    const nextFormData = { ...formData, [field]: value };
    setFormData(nextFormData);
    setFormError('');

    if (errors[field]) {
      validateField(field, value, field === 'password' ? value : nextFormData.password);
    }

    if (field === 'password' && nextFormData.confirmPassword) {
      validateField('confirmPassword', nextFormData.confirmPassword, value);
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
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Họ và tên <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.fullName ? styles.inputError : null]}
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
                  style={[styles.input, errors.username ? styles.inputError : null]}
                  placeholder="Nhập tên đăng nhập"
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
                  style={[styles.input, errors.email ? styles.inputError : null]}
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
                  style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
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
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, errors.password ? styles.inputError : null]}
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
                    onBlur={() => validateField('password', formData.password)}
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Xác nhận mật khẩu <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateField('confirmPassword', value)}
                    onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading ? styles.buttonDisabled : null]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>{isLoading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
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
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 14,
    paddingRight: 52,
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
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
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
