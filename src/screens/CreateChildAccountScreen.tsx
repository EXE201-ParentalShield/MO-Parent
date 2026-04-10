import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { createChildAccount } from '../api/children';

const { width } = Dimensions.get('window');

type CreateChildAccountScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateChildAccount'>;
};

const CreateChildAccountScreen = ({ navigation }: CreateChildAccountScreenProps) => {
  const [childName, setChildName] = useState('');
  const [username, setUsername] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    childName: '',
    username: '',
    childPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: keyof typeof errors, value: string) => {
    let error = '';
    
    switch (field) {
      case 'childName':
        if (!value.trim()) {
          error = 'Tên trẻ không được để trống';
        } else if (value.trim().length < 2) {
          error = 'Tên trẻ phải có ít nhất 2 ký tự';
        } else if (value.length > 100) {
          error = 'Tên trẻ không được quá 100 ký tự';
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
      case 'childPassword':
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
        } else if (value !== childPassword) {
          error = 'Mật khẩu xác nhận không khớp';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const fields: (keyof typeof errors)[] = ['childName', 'username', 'childPassword', 'confirmPassword'];
    let isValid = true;
    
    fields.forEach(field => {
      const value = field === 'childName' ? childName : 
                     field === 'username' ? username :
                     field === 'childPassword' ? childPassword : confirmPassword;
      if (!validateField(field, value)) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await createChildAccount({
        childName,
        username,
        password: childPassword,
      });
      
      if (response.success) {
        Alert.alert(
          'Thành công', 
          `Đã tạo tài khoản cho ${childName}\nTên đăng nhập: ${username}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        // Show error inline instead of Alert
        const errorMessage = response.message || 'Không thể tạo tài khoản';
        setErrors(prev => ({ ...prev, username: errorMessage }));
      }
    } catch (error: any) {
      // Show error inline instead of Alert
      const errorMessage = error.message || 'Không thể tạo tài khoản. Vui lòng thử lại.';
      setErrors(prev => ({ ...prev, username: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd, '#FFFFFF']}
      locations={[0, 0.3, 1]}
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
            <View style={styles.header}>
              <Text style={styles.title}>Tạo tài khoản cho trẻ</Text>
              <Text style={styles.subtitle}>Thêm thành viên mới vào gia đình của bạn</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tên của trẻ</Text>
                <TextInput
                  style={[styles.input, errors.childName && styles.inputError]}
                  placeholder="Nhập tên đầy đủ"
                  value={childName}
                  onChangeText={(text) => {
                    setChildName(text);
                    if (errors.childName) validateField('childName', text);
                  }}
                  onBlur={() => validateField('childName', childName)}
                  editable={!isLoading}
                />
                {errors.childName ? <Text style={styles.errorText}>{errors.childName}</Text> : null}
              </View>

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
                  style={[styles.input, errors.childPassword && styles.inputError]}
                  placeholder="••••••••"
                  value={childPassword}
                  onChangeText={(text) => {
                    setChildPassword(text);
                    if (errors.childPassword) validateField('childPassword', text);
                  }}
                  onBlur={() => validateField('childPassword', childPassword)}
                  secureTextEntry
                  editable={!isLoading}
                />
                {errors.childPassword ? <Text style={styles.errorText}>{errors.childPassword}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) validateField('confirmPassword', text);
                  }}
                  onBlur={() => validateField('confirmPassword', confirmPassword)}
                  secureTextEntry
                  editable={!isLoading}
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleCreateAccount}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </Text>
              </TouchableOpacity>
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
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(255, 240, 240, 0.5)',
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
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateChildAccountScreen;