import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { createChildAccount } from '../api/children';


type AddDeviceScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddDevice'>;

interface Props {
  navigation: AddDeviceScreenNavigationProp;
}

const AddDeviceScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceType: 'Android',
    osVersion: '',
    childUsername: '',
    childPassword: '',
  });
  const [errors, setErrors] = useState({
    deviceName: '',
    deviceType: '',
    osVersion: '',
    childUsername: '',
    childPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const validateField = (field: keyof typeof errors, value: string) => {
    let error = '';
    
    switch (field) {
      case 'deviceName':
        if (!value.trim()) {
          error = 'Tên thiết bị không được để trống';
        } else if (value.length < 2) {
          error = 'Tên thiết bị phải có ít nhất 2 ký tự';
        } else if (value.length > 100) {
          error = 'Tên thiết bị không được quá 100 ký tự';
        }
        break;
      case 'deviceType':
        if (!value) {
          error = 'Vui lòng chọn loại thiết bị';
        }
        break;
      case 'osVersion':
        if (!value.trim()) {
          error = 'Phiên bản OS không được để trống';
        } else if (value.length > 50) {
          error = 'Phiên bản OS không được quá 50 ký tự';
        }
        break;
      case 'childUsername':
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
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const fields: (keyof typeof errors)[] = ['deviceName', 'deviceType', 'osVersion', 'childUsername', 'childPassword'];
    let isValid = true;
    
    fields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    
    return isValid;
  };

  const handleAddDevice = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await createChildAccount({
        childName: formData.childUsername, // Using username as childName temporarily
        username: formData.childUsername,
        password: formData.childPassword,
        deviceName: formData.deviceName,
        deviceType: formData.deviceType,
        osVersion: formData.osVersion,
      });
      
      if (response.success) {
        Alert.alert(
          'Thành công', 
          `Đã thêm thiết bị "${formData.deviceName}" cho tài khoản ${formData.childUsername}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        const errorMessage = response.message || 'Không thể thêm thiết bị';
        setErrors(prev => ({ ...prev, childPassword: errorMessage }));
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể thêm thiết bị. Vui lòng thử lại.';
      setErrors(prev => ({ ...prev, childPassword: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      validateField(field, value);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd, '#FFFFFF']}
      locations={[0, 0.3, 1]}
      style={styles.gradient}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 12}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Thêm thiết bị mới</Text>
              <Text style={styles.subtitle}>Liên kết thiết bị với tài khoản trẻ em</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Thông tin thiết bị</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tên thiết bị</Text>
                <TextInput
                  style={[styles.input, errors.deviceName && styles.inputError]}
                  placeholder="VD: Samsung Galaxy A54 của con"
                  value={formData.deviceName}
                  onChangeText={(text) => updateField('deviceName', text)}
                  onBlur={() => validateField('deviceName', formData.deviceName)}
                  editable={!isLoading}
                  placeholderTextColor="#999"
                />
                {errors.deviceName ? <Text style={styles.errorText}>{errors.deviceName}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Loại thiết bị</Text>
                <View style={styles.deviceTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.deviceTypeButton,
                      formData.deviceType === 'Android' && styles.deviceTypeButtonActive
                    ]}
                    onPress={() => updateField('deviceType', 'Android')}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.deviceTypeText,
                      formData.deviceType === 'Android' && styles.deviceTypeTextActive
                    ]}>
                      🤖 Android
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deviceTypeButton,
                      formData.deviceType === 'iOS' && styles.deviceTypeButtonActive
                    ]}
                    onPress={() => updateField('deviceType', 'iOS')}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.deviceTypeText,
                      formData.deviceType === 'iOS' && styles.deviceTypeTextActive
                    ]}>
                      🍎 iOS
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.deviceType ? <Text style={styles.errorText}>{errors.deviceType}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phiên bản OS</Text>
                <TextInput
                  style={[styles.input, errors.osVersion && styles.inputError]}
                  placeholder="VD: Android 14 hoặc iOS 17.2"
                  value={formData.osVersion}
                  onChangeText={(text) => updateField('osVersion', text)}
                  onBlur={() => validateField('osVersion', formData.osVersion)}
                  editable={!isLoading}
                  placeholderTextColor="#999"
                />
                {errors.osVersion ? <Text style={styles.errorText}>{errors.osVersion}</Text> : null}
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Tài khoản trẻ em</Text>
              <Text style={styles.sectionSubtitle}>
                Nhập thông tin tài khoản trẻ em đã tạo
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tên đăng nhập</Text>
                <TextInput
                  style={[styles.input, errors.childUsername && styles.inputError]}
                  placeholder="username"
                  value={formData.childUsername}
                  onChangeText={(text) => updateField('childUsername', text)}
                  onBlur={() => validateField('childUsername', formData.childUsername)}
                  autoCapitalize="none"
                  editable={!isLoading}
                  placeholderTextColor="#999"
                />
                {errors.childUsername ? <Text style={styles.errorText}>{errors.childUsername}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={[styles.input, errors.childPassword && styles.inputError]}
                  placeholder="••••••••"
                  value={formData.childPassword}
                  onChangeText={(text) => updateField('childPassword', text)}
                  onBlur={() => validateField('childPassword', formData.childPassword)}
                  secureTextEntry
                  editable={!isLoading}
                  placeholderTextColor="#999"
                />
                {errors.childPassword ? <Text style={styles.errorText}>{errors.childPassword}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleAddDevice}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Đang thêm...' : 'Thêm thiết bị'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    paddingBottom: 28,
  },
  content: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  deviceTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  deviceTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  deviceTypeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  deviceTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  deviceTypeTextActive: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
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
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddDeviceScreen;
