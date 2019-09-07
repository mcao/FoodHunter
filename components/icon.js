import * as React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

export default class Icon extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Image style={styles.logo} source={require('../assets/snack-icon.png')} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'top',
  },
  logo: {
    height: 100,
    width: 100,
  }
});
