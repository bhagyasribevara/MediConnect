import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal } from 'react-native';

export default function App() {
  const [isSOS, setIsSOS] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMedLensOpen, setIsMedLensOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello, I am MedConnect AI Doctor. How can I help you today?' }
  ]);
  const [reportText, setReportText] = useState('Patient report shows elevated blood pressure 150/95 and high cholesterol.');
  const [medlensResult, setMedlensResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory([...chatHistory, { role: 'user', text: userMsg }]);
    setChatMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('http://10.0.2.2:5000/api/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer placeholder-token'
        },
        body: JSON.stringify({ message: userMsg, role: 'Patient' })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMedLensAnalyze = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://10.0.2.2:5000/api/medlens/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer placeholder-token'
        },
        body: JSON.stringify({ report_text: reportText, save_to_record: false })
      });
      const data = await res.json();
      setMedlensResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-clay">
      <ScrollView className="flex-1 p-6">
        
        {/* Header */}
        <View className="mb-8 mt-6 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-500 font-medium">Welcome back,</Text>
            <Text className="text-2xl font-bold text-dark">Patient Demo</Text>
          </View>
          <View className="w-12 h-12 bg-secondary rounded-full items-center justify-center shadow-sm">
            <Text className="text-white font-bold text-lg">P</Text>
          </View>
        </View>

        {/* SOS Button */}
        <TouchableOpacity 
          onPress={() => setIsSOS(!isSOS)}
          className={`w-full py-6 rounded-3xl items-center justify-center mb-6 shadow-sm ${isSOS ? 'bg-red-600' : 'bg-red-50 border border-red-200'}`}
        >
          <Text className={`text-2xl font-bold ${isSOS ? 'text-white' : 'text-red-600'}`}>
            {isSOS ? 'SOS TRIGGERED' : 'EMERGENCY SOS'}
          </Text>
          {!isSOS && <Text className="text-red-500 mt-2 text-center px-4 font-medium">Tap to notify nearest hospital and request an ambulance.</Text>}
        </TouchableOpacity>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-6 gap-4">
          <TouchableOpacity 
            onPress={() => setIsChatOpen(true)}
            className="flex-1 bg-secondary py-4 rounded-2xl shadow-sm items-center justify-center border border-[#00BFA6]"
          >
            <Text className="text-white font-bold text-lg mb-1">AI Doctor</Text>
            <Text className="text-white text-xs font-medium">Chat & Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setIsMedLensOpen(true)}
            className="flex-1 bg-white py-4 rounded-2xl shadow-sm items-center justify-center border border-gray-100"
          >
            <Text className="text-secondary font-bold text-lg mb-1">MedLens</Text>
            <Text className="text-gray-500 text-xs font-medium">Scan Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-between mb-6 gap-4">
          <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <Text className="text-gray-500 font-medium text-xs">Upcoming Appointments</Text>
            <Text className="text-2xl font-bold text-dark mt-1">2</Text>
          </View>
          <View className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <Text className="text-gray-500 font-medium text-xs">Unread Reports</Text>
            <Text className="text-2xl font-bold text-dark mt-1">1</Text>
          </View>
        </View>

        {/* Medication Reminders */}
        <Text className="text-lg font-bold text-dark mb-4">Medication Reminders</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <View>
              <Text className="font-bold text-dark">Paracetamol (500mg)</Text>
              <Text className="text-gray-500 text-xs mt-1 font-medium">After Lunch - 02:00 PM</Text>
            </View>
            <View className="w-6 h-6 rounded border border-gray-300" />
          </View>
          <View className="flex-row justify-between items-center p-4">
            <View>
              <Text className="font-bold text-dark">Vitamin C</Text>
              <Text className="text-gray-500 text-xs mt-1 font-medium">Morning - 09:00 AM</Text>
            </View>
            <View className="w-6 h-6 rounded bg-secondary border border-secondary items-center justify-center">
              <Text className="text-white text-xs">✓</Text>
            </View>
          </View>
        </View>

        {/* Nearby Hospitals */}
        <Text className="text-lg font-bold text-dark mb-4">Nearby Hospitals</Text>
        <TouchableOpacity className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 flex-row justify-between items-center">
          <View>
            <Text className="font-bold text-dark">City Central Hospital</Text>
            <Text className="text-gray-500 text-xs mt-1 font-medium">2.4 km away • 15 Available Beds</Text>
          </View>
          <Text className="text-secondary font-bold text-xs bg-green-50 px-3 py-1 rounded-full">Book</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-10 flex-row justify-between items-center">
          <View>
            <Text className="font-bold text-dark">District General</Text>
            <Text className="text-gray-500 text-xs mt-1 font-medium">5.1 km away • 2 ICU Beds</Text>
          </View>
          <Text className="text-secondary font-bold text-xs bg-green-50 px-3 py-1 rounded-full">Book</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* AI Doctor Modal */}
      <Modal visible={isChatOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
            <Text className="text-lg font-bold text-dark">AI Doctor Assistant</Text>
            <TouchableOpacity onPress={() => setIsChatOpen(false)}>
              <Text className="text-gray-500 font-bold p-2 text-lg">×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            {chatHistory.map((msg, i) => (
              <View key={i} className={`mb-4 max-w-[80%] rounded-2xl p-4 ${msg.role === 'ai' ? 'bg-gray-100 self-start rounded-tl-none' : 'bg-secondary self-end rounded-tr-none'}`}>
                <Text className={`${msg.role === 'ai' ? 'text-gray-800' : 'text-white'}`}>{msg.text}</Text>
              </View>
            ))}
            {isLoading && <Text className="text-gray-500 self-start ml-2 italic">Thinking...</Text>}
          </ScrollView>
          <View className="p-4 border-t border-gray-100 flex-row gap-2 bg-white">
            <TextInput 
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Describe your symptoms..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-3"
            />
            <TouchableOpacity onPress={handleSendMessage} className="bg-secondary px-6 rounded-full items-center justify-center shadow-sm">
              <Text className="text-white font-bold">Send</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MedLens Modal */}
      <Modal visible={isMedLensOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
            <Text className="text-lg font-bold text-dark">MedLens Analyzer</Text>
            <TouchableOpacity onPress={() => setIsMedLensOpen(false)}>
              <Text className="text-gray-500 font-bold p-2 text-lg">×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            {!medlensResult ? (
              <View>
                <Text className="text-gray-700 font-medium mb-2">Mock OCR Input:</Text>
                <TextInput 
                  value={reportText}
                  onChangeText={setReportText}
                  multiline
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-32 mb-4"
                />
                <TouchableOpacity 
                  onPress={handleMedLensAnalyze}
                  className="bg-secondary py-4 rounded-xl items-center shadow-sm"
                >
                  <Text className="text-white font-bold">{isLoading ? 'Analyzing...' : 'Analyze Report'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="space-y-4">
                <View className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <Text className="font-bold text-green-700 mb-1">AI Summary</Text>
                  <Text className="text-gray-800">{medlensResult.summary}</Text>
                </View>
                <View className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <Text className="font-bold text-red-700 mb-1">Abnormal Values</Text>
                  {medlensResult.abnormal_values?.map((val: string, i: number) => (
                    <Text key={i} className="text-gray-800">• {val}</Text>
                  ))}
                </View>
                <View className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <Text className="font-bold text-blue-700 mb-1">Recommendations</Text>
                  {medlensResult.recommendations?.map((rec: string, i: number) => (
                    <Text key={i} className="text-gray-800">• {rec}</Text>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setMedlensResult(null)} className="mt-4">
                  <Text className="text-secondary text-center font-bold">Analyze Another Report</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
