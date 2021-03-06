import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Alert,
  ImageBackground,
  TouchableHighlight,
  Linking,
  Keyboard,
  Platform,
  StatusBar,
} from 'react-native';
import { Button, Icon, Input } from 'react-native-elements';
import i18n from 'i18n-js';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { useDynamicValue, DynamicStyleSheet, useDarkMode } from 'react-native-dynamic';
import Hyperlink from 'react-native-hyperlink';

import { Navigation } from '../thirdparty/react-native-navigation';
import { Dropdown } from '../thirdparty/react-native-material-dropdown';
import { setMainAsRoot } from '../services/navigation';
import { getDynamicColor } from '../config/Colors';
import api from '../api';
import dataStore from '../data_store';
import { isTablet } from '../utils/device';
import app from '../wrapper/app';

import ThemedStatusBar from '../components/ThemedStatusBar';
import LoginBannerIcon from '../components/svg/LoginBannerIcon';

const LoginScreen: () => React$Node = (props) => {
  const styles = useDynamicValue(dynamicStyles);
  const isDarkMode = useDarkMode();

  const [isLogin, setLogin] = useState(true);
  const [isPrivateServer, setUsePrivateServer] = useState(false);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');

  const [isWorking, setWorking] = useState(false);

  const [userIdErrorMessage, setUserIdErrorMessage] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [serverErrorMessage, setServerErrorMessage] = useState('');

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = React.useRef(null);

  function handleSwitchLogin() {
    setLogin(true);
  }

  function handleSwitchSignUp() {
    setLogin(false);
  }

  function handleChangeServerType(value) {
    setUsePrivateServer(value === 'private');
  }

  function handleChangeUserId(value) {
    setUserId(value);
  }

  function handleChangePassword(value) {
    setPassword(value);
  }

  function handleChangeServerUrl(value) {
    setServerUrl(value);
  }

  async function checkInput() {
    if (!userId) {
      setUserIdErrorMessage('Please enter user id');
      return false;
    }
    if (!password) {
      setPasswordErrorMessage('Please enter password');
      return false;
    }
    if (isPrivateServer) {
      if (!serverUrl) {
        setServerErrorMessage('Please enter server address');
        return false;
      }
    }
    return true;
  }

  function handleLoginError(err) {
    if (err.code === 31001) {
      //
      setUserIdErrorMessage(i18n.t('errorInvalidUserId'));
      //
    } else if (err.code === 31002) {
      //
      setPasswordErrorMessage(i18n.t('errorInvalidPassword'));
      //
    } else if (err.code === 31004 || err.code === 31005) {
      //
      setPasswordErrorMessage(i18n.t(`error${err.code}`));
      //
    } else if (err.code === 332) {
      //
      setPasswordErrorMessage(i18n.t('errorMaxTimesForIP'));
      //
    } else if (err.code === 429) {
      //
      setPasswordErrorMessage(i18n.t('errorFrequentOverflow'));
      //
    } else if (err.code === 31000) {
      //
      setUserIdErrorMessage(i18n.t('errorUserExists'));
      //
    } else if (err.code === 322) {
      //
      setUserIdErrorMessage(i18n.t('errorUserIdFormat'));
      //
    } else if (err.externCode === 'WizErrorLicenceCount' || err.externCode === 'WizErrorLicenseCount') {
      //
      setServerErrorMessage(i18n.t('errorLicenseUserLimit'));
      //
    } else if (err.externCode === 'WizErrorLicenceYear') {
      //
      setServerErrorMessage(i18n.t('errorLicenseExpired'));
      //
    } else if (err.externCode === 'WizErrorDisableRegister') {
      //
      setServerErrorMessage(i18n.t('errorDisableRegister'));
      //
    } else if (err.externCode === 'WizErrorUpdateServer') {
      //
      setServerErrorMessage(i18n.t('errorUpdateServer'));
      //
    } else if (err.externCode === 'WizErrorUnknownServerVersion') {
      //
      setServerErrorMessage(i18n.t('errorUnknownServerVersion', {
        message: err.message,
      }));
      //
    } else if (err.code === 'WizErrorNetwork') {
      //
      setUserIdErrorMessage(i18n.t('errorNetwork', {
        message: err.message,
      }));
      //
    } else if (err.isNetworkError && isPrivateServer) {
      //
      setServerErrorMessage(i18n.t(`errorServer`, { message: err.message }));
      //
    } else {
      // eslint-disable-next-line no-lonely-if
      if (isLogin) {
        Alert.alert(err.message);
      } else {
        setPasswordErrorMessage(i18n.t('errorSignUp', { message: err.message }));
      }
    }
    //
  }

  function shouldMergeAccount() {
    return api.isLoggedIn() && api.user.isLocalUser;
  }

  async function handleLogin() {
    if (!checkInput()) {
      return;
    }
    //
    async function doLogin() {
      try {
        setUserIdErrorMessage('');
        setPasswordErrorMessage('');
        setServerErrorMessage('');
        setWorking(true);
        const server = isPrivateServer ? serverUrl : 'as.wiz.cn';
        await api.onlineLogin(server, userId, password, {
          autoLogin: true,
          mergeLocalAccount: shouldMergeAccount(),
        });
        //
        await dataStore.initUser();
        //
        setWorking(false);
        setMainAsRoot();
        //
      } catch (err) {
        setWorking(false);
        handleLoginError(err);
      }
    }
    //
    await doLogin();
  }

  async function handleSignUp() {
    if (!checkInput()) {
      return;
    }

    async function doSignUp() {
      try {
        setUserIdErrorMessage('');
        setPasswordErrorMessage('');
        setServerErrorMessage('');
        setWorking(true);
        const server = isPrivateServer ? serverUrl : 'as.wiz.cn';
        await api.signUp(server, userId, password, {
          autoLogin: true,
          mergeLocalAccount: shouldMergeAccount(),
        });
        //
        await dataStore.initUser();
        //
        setWorking(false);
        setMainAsRoot();
        //
      } catch (err) {
        setWorking(false);
        handleLoginError(err);
      }
    }
    //
    await doSignUp();
  }

  function handleCloseLogin() {
    if (props.closable) {
      Navigation.dismissModal(props.componentId);
    } else {
      setMainAsRoot();
    }
  }

  function handleInputSubmit(event, key) {
    if (isLogin) {
      if ((!isPrivateServer && key === 'password') || (isPrivateServer && key === 'privateServer')) {
        handleLogin();
      }
    } else if ((!isPrivateServer && key === 'password') || (isPrivateServer && key === 'privateServer')) {
      handleSignUp();
    }
  }

  function handleForgotPassword() {
    const version = app.getVersion();
    handlePressLink(`https://api.wiz.cn/?p=wiz&v=${version}&c=forgot_password&plat=ios&debug=false&l=zh-cn&cn=`);
  }

  // eslint-disable-next-line react/prop-types
  function handleRenderDropdownBase({ value }) {
    const key = value === 'private' ? 'serverTypePrivate' : 'serverTypeDefault';
    const titleText = i18n.t(key);
    return (
      <View style={styles.serverDropdownBase}>
        <Text type="clear" style={styles.serverDropdownText}>{titleText}</Text>
        <Icon name="keyboard-arrow-down" color={styles.serverDropdownIcon.color} />
      </View>
    );
  }

  function handleParseLinkText(url) {
    if (url.indexOf('share-termsofuse') !== -1) {
      return i18n.t('textTermsOfUse');
    } else if (url.indexOf('wiz-privacy') !== -1) {
      return i18n.t('textPrivacy');
    }
    return '';
  }

  function handlePressLink(url) {
    Linking.openURL(url);
  }

  useEffect(() => {
    function handleKeyboardWillShow(event) {
      const { endCoordinates } = event;
      const bannerHeight = isTablet() ? 48 : 24;
      setKeyboardHeight(endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current.scrollTo({
          x: 0,
          y: bannerHeight + styles.title.marginTop + styles.shadowBox.marginTop,
          animated: true,
          duration: event.duration,
        });
      }, 0);
    }
    //
    function handleKeyboardWillHide(event) {
      scrollViewRef.current.scrollTo({
        x: 0,
        y: 0,
        animated: true,
        duration: event.duration,
      });
      setTimeout(() => {
        setKeyboardHeight(0);
      }, event.duration);
    }
    //
    Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow);
    Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide);
    return () => {
      Keyboard.removeListener('keyboardWillShow', handleKeyboardWillShow);
      Keyboard.removeListener('keyboardWillHide', handleKeyboardWillHide);
    };
  }, []);

  const serverData = [{
    label: i18n.t('serverTypeDefault'),
    value: 'official',
  }, {
    label: i18n.t('serverTypePrivate'),
    value: 'private',
  }];

  const bannerHeight = isTablet() ? '48' : '24';

  const backgroundSource = isDarkMode
    // eslint-disable-next-line import/no-unresolved
    ? require('../images/background/bg_night.png')
    // eslint-disable-next-line import/no-unresolved
    : require('../images/background/bg.png');

  //
  return (
    <>
      <ThemedStatusBar />
      <ImageBackground
        source={backgroundSource}
        style={styles.image}
      >
        <SafeAreaView>
          <View style={{ display: 'flex', flexDirection: 'row-reverse' }}>
            {!isTablet() && props.closable && (
              <TouchableHighlight style={styles.closeTouchable} onPress={handleCloseLogin}>
                <Icon name="close" color={styles.serverDropdownIcon.color} size={24} />
              </TouchableHighlight>
            )}
          </View>
          <ScrollView
            ref={scrollViewRef}
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainerStyle}
          >
            <View style={[styles.body, keyboardHeight && {
              paddingBottom: keyboardHeight,
            }]}
            >
              <LoginBannerIcon
                fill={styles.title.color}
                height={bannerHeight}
                style={styles.title}
              />
              <View style={styles.shadowBox}>
                <View style={styles.tab}>
                  <Button disabled={isWorking} type="clear" titleStyle={isLogin ? styles.selectedButton : styles.normalButton} title={i18n.t('tabLogin')} onPress={handleSwitchLogin} />
                  <Button disabled={isWorking} type="clear" titleStyle={!isLogin ? styles.selectedButton : styles.normalButton} title={i18n.t('tabRegister')} onPress={handleSwitchSignUp} />
                </View>
                <Dropdown
                  containerStyle={styles.serverDropdown}
                  label="WizNote Server"
                  data={serverData}
                  value={isPrivateServer ? 'private' : 'official'}
                  renderBase={handleRenderDropdownBase}
                  onChangeText={handleChangeServerType}
                  disabled={isWorking}
                  useNativeDriver={false}
                  pickerStyle={styles.picker}
                  itemContainerStyle={styles.dropdownItem}
                  dropdownOffset={{
                    top: 48,
                    left: 48,
                  }}
                />
                <View style={styles.sectionContainer}>
                  <Input
                    containerStyle={styles.inputContainer}
                    inputContainerStyle={styles.input}
                    inputStyle={styles.inputElement}
                    errorStyle={styles.inputErrorStyle}
                    disabled={isWorking}
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    placeholder={i18n.t('placeholderUserId')}
                    errorMessage={userIdErrorMessage}
                    onChangeText={handleChangeUserId}
                  />
                  <Input
                    containerStyle={styles.inputContainer}
                    inputContainerStyle={styles.input}
                    inputStyle={styles.inputElement}
                    errorStyle={styles.inputErrorStyle}
                    disabled={isWorking}
                    textContentType="password"
                    placeholder={i18n.t('placeholderUserPassword')}
                    errorMessage={passwordErrorMessage}
                    secureTextEntry
                    onChangeText={handleChangePassword}
                    onSubmitEditing={(event) => handleInputSubmit(event, 'password')}
                  />
                  {isPrivateServer && (
                    <Input
                      containerStyle={styles.inputContainer}
                      inputContainerStyle={styles.input}
                      inputStyle={styles.inputElement}
                      errorStyle={styles.inputErrorStyle}
                      disabled={isWorking}
                      placeholder={i18n.t('placeholderPrivateServer')}
                      errorMessage={serverErrorMessage}
                      onChangeText={handleChangeServerUrl}
                      onSubmitEditing={(event) => handleInputSubmit(event, 'privateServer')}
                    />
                  )}
                </View>
                <View style={[styles.sectionContainer, styles.buttonBox]}>
                  {isLogin && <Button disabledStyle={styles.button} buttonStyle={styles.button} loading={isWorking} disabled={isWorking} title={i18n.t('buttonLogin')} onPress={handleLogin} />}
                  {!isLogin && <Button disabledStyle={styles.button} buttonStyle={styles.button} loading={isWorking} disabled={isWorking} title={i18n.t('buttonSignUp')} onPress={handleSignUp} />}
                </View>
                <View style={styles.sectionContainer}>
                  {isLogin && <Button titleStyle={styles.forgotButton} type="clear" title={i18n.t('buttonForgotPassword')} onPress={handleForgotPassword} />}
                </View>
              </View>
              <Hyperlink
                linkStyle={styles.link}
                linkText={handleParseLinkText}
                onPress={handlePressLink}
              >
                <Text style={styles.declare}>{i18n.t('registerDeclare')}</Text>
              </Hyperlink>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
};

