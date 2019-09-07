import { createStackNavigator } from 'react-navigation-stack';
import { createAppContainer } from '@react-navigation/native';
import Home from './Home'
import Login from './Login'
import Password from './Password'

const AppNavigator = createStackNavigator({
  Login: Login,
  Home: Home,
  Password: Password, },
    {
    initialRouteName: 'Home',
  }
);

const App = createAppContainer(AppNavigator);

export default App;
