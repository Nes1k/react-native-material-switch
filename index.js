import React, { Component, PropTypes } from 'react'
import {
  PanResponder,
  View,
  TouchableHighlight,
  Animated,
} from 'react-native'

export default class MaterialSwitch extends Component {

  static defaultProps = {
    padding: 10,
    inactiveButtonColor: '#2196F3',
    activeButtonColor: '#FAFAFA',
    activeBackgroundColor: 'rgba(255,255,255,.5)',
    inactiveBackgroundColor: 'rgba(0,0,0,.5)',
    buttonShadow: {
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 1,
      shadowOffset: { height: 1, width: 0 },
    },
    buttonRadius: 15,
    switchWidth: 40,
    switchHeight: 20,
    buttonContent: null,
    enableSlide: true,
    switchAnimationTime: 200,
  }

  static propTypes = {
    padding: PropTypes.number,
    value: PropTypes.bool.isRequired,
    inactiveButtonColor: PropTypes.string,
    activeButtonColor: PropTypes.string,
    activeBackgroundColor: PropTypes.string,
    inactiveBackgroundColor: PropTypes.string,
    buttonShadow: PropTypes.object,
    buttonRadius: PropTypes.number,
    switchWidth: PropTypes.number,
    switchHeight: PropTypes.number,
    buttonContent: PropTypes.element,
    enableSlide: PropTypes.bool,
    switchAnimationTime: PropTypes.number,
    onValueChange: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.start = {}

    const { switchWidth, switchHeight, buttonRadius, value } = props
    const w = switchWidth - Math.min(switchHeight, buttonRadius*2)

    this.state = {
      width: w,
      position: new Animated.Value(value ? w : 0),
    }
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        if (!this.props.enableSlide) return;

        this.setState({pressed: true});
        this.start.x0 = gestureState.x0;
        this.start.pos = this.state.position._value;
        this.start.moved = false;
        this.start.state = this.props.value;
        this.start.stateChanged = false;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!this.props.enableSlide) return;

        this.start.moved = true;
        if (this.start.pos == 0) {
          if (gestureState.dx <= this.state.width && gestureState.dx >= 0) {
            this.state.position.setValue(gestureState.dx);
          }
          if (gestureState.dx > this.state.width) {
            this.state.position.setValue(this.state.width);
          }
          if (gestureState.dx < 0) {
            this.state.position.setValue(0);
          }
        }
        if (this.start.pos == this.state.width) {
          if (gestureState.dx >= -this.state.width && gestureState.dx <= 0) {
            this.state.position.setValue(this.state.width+gestureState.dx);
          }
          if (gestureState.dx > 0) {
            this.state.position.setValue(this.state.width);
          }
          if (gestureState.dx < -this.state.width) {
            this.state.position.setValue(0);
          }
        }
        var currentPos = this.state.position._value;
        this.onSwipe(currentPos, this.start.pos,
          () => {
            if (!this.start.state) this.start.stateChanged = true;
          },
          ()=>{
            if (this.start.state) this.start.stateChanged = true;
          });
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        this.setState({pressed: false});
        var currentPos = this.state.position._value;
        if (!this.start.moved || (Math.abs(currentPos-this.start.pos)<5 && !this.start.stateChanged)) {
          this.toggle();
          return;
        }
        this.onSwipe(currentPos, this.start.pos, this.activate, this.deactivate);
      },
      onPanResponderTerminate: (evt, gestureState) => {
        var currentPos = this.state.position._value;
        this.setState({pressed: false});
        this.onSwipe(currentPos, this.start.pos, this.activate, this.deactivate);
      },
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    });
  }

  onSwipe = (currentPosition, startingPosition, onChange, onTerminate) => {
    if (currentPosition-startingPosition >= 0) {
      if (currentPosition-startingPosition > this.state.width/2 || startingPosition == this.state.width) {
        onChange();
      } else {
        onTerminate();
      }
    } else {
      if (currentPosition-startingPosition < -this.state.width/2) {
        onTerminate();
      } else {
        onChange();
      }
    }
  }

  activateAnimate = () => {
    Animated.timing(
      this.state.position,
      {
        toValue: this.state.width,
        duration: this.props.switchAnimationTime,
      }
    ).start(this.isPropsChangedAfter);
  }

  deactivateAnimate = () => {
    Animated.timing(
      this.state.position,
      {
        toValue: 0,
        duration: this.props.switchAnimationTime,
      }
    ).start(this.isPropsChangedAfter);
  }

  isPropsChangedAfter = () => {
    if (this._timer){
      clearTimeout(this._timer)
    }
    this._timer = setTimeout(() => {
      if (this.props.value && this.state.position._value !== this.state.width){
        this.activateAnimate()
      }
      if (!this.props.value && this.state.position._value !== 0){
        this.deactivateAnimate()
      }
    }, this.props.switchAnimationTime + 50)
  }

  activate = () => {
    this.activateAnimate()
    this.changeState(true);
  }

  deactivate = () => {
    this.deactivateAnimate()
    this.changeState(false);
  }

  changeState = (state) => {
    var callHandlers = this.start.state != state
    setTimeout(() => {
      if (callHandlers) {
        this.props.onValueChange(state)
      }
    }, this.props.switchAnimationTime/2)
  }

  toggle = () => {
    if (!this.props.enableSlide) return;

    if (this.props.value) {
      this.deactivate()
    } else {
      this.activate()
    }
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.value !== this.props.value){
      if(nextProps.value && this.state.position._value !== this.state.width){
        this.activateAnimate()
      }
      if(!nextProps.value && this.state.position._value !== 0){
        this.deactivateAnimate()
      }
    }
  }

  render() {
    const { width, position } = this.state
    const {
      inactiveButtonColor, activeButtonColor, inactiveBackgroundColor, activeBackgroundColor,
      switchHeight, switchWidth, buttonRadius, buttonShadow, buttonContent, padding
    } = this.props

    const doublePadding = padding*2-2;
    const halfPadding = doublePadding/2;

    let buttonColor = position.interpolate({
      inputRange: [0,  width],
      outputRange: [inactiveButtonColor, activeButtonColor]
    })
    let backgrounColor = position.interpolate({
      inputRange: [0,  width],
      outputRange: [inactiveBackgroundColor, activeBackgroundColor]
    })

    return (
      <View
        {...this._panResponder.panHandlers}
        style={{padding: padding, position: 'relative'}}>
        <Animated.View
          style={{
            backgroundColor: backgrounColor,
            height: switchHeight,
            width: switchWidth,
            borderRadius: switchHeight / 2,
          }}/>
        <TouchableHighlight underlayColor='transparent' activeOpacity={1} style={{
          height: Math.max(buttonRadius*2+doublePadding, switchHeight+doublePadding),
          width: switchWidth+doublePadding,
          position: 'absolute',
          top: 1,
          left: 1
        }}>
          <Animated.View style={[{
            backgroundColor: buttonColor,
            height: buttonRadius*2,
            width: buttonRadius*2,
            borderRadius: buttonRadius,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            position: 'absolute',
            top: halfPadding + switchHeight/2 - buttonRadius,
            left: switchHeight/2 > buttonRadius ? halfPadding : halfPadding + switchHeight/2 - buttonRadius,
            transform: [{ translateX: position }],
            elevation: 5
          },
            buttonShadow]}
          >
            {buttonContent}
          </Animated.View>
        </TouchableHighlight>
      </View>
    )
  }
}

