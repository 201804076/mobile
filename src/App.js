import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './Home';
import Medication from './Medication';
import History from './History';
import { MedicationProvider } from './context/MedicationContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <MedicationProvider>
      <NavigationContainer>
        <Tab.Navigator
        screenOptions={{
          tabBarShowIcon: false, 
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
          tabBarStyle: { height: 60 },
        }}>
          <Tab.Screen name="홈" component={Home} />
          <Tab.Screen name="약 추가" component={Medication} />
          <Tab.Screen name="기록" component={History} />
        </Tab.Navigator>
      </NavigationContainer>
    </MedicationProvider>
  );
}
