import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            console.log('Logout button pressed');
            const success = await logout();
            if (success) {
              console.log('Logout successful');
              // The AppNavigator will automatically show Login screen
              // because user state is now null
            }
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        <Text style={styles.role}>{user?.role?.replace('_', ' ') || 'Team Member'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0%</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    padding: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  role: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 20,
  },
});

export default ProfileScreen;