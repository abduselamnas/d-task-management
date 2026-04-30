import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium',
    due_date: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    if (!formData.project_id) {
      Alert.alert('Error', 'Please select a project');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/tasks', formData);
      Alert.alert('Success', 'Task created successfully');
      setModalVisible(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/tasks/${selectedTask.id}`, formData);
      Alert.alert('Success', 'Task updated successfully');
      setEditModalVisible(false);
      setSelectedTask(null);
      resetForm();
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = (taskId, taskTitle) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tasks/${taskId}`);
              Alert.alert('Success', 'Task deleted successfully');
              fetchTasks();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const updateTaskStatus = async (taskId, currentStatus, currentProgress) => {
    let newStatus = currentStatus;
    let newProgress = currentProgress;

    if (currentStatus === 'completed') {
      newStatus = 'pending';
      newProgress = 0;
    } else if (currentStatus === 'in_progress') {
      newStatus = 'completed';
      newProgress = 100;
    } else {
      newStatus = 'in_progress';
      newProgress = 50;
    }

    try {
      await api.patch(`/tasks/${taskId}/status`, { 
        status: newStatus,
        progress_percentage: newProgress 
      });
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const updateProgress = async (taskId, progress) => {
    try {
      let newStatus = 'in_progress';
      if (progress === 100) {
        newStatus = 'completed';
      } else if (progress === 0) {
        newStatus = 'pending';
      }
      
      await api.patch(`/tasks/${taskId}/status`, { 
        progress_percentage: progress,
        status: newStatus
      });
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id,
      priority: task.priority,
      due_date: task.due_date?.split('T')[0] || '',
    });
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_id: '',
      priority: 'medium',
      due_date: '',
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'time';
      default: return 'ellipse-outline';
    }
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <TouchableOpacity onPress={() => updateTaskStatus(item.id, item.status, item.progress_percentage)}>
          <Ionicons 
            name={item.status === 'completed' ? 'checkbox' : 'square-outline'} 
            size={24} 
            color={item.status === 'completed' ? '#10B981' : '#6B7280'} 
          />
        </TouchableOpacity>
        <Text style={[styles.taskTitle, item.status === 'completed' && styles.completedText]}>
          {item.title}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Ionicons name="pencil" size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteTask(item.id, item.title)} style={styles.actionButton}>
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.taskProject}>{item.project_name}</Text>
      
      {/* Progress Slider */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Progress: {item.progress_percentage || 0}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress_percentage || 0}%` }]} />
        </View>
        <View style={styles.progressButtons}>
          {[0, 25, 50, 75, 100].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.progressButton, item.progress_percentage === p && styles.progressButtonActive]}
              onPress={() => updateProgress(item.id, p)}
            >
              <Text style={styles.progressButtonText}>{p}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.taskFooter}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
        {item.due_date && (
          <Text style={styles.dueDate}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks yet. Create your first task!</Text>
        }
      />

      {/* Create Task Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Create Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Task</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Task Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Project *</Text>
              <View style={styles.picker}>
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.pickerOption,
                      formData.project_id === project.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, project_id: project.id })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.project_id === project.id && styles.pickerOptionTextSelected,
                    ]}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {['low', 'medium', 'high'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      formData.priority === p && { backgroundColor: getPriorityColor(p) },
                    ]}
                    onPress={() => setFormData({ ...formData, priority: p })}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      formData.priority === p && styles.priorityOptionTextSelected,
                    ]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Due Date (YYYY-MM-DD)"
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
            />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleCreateTask}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create Task</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Task</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Task Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Project</Text>
              <View style={styles.picker}>
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.pickerOption,
                      formData.project_id === project.id && styles.pickerOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, project_id: project.id })}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.project_id === project.id && styles.pickerOptionTextSelected,
                    ]}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {['low', 'medium', 'high'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      formData.priority === p && { backgroundColor: getPriorityColor(p) },
                    ]}
                    onPress={() => setFormData({ ...formData, priority: p })}
                  >
                    <Text style={styles.priorityOptionText}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Due Date (YYYY-MM-DD)"
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
            />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleUpdateTask}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Update Task</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 15, paddingBottom: 80 },
  taskCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 10, flex: 1 },
  completedText: { textDecorationLine: 'line-through', color: '#999' },
  actionButtons: { flexDirection: 'row' },
  actionButton: { padding: 5, marginLeft: 10 },
  taskProject: { fontSize: 12, color: '#666', marginBottom: 10, marginLeft: 34 },
  progressContainer: { marginLeft: 34, marginBottom: 10 },
  progressLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, backgroundColor: '#3B82F6', borderRadius: 3 },
  progressButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  progressButton: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
  progressButtonActive: { backgroundColor: '#3B82F6' },
  progressButtonText: { fontSize: 10, color: '#666' },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 34 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  dueDate: { fontSize: 11, color: '#999' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#1E3A8A', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  pickerContainer: { marginBottom: 15 },
  picker: { flexDirection: 'row', flexWrap: 'wrap' },
  pickerOption: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  pickerOptionSelected: { backgroundColor: '#1E3A8A' },
  pickerOptionText: { color: '#333' },
  pickerOptionTextSelected: { color: '#fff' },
  priorityRow: { flexDirection: 'row' },
  priorityOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginHorizontal: 4, backgroundColor: '#f0f0f0' },
  priorityOptionText: { color: '#333' },
  priorityOptionTextSelected: { color: '#fff', fontWeight: '600' },
  submitButton: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default TasksScreen;