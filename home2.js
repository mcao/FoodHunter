  import * as React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';

// You can import from local files
import Icon from './components/Icon'
import Bar from './components/Bar'

// or any pure javascript modules available in npm
import { Card } from 'react-native-paper';

export default class Home2 extends React.Component {
  render() {
    const marginTop = 10;

    const colorOne = "#FF0000"
    const colorTwo = "#FF00FF"

    return (
        <View style={styles.container}> 
        <View style={{marginTop: marginTop}}>
         <Icon  />
        </View> 
        <View style={styles.bottom}> 

          <TouchableOpacity> 
          <Bar color={colorOne}> Home 2 Hello </Bar> 
          </TouchableOpacity>

          <TouchableOpacity>
          <Bar color={colorTwo}> Home 2 Goodbye </Bar> 
          </TouchableOpacity>
        </View>
        </View> 


        
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    margin: 0,
    justifyContent: 'top',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',

  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
    bottom: {
  flex: 1,
  justifyContent: 'flex-end',
  marginBottom: 0,
}
});
