import React, { Component } from 'react'
import { View,
         Text,
         StyleSheet,
         TextInput,
         ListView,
         ActivityIndicator,
         Animated,
         TouchableWithoutFeedback } from 'react-native'
import { MKButton } from 'react-native-material-kit'
import { Logout } from '../../actions/auth'
import { Actions, ActionConst } from 'react-native-router-flux'
import Icon from 'react-native-vector-icons/MaterialIcons';
import ActionButton from 'react-native-action-button';
import { connect } from 'react-redux'
import isEmpty from 'lodash/isEmpty'

import DeviceListItem from '../../components/DeviceListItem/DeviceListItem'
import SearchBar from '../../components/SearchBar/SearchBar'
import DeviceModal from '../../components/DeviceModal/DeviceModal'
import { getUserDevices } from '../../actions/device'
import { mqttConnect } from '../../actions/mqtt'

class DeviceList extends Component  {

  constructor(props){
    super(props);
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      showModal: false,
      dataSource: [ {name:'prid haps', state:'activo'},
                    {name:'prid haps', state:'activo'},
                    {name:'prid haps', state:'activo'},
                    {name:'prid haps', state:'activo'},
                    {name:'prid haps', state:'activo'},
                  ]
    }

    this.mqttConfig = {
      clientId: this.props.user._id,
      username: this.props.user._id,
      password: this.props.token,
      mqttActive: this.props.mqtt.mqttActive,
    }

    this.skeletonAnimated = []

  }

  getUserDevices(){
    this.props.getUserDevices(this.props.user)
      .then(() => {
        if(!isEmpty(this.props.devices)){
          this.connectMQTT(0)
          let newState = []
          Object.keys(this.props.devices)
            .map( deviceKey => {
              newState.push(this.props.devices[deviceKey])
            })
          this.setState({ dataSource: newState })
        }
        else{
          this.setState({ dataSource: [] })
        }
        return
      })
  }

  connectMQTT(delay){
    setTimeout(() => {
      if(!this.props.mqtt.mqttActive && this.props.devices){
        this.props.mqttConnect(this.mqttConfig, this.props.devices)
      }
    }, delay)
  }

  componentWillReceiveProps(nextProps){
    if(!nextProps.mqtt.mqttActive && this.props.devices){
      this.connectMQTT(30000)
    }
  }

  componentWillMount(){
    //this.getUserDevices()
  }

  componentDidMount(){
    this.runAnimated()
  }

  stateModal(value) {
    this.setState({showModal: value})
  }

  runAnimated() {
    console.log(this.skeletonAnimated);
    if (Array.isArray(this.skeletonAnimated) && this.skeletonAnimated.length > 0) {
      const threeRowAnimated = Animated.parallel(
        this.skeletonAnimated.map(animate => {
          if (animate && animate.getAnimated) {
            return animate.getAnimated();
          }
          return null;
        }),
        {
          stopTogether: false,
        },
      );
      console.log(threeRowAnimated);
      threeRowAnimated.start()
      //Animated.sequence(threeRowAnimated).start()
      //Animated.loop(threeRowAnimated).start();
    }
  }

  addSkeletonAnimated(ref){
    this.skeletonAnimated.push(ref)
  }

  renderRow(data){
    return (
      <DeviceListItem
          key={data._id}
          data={data}
          addSkeleton={ (ref) => this.addSkeletonAnimated(ref)}
          skeleton={!this.props.isFetching} />
    )
  }

  content(){
    if(this.props.isFetching || !isEmpty(this.state.dataSource)){
      return (
        <ListView
          enableEmptySections={true}
          style={styles.deviceList}
          dataSource={this.ds.cloneWithRows(this.state.dataSource)}
          renderRow={(rowData) => this.renderRow(rowData) }
          renderSeparator={(sectionId, rowId) => <View key={rowId} style={styles.separator}></View> }
        />
      )
    }
    else if(isEmpty(this.props.devices)){
      return (
        <View style={{flex:1,justifyContent: 'center',
        alignItems: 'center',}}>
          <Text> No hay dispositivos </Text>
        </View>
      )
    }
  }

  render(){
    const AccentIconButton = MKButton.accentColoredFlatButton()
      .withOnPress(() => Actions.profile({type: ActionConst.PUSH}))
      .build();
    this.skeletonAnimated = []
    return(
      <View style={styles.container}>
        <View style={[styles.header]}>
          <Text style={styles.title}>Spots Fotovoltaicos</Text>
          <AccentIconButton>
            <Icon name="account-circle"
              color="gray"
              size={24} />
          </AccentIconButton>
        </View>
        <DeviceModal
          title="Agregar Spot"
          visible={this.state.showModal}
          onAccept={() => {}}
          user={this.props.user}
          onDecline={() => this.stateModal(false) } />
        <SearchBar />
        <View style={[styles.content]}>
          { this.content() }
          <ActionButton
            position="right"
            degrees={0}
            buttonColor="rgba(231,76,60,1)"
            onPress={() => this.stateModal(true) }
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    backgroundColor: 'gainsboro',
  },
  title:{
    fontSize: 20,
    fontWeight: "500",
  },
  content:{
    flex: 1,
    zIndex: 1,
  },
  deviceList: {
    flex: 1,
  },
  separator: {
   flex: 1,
   height: StyleSheet.hairlineWidth,
   backgroundColor: '#757272',
   marginLeft: 16,
   marginRight: 16,
  },
  test :{
   borderStyle: 'solid',
   borderColor: 'red',
   borderWidth: 1,
  },
});

function mapStateToProps(state){
  return {
    user: state.auth.user,
    token: state.auth.token,
    mqtt: state.mqtt,
    devices: state.device.entities,
    isFetching: state.device.isFetchingDevice,
  }
}

function mapDispatchToProps(dispatch){
  return {
    getUserDevices: (userData) => dispatch(getUserDevices(userData)),
    mqttConnect: (config, devices) => dispatch(mqttConnect(config, devices))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DeviceList)
