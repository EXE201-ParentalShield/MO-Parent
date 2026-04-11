import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { resetPasswordWithOtp, sendForgotPasswordOtp } from '../api/auth';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateEmail = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) {
      return 'Email không được để trống';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      return 'Email không hợp lệ';
    }

    return '';
  };

  const validateResetForm = () => {
    let isValid = true;
    const nextErrors = {
      email: '',
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    };

    nextErrors.email = validateEmail(email);
    if (nextErrors.email) {
      isValid = false;
    }

    if (!otpCode.trim()) {
      nextErrors.otpCode = 'Mã OTP không được để trống';
      isValid = false;
    } else if (!/^\d{6}$/.test(otpCode.trim())) {
      nextErrors.otpCode = 'Mã OTP phải gồm 6 chữ số';
      isValid = false;
    }

    if (!newPassword) {
      nextErrors.newPassword = 'Mật khẩu mới không được để trống';
      isValid = false;
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      isValid = false;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const handleSendOtp = async () => {
    setFormMessage('');
    const emailError = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: emailError }));

    if (emailError) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await sendForgotPasswordOtp(email.trim());
      setFormMessage(response.message || 'Mã OTP đã được gửi. Vui lòng kiểm tra email.');
      setStep(2);
    } catch (error: any) {
      const message = error.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
      setErrors((prev) => ({ ...prev, email: message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setFormMessage('');

    if (!validateResetForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPasswordWithOtp(
        email.trim(),
        otpCode.trim(),
        newPassword,
        confirmPassword
      );

      setFormMessage(response.message || 'Đổi mật khẩu thành công');
      navigation.replace('Login');
    } catch (error: any) {
      const message = error.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      const normalized = message.toLowerCase();

      if (normalized.includes('otp')) {
        setErrors((prev) => ({ ...prev, otpCode: message }));
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

      setFormMessage(message);
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
              <Text style={styles.title}>Quên mật khẩu</Text>
              <Text style={styles.subtitle}>
                {step === 1
                  ? 'Nhập email để nhận mã OTP 6 số'
                  : 'Nhập OTP và mật khẩu mới để hoàn tất'}
              </Text>

              {formMessage ? <Text style={styles.formMessage}>{formMessage}</Text> : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  editable={!isLoading && step === 1}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              {step === 2 ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Mã OTP</Text>
                    <TextInput
                      style={[styles.input, errors.otpCode ? styles.inputError : null]}
                      placeholder="Nhập 6 số OTP"
                      keyboardType="number-pad"
                      value={otpCode}
                      onChangeText={(text) => {
                        setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6));
                        if (errors.otpCode) {
                          setErrors((prev) => ({ ...prev, otpCode: '' }));
                        }
                      }}
                      editable={!isLoading}
                    />
                    {errors.otpCode ? <Text style={styles.errorText}>{errors.otpCode}</Text> : null}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Mật khẩu mới</Text>
                    <TextInput
                      style={[styles.input, errors.newPassword ? styles.inputError : null]}
                      placeholder="Nhập mật khẩu mới"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        if (errors.newPassword) {
                          setErrors((prev) => ({ ...prev, newPassword: '' }));
                        }
                      }}
                      editable={!isLoading}
                    />
                    {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                    <TextInput
                      style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                      placeholder="Nhập lại mật khẩu mới"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errors.confirmPassword) {
                          setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        }
                      }}
                      editable={!isLoading}
                    />
                    {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                  </View>
                </>
              ) : null}

              {step === 1 ? (
                <TouchableOpacity
                  style={[styles.button, isLoading ? styles.buttonDisabled : null]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi mã OTP</Text>}
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.button, isLoading ? styles.buttonDisabled : null]}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đổi mật khẩu</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleSendOtp}
                    disabled={isLoading}
                  >
                    <Text style={styles.secondaryButtonText}>Gửi lại OTP</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={() => navigation.replace('Login')} disabled={isLoading}>
                <Text style={styles.backText}>Quay lại đăng nhập</Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  formMessage: {
    color: COLORS.primaryDark,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  inputContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    marginTop: 6,
    color: COLORS.danger,
    fontSize: 12,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  backText: {
    marginTop: 16,
    textAlign: 'center',
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
