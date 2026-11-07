import { useToast } from '../../providers/ToastProvider';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addAddress, updateAddress } from '../../store/slices/addressSlice';
import { Button } from '../../components/ui';

const AddEditAddressScreen = ({ navigation, route }: any) => {
  const { showToast } = useToast();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.address);
  const user = useSelector((state: any) => state.auth.user);

  const editAddress = route.params?.address;
  const isSelectMode = route.params?.isSelectMode;
  const isEdit = !!editAddress;

  const [form, setForm] = useState({
    fullName: editAddress?.fullName || user?.name || '',
    mobile: editAddress?.mobile || user?.mobile || '',
    houseNo: editAddress?.houseNo || '',
    building: editAddress?.building || '',
    area: editAddress?.area || '',
    landmark: editAddress?.landmark || '',
    city: editAddress?.city || '',
    state: editAddress?.state || '',
    pincode: editAddress?.pincode || '',
    addressType: editAddress?.addressType || 'Home',
  });

  const handleChange = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    const { fullName, mobile, houseNo, area, city, state, pincode } = form;
    if (!fullName || !mobile || !houseNo || !area || !city || !state || !pincode) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    try {
      if (isEdit) {
        await dispatch(updateAddress({ id: editAddress._id, addressData: form })).unwrap();
        showToast('Address updated successfully', 'success');
      } else {
        await dispatch(addAddress(form)).unwrap();
        showToast('Address added successfully', 'success');
      }
      if (isSelectMode) {
         // When adding in checkout, address slice automatically selects the first/added one.
         navigation.goBack(); // Back to checkout or address list
      } else {
         navigation.goBack();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save address', 'error');
    }
  };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 20, fontFamily: FONT_FAMILY.bold, color: colors.text, marginLeft: 16 },
    content: { padding: 20 },
    label: { fontSize: 14, color: colors.text, fontFamily: FONT_FAMILY.semiBold, marginBottom: 8 },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 16, fontFamily: FONT_FAMILY.regular, color: colors.text, marginBottom: 16 },
    row: { flexDirection: 'row', gap: 16 },
    col: { flex: 1 },
    typeContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    typeBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    typeBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
    typeText: { fontSize: 14, fontFamily: FONT_FAMILY.semiBold, color: colors.muted },
    typeTextActive: { color: colors.primary },
    bottomArea: { padding: 20, paddingBottom: insets.bottom + 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'Add New Address'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={colors.muted} value={form.fullName} onChangeText={t => handleChange('fullName', t)} />

        <Text style={styles.label}>Mobile Number *</Text>
        <TextInput style={styles.input} placeholder="9876543210" keyboardType="phone-pad" placeholderTextColor={colors.muted} value={form.mobile} onChangeText={t => handleChange('mobile', t)} />

        <Text style={styles.label}>House/Flat No. *</Text>
        <TextInput style={styles.input} placeholder="Flat 101" placeholderTextColor={colors.muted} value={form.houseNo} onChangeText={t => handleChange('houseNo', t)} />

        <Text style={styles.label}>Building/Apartment</Text>
        <TextInput style={styles.input} placeholder="Green Valley" placeholderTextColor={colors.muted} value={form.building} onChangeText={t => handleChange('building', t)} />

        <Text style={styles.label}>Street/Area *</Text>
        <TextInput style={styles.input} placeholder="Main Street" placeholderTextColor={colors.muted} value={form.area} onChangeText={t => handleChange('area', t)} />

        <Text style={styles.label}>Landmark (Optional)</Text>
        <TextInput style={styles.input} placeholder="Near Apollo Hospital" placeholderTextColor={colors.muted} value={form.landmark} onChangeText={t => handleChange('landmark', t)} />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>City *</Text>
            <TextInput style={styles.input} placeholder="Mumbai" placeholderTextColor={colors.muted} value={form.city} onChangeText={t => handleChange('city', t)} />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>State *</Text>
            <TextInput style={styles.input} placeholder="Maharashtra" placeholderTextColor={colors.muted} value={form.state} onChangeText={t => handleChange('state', t)} />
          </View>
        </View>

        <Text style={styles.label}>Pincode *</Text>
        <TextInput style={styles.input} placeholder="400001" keyboardType="number-pad" placeholderTextColor={colors.muted} value={form.pincode} onChangeText={t => handleChange('pincode', t)} />

        <Text style={styles.label}>Address Type</Text>
        <View style={styles.typeContainer}>
          {['Home', 'Work', 'Other'].map(type => (
            <TouchableOpacity 
              key={type} 
              style={[styles.typeBtn, form.addressType === type && styles.typeBtnActive]}
              onPress={() => handleChange('addressType', type)}
            >
              <Text style={[styles.typeText, form.addressType === type && styles.typeTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <Button 
          title={isEdit ? 'Save Changes' : 'Save Address'} 
          onPress={handleSave} 
          disabled={loading} 
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddEditAddressScreen;
