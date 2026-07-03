import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login, isLoading } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const result = await login(username, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-clay justify-center items-center p-6">
      <View className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <View className="mb-8 items-center">
          <View className="w-16 h-16 bg-secondary rounded-full items-center justify-center shadow-sm mb-4">
            <Text className="text-white font-bold text-2xl">M</Text>
          </View>
          <Text className="text-2xl font-bold text-dark">Welcome Back</Text>
          <Text className="text-gray-500 font-medium">Login to your patient portal</Text>
        </View>

        <View className="mb-4">
          <Text className="text-gray-500 font-bold mb-2 ml-1">Username</Text>
          <TextInput 
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View className="mb-8">
          <Text className="text-gray-500 font-bold mb-2 ml-1">Password</Text>
          <TextInput 
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className="bg-secondary w-full py-4 rounded-2xl shadow-sm items-center justify-center mb-4"
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Login</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-2">
          <Text className="text-gray-500 font-medium">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text className="text-secondary font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
