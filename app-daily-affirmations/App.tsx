import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import AffirmationCard from './src/components/AffirmationCard';
import AdBanner from './src/components/AdBanner';
import { styles } from './src/styles';
import data from './src/data/affirmations.json';

const App = () => {
  const [affirmation, setAffirmation] = useState('');

  useEffect(() => {
    const affirmations = data.affirmations;
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    setAffirmation(affirmations[randomIndex]);
  }, []);

  return (
    <View style={styles.container}>
      <AffirmationCard affirmation={affirmation} />
      <AdBanner />
    </View>
  );
};

export default App;
