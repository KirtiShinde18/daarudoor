import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchAddresses, deleteAddress, setDefaultAddress, setSelectedCheckoutAddress, Address } from '../../store/slices/addressSlice';
import { Button } from '../../components/ui';
import { useToast } from '../../providers/ToastProvider';

const MyAddressesScreen = ({ navigation, route }: any) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const { addresses, loading } = useSelector((state: RootState) => state.address);
  
  const isSelectMode = route.params?.selectMode || false;

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleDelete = (id: string) => {
    dispatch(deleteAddress(id));
    showToast('Address deleted successfully', 'success');
  };

  const handleSetDefault = (id: string) => {
    dispatch(setDefaultAddress(id));
  };

  const handleSelectAddress = (address: Address) => {
    if (isSelectMode) {
      dispatch(setSelectedCheckoutAddress(address));
      navigation.goBack();
    }
  };

  const renderAddress = ({ item }: { item: Address }) => (
    <TouchableOpacity 
      style={[styles.card, item.isDefault && styles.defaultCard]}
      onPress={() => handleSelectAddress(item)}
      disabled={!isSelectMode}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{item.addressType}</Text>
        </View>
        {item.isDefault && <Text style={styles.defaultTag}>Default</Text>}
      </View>
      
      <Text style={styles.name}>{item.fullName}</Text>
      <Text style={styles.text}>{item.houseNo}{item.building ? `, ${item.building}` : ''}, {item.area}</Text>
      {item.landmark && <Text style={styles.text}>Landmark: {item.landmark}</Text>}
      <Text style={styles.text}>{item.city}, {item.state} - {item.pincode}</Text>
      <Text style={styles.mobile}>Mobile: {item.mobile}</Text>

      <View style={styles.actions}>
        {!item.isDefault && (
          <TouchableOpacity onPress={() => handleSetDefault(item._id)} style={styles.actionBtn}>
            <Text style={styles.actionText}>Set as Default</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddEditAddress', { address: item })} 
          style={styles.iconBtn}
        >
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.iconBtn}>
          <MaterialIcons name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 16 },
    list: { padding: 20 },
    card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    defaultCard: { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    typeTag: { backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    typeText: { fontSize: 12, fontWeight: '600', color: colors.text },
    defaultTag: { color: colors.primary, fontWeight: '700', fontSize: 12 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    text: { fontSize: 14, color: colors.muted, marginBottom: 2 },
    mobile: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 8 },
    actions: { flexDirection: 'row', alignItems: 'center', marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
    actionBtn: { marginRight: 16 },
    actionText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    iconBtn: { padding: 8, marginLeft: 8 },
    empty: { textAlign: 'center', color: colors.muted, marginTop: 40, fontSize: 16 },
    addBtnWrapper: { padding: 20, paddingBottom: insets.bottom + 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isSelectMode ? 'Select Address' : 'My Addresses'}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          renderItem={renderAddress}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No delivery addresses saved yet.</Text>}
        />
      )}

      <View style={styles.addBtnWrapper}>
        <Button 
          title="+ Add New Address" 
          onPress={() => navigation.navigate('AddEditAddress', { isSelectMode })} 
        />
      </View>
    </View>
  );
};

export default MyAddressesScreen;
