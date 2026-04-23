import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    console.log('Attempting login with:', email);
    
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      console.log('Login successful, navigating to Main');
      navigation.replace('Main');
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@debo.com');
      setPassword('Admin@123');
    } else if (role === 'manager') {
      setEmail('manager@debo.com');
      setPassword('Admin@123');
    } else {
      setEmail('team@debo.com');
      setPassword('Admin@123');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Debo Task Manager</Text>
        <Text style={styles.subtitle}>Mobile App</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>Demo Credentials:</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity onPress={() => fillDemo('admin')} style={styles.demoButton}>
              <Text style={styles.demoButtonText}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => fillDemo('manager')} style={styles.demoButton}>
              <Text style={styles.demoButtonText}>Manager</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => fillDemo('team')} style={styles.demoButton}>
              <Text style={styles.demoButtonText}>Team</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.demoPassword}>Password for all: Admin@123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  registerLink: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  demoContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  demoTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  demoButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  demoPassword: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
});

export default LoginScreen;