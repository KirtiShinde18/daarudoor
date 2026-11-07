import { useToast } from '../../providers/ToastProvider';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../../components/ui';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';

const EditProfileScreen = () => {
  const { showToast } = useToast();
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const { userProfile } = route.params || {};

  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [mobile, setMobile] = useState(userProfile?.mobile || '');
  const [profilePic, setProfilePic] = useState(userProfile?.profilePic || '');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfilePic(result.assets[0].uri);
      setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      showToast('A valid name is required', 'error');
      return;
    }
    if (trimmedName.length > 50) {
      showToast('Name is too long', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5500' : 'http://localhost:5500');

      const payload: any = { name: trimmedName, mobile };
      if (base64Image) {
        payload.profilePic = base64Image;
      } else if (profilePic === '') {
        payload.profilePic = ''; // indicate delete
      }

      const res = await fetch(`${API_URL}/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        dispatch(updateUser(data.data));
        showToast('Profile updated successfully', 'success');
        navigation.goBack();
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('An error occurred while updating profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 16,
    },
    container: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 120,
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
      overflow: 'hidden',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },
    editIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.text,
    },
    saveBtn: {
      marginTop: 20,
      width: '100%',
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.imageContainer}>
            <View>
              <View style={styles.avatar}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImg} />
                ) : (
                  <MaterialIcons name="person" size={50} color={colors.muted} />
                )}
              </View>
              <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
                <MaterialIcons name="edit" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            {(profilePic || base64Image) && (
              <TouchableOpacity 
                style={{ marginTop: 12 }}
                onPress={() => {
                  setProfilePic('');
                  setBase64Image('');
                }}
              >
                <Text style={{ color: colors.error, fontWeight: '600' }}>Remove Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, { opacity: 0.7, backgroundColor: colors.background }]}
              value={email}
              editable={false}
              placeholder="Enter your email"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={mobile}
              onChangeText={setMobile}
              placeholder="Enter your mobile number"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
            />
          </View>

          <Button
            title={loading ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            style={styles.saveBtn}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
