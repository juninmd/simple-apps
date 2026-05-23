
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000); // Default goal: 2000ml
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());
  const [isMilestoneModalVisible, setMilestoneModalVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedWaterIntake = await AsyncStorage.getItem('waterIntake');
        const savedDailyGoal = await AsyncStorage.getItem('dailyGoal');
        const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');

        const currentDate = new Date().toDateString();

        if (lastSavedDate !== currentDate) {
          // Reset water intake for the new day
          setWaterIntake(0);
          await AsyncStorage.setItem('waterIntake', '0');
        } else if (savedWaterIntake !== null) {
          setWaterIntake(parseInt(savedWaterIntake, 10));
        }

        if (savedDailyGoal !== null) {
          setDailyGoal(parseInt(savedDailyGoal, 10));
          setNewGoal(savedDailyGoal);
        }
        await AsyncStorage.setItem('lastSavedDate', currentDate);
      } catch (error) {
        Alert.alert('Error', 'Failed to load data.');
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('waterIntake', waterIntake.toString());
        await AsyncStorage.setItem('dailyGoal', dailyGoal.toString());
      } catch (error) {
        Alert.alert('Error', 'Failed to save data.');
      }
    };

    saveData();

    if (waterIntake >= dailyGoal && waterIntake > 0) {
      setMilestoneModalVisible(true);
    }
  }, [waterIntake, dailyGoal]);

  const addWater = (amount) => {
    setWaterIntake(waterIntake + amount);
  };

  const resetWater = () => {
    setWaterIntake(0);
  };

  const handleSetGoal = () => {
    const goal = parseInt(newGoal, 10);
    if (!isNaN(goal) && goal > 0) {
      setDailyGoal(goal);
      setGoalModalVisible(false);
    } else {
      Alert.alert('Invalid Goal', 'Please enter a valid number for the goal.');
    }
  };

  const progress = (waterIntake / dailyGoal) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hydration Tracker</Text>

      <TouchableOpacity onPress={() => setGoalModalVisible(true)} style={styles.goalButton}>
        <Text style={styles.goalButtonText}>Daily Goal: {dailyGoal}ml</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>{waterIntake}ml / {dailyGoal}ml ({Math.round(progress)}%)</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={() => addWater(250)}>
          <Text style={styles.buttonText}>+250ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => addWater(500)}>
          <Text style={styles.buttonText}>+500ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => addWater(750)}>
            <Text style={styles.buttonText}>+750ml</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetWater}>
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>

      {/* Set Goal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isGoalModalVisible}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Set Daily Goal</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={newGoal}
              onChangeText={setNewGoal}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleSetGoal}>
              <Text style={styles.modalButtonText}>Set Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setGoalModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Milestone Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isMilestoneModalVisible}
        onRequestClose={() => setMilestoneModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.milestoneText}>You've reached your daily hydration goal!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setMilestoneModalVisible(false)}>
              <Text style={styles.modalButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF',
        alignItems: 'center',
        paddingTop: 50,
      },
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1E90FF',
        marginBottom: 20,
      },
      goalButton: {
        backgroundColor: '#ADD8E6',
        padding: 10,
        borderRadius: 10,
        marginBottom: 20,
      },
      goalButtonText: {
        fontSize: 18,
        color: '#1E90FF',
        fontWeight: 'bold',
      },
      progressContainer: {
        width: '80%',
        height: 30,
        backgroundColor: '#E0E0E0',
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 10,
      },
      progressBar: {
        height: '100%',
        backgroundColor: '#1E90FF',
      },
      progressText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 30,
      },
      buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
        marginBottom: 30,
      },
      button: {
        backgroundColor: '#1E90FF',
        padding: 15,
        borderRadius: 10,
        width: '30%',
        alignItems: 'center',
      },
      buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
      },
      resetButton: {
        backgroundColor: '#FF6347',
        padding: 15,
        borderRadius: 10,
      },
      resetButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
      },
      input: {
        width: '80%',
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 18,
      },
      modalButton: {
        backgroundColor: '#1E90FF',
        padding: 10,
        borderRadius: 10,
        width: '60%',
        alignItems: 'center',
        marginBottom: 10,
      },
      modalCancelButton: {
        backgroundColor: '#FF6347',
      },
      modalButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
      },
      milestoneText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
      },
});

export default App;
