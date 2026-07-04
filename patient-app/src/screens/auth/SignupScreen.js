import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

export default function SignupScreen({ navigation }) {
  const { register, isLoading } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const result = await register(username, password, email);
    if (result.success) {
      Alert.alert('Success', 'Account created successfully! Please log in.');
      navigation.navigate('Login');
    } else {
      Alert.alert('Signup Failed', result.error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-clay justify-center items-center p-6">
      <View className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <View className="mb-8 items-center">
          <View className="w-16 h-16 bg-secondary rounded-full items-center justify-center shadow-sm mb-4">
            <Text className="text-white font-bold text-2xl">M</Text>
          </View>
          <Text className="text-2xl font-bold text-dark">Create Account</Text>
          <Text className="text-gray-500 font-medium">Join MediConnect today</Text>
        </View>

        <View className="mb-4">
          <Text className="text-gray-500 font-bold mb-2 ml-1">Username</Text>
          <TextInput 
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4"
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View className="mb-4">
          <Text className="text-gray-500 font-bold mb-2 ml-1">Phone Number</Text>
          <TextInput 
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4"
            placeholder="Enter your phone number"
            value={email}
            onChangeText={setEmail}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-8">
          <Text className="text-gray-500 font-bold mb-2 ml-1">Password</Text>
          <TextInput 
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className="bg-secondary w-full py-4 rounded-2xl shadow-sm items-center justify-center mb-4"
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Sign Up</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-2">
          <Text className="text-gray-500 font-medium">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-secondary font-bold">Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
