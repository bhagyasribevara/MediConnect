import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function MedLensScreen() {
  const [reportText, setReportText] = useState('Patient report shows elevated blood pressure 150/95 and high cholesterol.');
  const [medlensResult, setMedlensResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMedLensAnalyze = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/medlens/upload', { report_text: reportText, save_to_record: true });
      setMedlensResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-clay">
      <ScrollView className="flex-1 p-6">
        
        {/* MedLens Analyzer */}
        <View className="mb-6 flex-row items-center">
          <Ionicons name="scan-circle" size={32} color="#00BFA6" />
          <Text className="text-2xl font-bold text-dark ml-2">MedLens</Text>
        </View>

        {!medlensResult ? (
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <Text className="text-gray-700 font-bold mb-2">Input Report / Scan Text:</Text>
            <TextInput 
              value={reportText}
              onChangeText={setReportText}
              multiline
              className="bg-gray-50 border border-gray-200 rounded-2xl p-4 h-32 mb-4"
              textAlignVertical="top"
            />
            <TouchableOpacity 
              onPress={handleMedLensAnalyze}
              disabled={isLoading}
              className="bg-secondary py-4 rounded-2xl items-center flex-row justify-center shadow-sm"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">Analyze Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4 mb-8">
            <View className="p-5 bg-green-50 border border-green-200 rounded-3xl">
              <View className="flex-row items-center mb-2">
                <Ionicons name="document-text" size={20} color="#15803d" />
                <Text className="font-bold text-green-700 ml-2 text-lg">AI Summary</Text>
              </View>
              <Text className="text-gray-800 leading-5">{medlensResult.summary}</Text>
            </View>

            <View className="p-5 bg-red-50 border border-red-200 rounded-3xl mt-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="warning" size={20} color="#b91c1c" />
                <Text className="font-bold text-red-700 ml-2 text-lg">Abnormal Values</Text>
              </View>
              {medlensResult.abnormal_values?.length > 0 ? medlensResult.abnormal_values.map((val, i) => (
                <Text key={i} className="text-gray-800 font-medium">• {val}</Text>
              )) : <Text className="text-gray-800 font-medium">None detected</Text>}
            </View>

            <View className="p-5 bg-blue-50 border border-blue-200 rounded-3xl mt-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="medkit" size={20} color="#1d4ed8" />
                <Text className="font-bold text-blue-700 ml-2 text-lg">Recommendations</Text>
              </View>
              {medlensResult.recommendations?.length > 0 ? medlensResult.recommendations.map((rec, i) => (
                <Text key={i} className="text-gray-800 font-medium">• {rec}</Text>
              )) : <Text className="text-gray-800 font-medium">Consult Doctor</Text>}
            </View>

            <TouchableOpacity onPress={() => setMedlensResult(null)} className="mt-6 bg-white border border-secondary py-3 rounded-2xl items-center">
              <Text className="text-secondary font-bold">Analyze Another Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Medication Reminders (Tablet Reminders) */}
        <View className="flex-row items-center mb-4 mt-2">
          <Ionicons name="notifications" size={24} color="#374151" />
          <Text className="text-lg font-bold text-dark ml-2">Tablet Reminders</Text>
        </View>
        
        <View className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 mb-10">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mr-3">
                <Ionicons name="water" size={20} color="#ef4444" />
              </View>
              <View>
                <Text className="font-bold text-dark text-base">Paracetamol (500mg)</Text>
                <Text className="text-gray-500 text-xs mt-1 font-medium">After Lunch - 02:00 PM</Text>
              </View>
            </View>
            <View className="w-6 h-6 rounded border border-gray-300" />
          </View>

          <View className="flex-row justify-between items-center p-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center mr-3">
                <Ionicons name="leaf" size={20} color="#f97316" />
              </View>
              <View>
                <Text className="font-bold text-dark text-base">Vitamin C</Text>
                <Text className="text-gray-500 text-xs mt-1 font-medium">Morning - 09:00 AM</Text>
              </View>
            </View>
            <View className="w-6 h-6 rounded bg-secondary border border-secondary items-center justify-center">
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
