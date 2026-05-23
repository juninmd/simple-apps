import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface AffirmationCardProps {
  affirmation: string;
}

const AffirmationCard: React.FC<AffirmationCardProps> = ({ affirmation }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardText}>{affirmation}</Text>
    </View>
  );
};

export default AffirmationCard;
