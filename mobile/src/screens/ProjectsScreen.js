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

const ProjectsScreen = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/projects', formData);
      Alert.alert('Success', 'Project created successfully');
      setModalVisible(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/projects/${selectedProject.id}`, formData);
      Alert.alert('Success', 'Project updated successfully');
      setEditModalVisible(false);
      setSelectedProject(null);
      resetForm();
      fetchProjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = (projectId, projectName) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${projectName}"? This will also delete all associated tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/projects/${projectId}`);
              Alert.alert('Success', 'Project deleted successfully');
              fetchProjects();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const updateProjectStatus = async (projectId, currentStatus) => {
    let newStatus;
    switch (currentStatus) {
      case 'completed':
        newStatus = 'planning';
        break;
      case 'active':
        newStatus = 'completed';
        break;
      default:
        newStatus = 'active';
    }

    try {
      await api.put(`/projects/${projectId}`, { status: newStatus });
      fetchProjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to update project status');
    }
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority || 'medium',
    });
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6B7280';
      case 'planning': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderProject = ({ item }) => (
    <View style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <Text style={styles.projectName}>{item.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Ionicons name="pencil" size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteProject(item.id, item.name)} style={styles.actionButton}>
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.projectDescription}>{item.description || 'No description'}</Text>
      
      <View style={styles.projectFooter}>
        <TouchableOpacity 
          style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
          onPress={() => updateProjectStatus(item.id, item.status)}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </TouchableOpacity>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Progress: {item.progress || 0}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress || 0}%` }]} />
        </View>
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
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProject}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No projects yet. Create your first project!</Text>
        }
      />

      {/* Create Project Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Create Project Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Project</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Project Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
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
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                {['planning', 'active', 'completed'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      formData.status === s && { backgroundColor: getStatusColor(s) },
                    ]}
                    onPress={() => setFormData({ ...formData, status: s })}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      formData.status === s && styles.statusOptionTextSelected,
                    ]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
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

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleCreateProject}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Create Project</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Project</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Project Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                {['planning', 'active', 'completed'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      formData.status === s && { backgroundColor: getStatusColor(s) },
                    ]}
                    onPress={() => setFormData({ ...formData, status: s })}
                  >
                    <Text style={styles.statusOptionText}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
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

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleUpdateProject}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Update Project</Text>}
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
  projectCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  projectName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  actionButtons: { flexDirection: 'row' },
  actionButton: { padding: 5, marginLeft: 10 },
  projectDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  projectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  priorityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  priorityText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  progressContainer: { marginTop: 5 },
  progressLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  progressBar: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#3B82F6', borderRadius: 3 },
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
  statusRow: { flexDirection: 'row' },
  statusOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginHorizontal: 4, backgroundColor: '#f0f0f0' },
  statusOptionText: { color: '#333' },
  statusOptionTextSelected: { color: '#fff', fontWeight: '600' },
  priorityRow: { flexDirection: 'row' },
  priorityOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginHorizontal: 4, backgroundColor: '#f0f0f0' },
  priorityOptionText: { color: '#333' },
  submitButton: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ProjectsScreen;