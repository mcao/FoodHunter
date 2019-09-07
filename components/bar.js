import * as React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

export default class Bar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isShow: true,
    };
  }
  render() {
    return (
      <View style={{
    height: 100, 
    alignSelf: 'stretch',
    backgroundColor: this.props.color,
          justifyContent: 'center',
    alignItems: 'center',

  }}>
        <Text style={styles.paragraph}> {this.props.children} </Text> 
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 100, 
    backgroundColor: "#FF0000",
        justifyContent: 'center',
    alignItems: 'center',
    flex: 1,

    
  },
  paragraph: {
    textAlign: 'center',
    fontSize: 50,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },

});
 