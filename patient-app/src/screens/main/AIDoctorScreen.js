import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function AIDoctorScreen() {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello, I am MedConnect AI Doctor. How can I help you today? Please describe your symptoms.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/copilot/chat', { message: userMsg, role: 'Patient' });
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-secondary rounded-full items-center justify-center mr-3">
            <Ionicons name="medical" size={20} color="white" />
          </View>
          <View>
            <Text className="text-lg font-bold text-dark">AI Doctor</Text>
            <Text className="text-xs text-green-500 font-bold">● Online</Text>
          </View>
        </View>
      </View>
      
      <ScrollView className="flex-1 p-4 bg-clay">
        {chatHistory.map((msg, i) => (
          <View key={i} className={`mb-4 max-w-[85%] rounded-2xl p-4 ${msg.role === 'ai' ? 'bg-white self-start rounded-tl-none border border-gray-100 shadow-sm' : 'bg-secondary self-end rounded-tr-none shadow-sm'}`}>
            <Text className={`${msg.role === 'ai' ? 'text-gray-800' : 'text-white'}`}>{msg.text}</Text>
          </View>
        ))}
        {isLoading && (
          <View className="bg-white self-start rounded-2xl rounded-tl-none border border-gray-100 shadow-sm p-4 mb-4">
            <ActivityIndicator color="#00BFA6" size="small" />
          </View>
        )}
      </ScrollView>
      
      <View className="p-4 border-t border-gray-100 flex-row gap-2 bg-white items-center">
        <TextInput 
          value={chatMessage}
          onChangeText={setChatMessage}
          placeholder="Describe your symptoms..."
          className="flex-1 bg-gray-100 rounded-full px-5 py-3 border border-gray-200"
          multiline
        />
        <TouchableOpacity 
          onPress={handleSendMessage} 
          disabled={isLoading}
          className="bg-secondary w-12 h-12 rounded-full items-center justify-center shadow-sm"
        >
          <Ionicons name="send" size={20} color="white" className="ml-1" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
