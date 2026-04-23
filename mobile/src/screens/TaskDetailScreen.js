import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import api from '../services/api';

const TaskDetailScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [taskData, setTaskData] = useState(task);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${task.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const updateProgress = async (progress) => {
    try {
      await api.patch(`/tasks/${task.id}/status`, { progress_percentage: progress });
      setTaskData({ ...taskData, progress_percentage: progress });
      Alert.alert('Success', 'Progress updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      await api.post(`/tasks/${task.id}/comments`, { comment });
      setComment('');
      fetchComments();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{taskData.title}</Text>
        <Text style={styles.description}>{taskData.description || 'No description'}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Project:</Text>
          <Text style={styles.value}>{taskData.project_name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, styles.capitalize]}>{taskData.status}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Priority:</Text>
          <Text style={[styles.value, styles.capitalize]}>{taskData.priority}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Due Date:</Text>
          <Text style={styles.value}>{taskData.due_date || 'Not set'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressPercent}>{taskData.progress_percentage || 0}%</Text>
          <View style={styles.progressButtons}>
            {[0, 25, 50, 75, 100].map(p => (
              <TouchableOpacity key={p} style={styles.progressButton} onPress={() => updateProgress(p)}>
                <Text style={styles.progressButtonText}>{p}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Comments</Text>
        {comments.map(c => (
          <View key={c.id} style={styles.commentCard}>
            <Text style={styles.commentUser}>{c.full_name}</Text>
            <Text style={styles.commentText}>{c.comment}</Text>
            <Text style={styles.commentDate}>{new Date(c.created_at).toLocaleString()}</Text>
          </View>
        ))}

        <View style={styles.addComment}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity style={styles.addButton} onPress={addComment}>
            <Text style={styles.addButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 80,
  },
  value: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 10,
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  progressButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  commentCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  commentDate: {
    fontSize: 10,
    color: '#999',
  },
  addComment: {
    marginTop: 15,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TaskDetailScreen;