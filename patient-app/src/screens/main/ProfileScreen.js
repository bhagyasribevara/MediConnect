import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/patient/records');
      setRecords(res.data);
    } catch (e) {
      console.log('Error fetching records', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-clay">
      <ScrollView className="flex-1 p-6">
        
        {/* Profile Header */}
        <View className="items-center mb-8 mt-4">
          <View className="w-24 h-24 bg-secondary rounded-full items-center justify-center shadow-sm mb-4">
            <Text className="text-white font-bold text-4xl">{user?.username?.[0]?.toUpperCase() || 'P'}</Text>
          </View>
          <Text className="text-2xl font-bold text-dark">{user?.username || 'Patient'}</Text>
          <Text className="text-gray-500 font-medium mt-1">Patient ID: #MC-{Math.floor(Math.random() * 9000) + 1000}</Text>
        </View>

        {/* Medical Records Section */}
        <View className="flex-row items-center mb-4">
          <Ionicons name="folder-open" size={24} color="#374151" />
          <Text className="text-lg font-bold text-dark ml-2">Medical Records</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#00BFA6" />
        ) : records.length > 0 ? (
          records.map((r, i) => (
            <View key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-bold text-dark">{r.type || 'Report'}</Text>
                <Text className="text-xs text-gray-500 font-medium">{r.date}</Text>
              </View>
              {r.summary && <Text className="text-gray-600 text-sm mb-2 leading-5" numberOfLines={2}>{r.summary}</Text>}
              <TouchableOpacity className="flex-row items-center mt-1">
                <Text className="text-secondary font-bold text-sm">View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#00BFA6" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 items-center">
            <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-500 mt-2 font-medium">No medical records found</Text>
          </View>
        )}

        {/* Settings & Logout */}
        <Text className="text-lg font-bold text-dark mb-4 mt-4">Account</Text>
        <TouchableOpacity 
          className="bg-white py-4 px-5 rounded-2xl shadow-sm border border-gray-100 mb-4 flex-row items-center"
        >
          <Ionicons name="settings-outline" size={20} color="#374151" />
          <Text className="text-dark font-bold ml-3 text-base">Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={logout}
          className="bg-red-50 border border-red-100 py-4 px-5 rounded-2xl shadow-sm mb-10 flex-row items-center"
        >
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text className="text-red-600 font-bold ml-3 text-base">Logout</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  );
}
