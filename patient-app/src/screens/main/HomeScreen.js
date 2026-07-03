import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSOS, setIsSOS] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/patient');
      setMetrics(res.data.metrics);
    } catch (e) {
      console.log('Error fetching dashboard', e);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSOS = () => {
    setIsSOS(!isSOS);
    if (!isSOS) {
      Alert.alert("Emergency Triggered", "Notifying nearest hospital and requesting an ambulance.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-clay">
      <ScrollView className="flex-1 p-6">
        
        {/* Header */}
        <View className="mb-8 mt-2 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-500 font-medium">Welcome back,</Text>
            <Text className="text-2xl font-bold text-dark">{user?.username || 'Patient'}</Text>
          </View>
          <View className="w-12 h-12 bg-secondary rounded-full items-center justify-center shadow-sm">
            <Text className="text-white font-bold text-lg">{user?.username?.[0]?.toUpperCase() || 'P'}</Text>
          </View>
        </View>

        {/* SOS Button */}
        <TouchableOpacity 
          onPress={triggerSOS}
          className={`w-full py-6 rounded-3xl items-center justify-center mb-6 shadow-sm ${isSOS ? 'bg-red-600' : 'bg-red-50 border border-red-200'}`}
        >
          <Ionicons name="warning" size={24} color={isSOS ? 'white' : '#dc2626'} />
          <Text className={`text-2xl font-bold mt-2 ${isSOS ? 'text-white' : 'text-red-600'}`}>
            {isSOS ? 'SOS TRIGGERED' : 'EMERGENCY SOS'}
          </Text>
          {!isSOS && <Text className="text-red-500 mt-2 text-center px-4 font-medium">Tap to notify nearest hospital and request an ambulance.</Text>}
        </TouchableOpacity>

        {/* Dashboard Metrics */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#00BFA6" />
        ) : (
          <View>
            <View className="flex-row justify-between mb-6 gap-4">
              <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <Text className="text-gray-500 font-medium text-xs">Appointments</Text>
                <Text className="text-2xl font-bold text-dark mt-1">{metrics?.appointments || 0}</Text>
              </View>
              <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <Text className="text-gray-500 font-medium text-xs">Prescriptions</Text>
                <Text className="text-2xl font-bold text-dark mt-1">{metrics?.prescriptions || 0}</Text>
              </View>
            </View>
            {metrics?.recent_activity && (
              <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <Text className="text-gray-500 font-bold mb-1">Recent Activity</Text>
                <Text className="text-dark font-medium">{metrics.recent_activity}</Text>
              </View>
            )}
          </View>
        )}

        {/* Navigation Cards */}
        <Text className="text-lg font-bold text-dark mb-4">Quick Actions</Text>
        <View className="flex-row justify-between mb-8 gap-4">
          <TouchableOpacity 
            onPress={() => navigation.navigate('AIDoctor')}
            className="flex-1 bg-secondary py-5 rounded-2xl shadow-sm items-center justify-center border border-[#00BFA6]"
          >
            <Ionicons name="chatbubbles" size={32} color="white" />
            <Text className="text-white font-bold text-lg mt-2">AI Doctor</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('MedLens')}
            className="flex-1 bg-white py-5 rounded-2xl shadow-sm items-center justify-center border border-gray-100"
          >
            <Ionicons name="scan" size={32} color="#00BFA6" />
            <Text className="text-secondary font-bold text-lg mt-2">MedLens</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Hospitals Mock */}
        <Text className="text-lg font-bold text-dark mb-4">Nearby Hospitals</Text>
        <TouchableOpacity className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 flex-row justify-between items-center">
          <View>
            <Text className="font-bold text-dark">City Central Hospital</Text>
            <Text className="text-gray-500 text-xs mt-1 font-medium">2.4 km away • 15 Available Beds</Text>
          </View>
          <Text className="text-secondary font-bold text-xs bg-green-50 px-3 py-1 rounded-full">Book</Text>
        </TouchableOpacity>
        <View className="pb-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
