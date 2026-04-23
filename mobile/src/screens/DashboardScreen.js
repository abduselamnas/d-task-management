import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
      ]);

      const tasks = tasksRes.data;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;

      setStats({
        totalProjects: projectsRes.data.length,
        totalTasks: tasks.length,
        completedTasks: completed,
        inProgressTasks: inProgress,
      });

      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, color }) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userRole}>{user?.role?.replace('_', ' ')}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard title="Projects" value={stats.totalProjects} color="#3B82F6" />
        <StatCard title="Tasks" value={stats.totalTasks} color="#10B981" />
        <StatCard title="Completed" value={stats.completedTasks} color="#F59E0B" />
        <StatCard title="In Progress" value={stats.inProgressTasks} color="#EF4444" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        {recentTasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskCard}
            onPress={() => navigation.navigate('TaskDetail', { task })}
          >
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskProject}>{task.project_name}</Text>
            <View style={styles.taskFooter}>
              <Text style={styles.taskStatus}>{task.status}</Text>
              <Text style={styles.taskProgress}>{task.progress_percentage || 0}%</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1E3A8A',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcome: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  userRole: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    marginTop: -20,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskProject: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  taskStatus: {
    fontSize: 12,
    color: '#3B82F6',
    textTransform: 'capitalize',
  },
  taskProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default DashboardScreen;