LoginScreen.options = {
  statusBar: {
    translucent: false,
    drawBehind: true,
    backgroundColor: 'transparent',
  },
  topBar: {
    visible: false,
  },
};

const dynamicStyles = new DynamicStyleSheet({
  image: {
    flex: 1,
    width: null,
    height: null,
  },
  scrollView: {
    minHeight: '100%',
  },
  contentContainerStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  body: {
    width: isTablet() ? 400 : '100%',
    paddingHorizontal: 12,
    minHeight: '100%',
  },
  title: {
    marginTop: 35,
    color: getDynamicColor('loginBannerColor'),
  },
  closeTouchable: {
    padding: 8,
    marginRight: 8,
    marginTop: Platform.select({
      default: 0,
      android: StatusBar.currentHeight,
    }),
  },
  shadowBox: {
    marginTop: 40,
    // marginHorizontal: 12,
    paddingBottom: 55,
    borderRadius: 20,
    backgroundColor: getDynamicColor('loginBoxBackground'),
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 4,
    shadowOpacity: 1,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 32,
  },
  buttonBox: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  tab: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  normalButton: {
    color: getDynamicColor('loginBoxText'),
    fontSize: 16,
  },
  inputContainer: {
    minWidth: 288,
    paddingHorizontal: 0,
  },
  inputErrorStyle: {
    maxHeight: 16,
  },
  input: {
    backgroundColor: getDynamicColor('loginBoxInputBackground'),
    borderBottomWidth: 0,
    borderRadius: 2,
    paddingHorizontal: 9,
  },
  inputElement: {
    color: getDynamicColor('loginBoxText'),
  },
  selectedButton: {
    fontSize: 24,
    fontWeight: '600',
    color: getDynamicColor('loginBoxText'),
  },
  picker: {
    backgroundColor: getDynamicColor('dropdownPickerBackground'),
    borderRadius: 4,
    maxWidth: 240,
  },
  serverDropdown: {
    // minWidth: 200,
    // flexGrow: 1,
    paddingHorizontal: 32,
    marginTop: 32,
  },
  dropdownItem: {
    paddingLeft: 24,
  },
  serverDropdownIcon: {
    color: getDynamicColor('loginBoxText'),
  },
  serverDropdownBase: {
    paddingTop: 4,
    display: 'flex',
    flexDirection: 'row',
  },
  serverDropdownText: {
    fontSize: 18,
    color: getDynamicColor('loginBoxText'),
  },
  declare: {
    marginTop: 80,
    fontSize: 12,
    lineHeight: 22,
    color: getDynamicColor('loginBoxText2'),
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: getDynamicColor('loginBoxButtonBackground'),
    color: '#ffffff',
  },
  forgotButton: {
    color: getDynamicColor('loginBoxText2'),
  },
  link: {
    color: '#2980b9',
  },
});

export default LoginScreen;
