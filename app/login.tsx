import { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Text,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Colores modernos inspirados en el logo
const COLORS = {
    yellowPrimary: '#FFDE00',
    yellowLight: '#FFF176',
    redPrimary: '#E53935',
    redDark: '#C62828',
    greenPrimary: '#43A047',
    greenLight: '#66BB6A',
    black: '#212121',
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    grayText: '#757575',
};

export default function LoginScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (username === 'juanpablo' && password === '123456') {
            router.replace('./pages/versus');
        } else {
            Alert.alert('Error de acceso', 'Usuario o contraseña incorrectos');
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <LinearGradient 
                    colors={[COLORS.yellowPrimary, COLORS.redPrimary]} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 0, y: 1 }} 
                    style={styles.gradientContainer}
                />
                
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                        <View style={styles.header}>
                            <Image
                                source={require('../assets/images/logo.png')} // Asegúrate de tener el logo en esta ruta
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
                            style={styles.formWrapper}
                        >
                            <View style={styles.formContainer}>
                                <Text style={styles.welcomeText}>¡Bienvenido!</Text>
                                <Text style={styles.subText}>Inicia sesión para continuar</Text>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>Usuario</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ingresa tu usuario"
                                            placeholderTextColor={COLORS.grayText}
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>Contraseña</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ingresa tu contraseña"
                                            placeholderTextColor={COLORS.grayText}
                                            secureTextEntry
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleLogin}
                                    style={styles.buttonContainer}
                                >
                                    <LinearGradient
                                        colors={[COLORS.greenPrimary, COLORS.greenLight]}
                                        style={styles.loginButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.loginButtonText}>INGRESAR</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </ScrollView>
                </TouchableWithoutFeedback>

                <View style={styles.footer}>
                    <View style={styles.footerLine}>
                        <View style={[styles.footerLineItem, { backgroundColor: COLORS.yellowPrimary }]} />
                        <View style={[styles.footerLineItem, { backgroundColor: COLORS.greenPrimary }]} />
                        <View style={[styles.footerLineItem, { backgroundColor: COLORS.redPrimary }]} />
                    </View>
                    <Text style={styles.footerText}>Torneo Microfútbol • Cantal Musical</Text>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 30,
    },
    logo: {
        width: 180,
        height: 180,
    },
    formWrapper: {
        flex: 1,
        paddingHorizontal: 20,
    },
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        paddingTop: 0,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    welcomeText: {
        paddingTop: 10,
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 4,
    },
    subText: {
        fontSize: 16,
        color: COLORS.grayText,
        marginBottom: 30,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        color: COLORS.black,
        fontWeight: '500',
    },
    inputContainer: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        overflow: 'hidden',
    },
    input: {
        width: '100%',
        padding: 16,
        fontSize: 16,
        color: COLORS.black,
    },
    buttonContainer: {
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: COLORS.greenPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    loginButton: {
        padding: 16,
        alignItems: 'center',
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerLine: {
        flexDirection: 'row',
        marginBottom: 16,
        width: '80%',
        height: 4,
    },
    footerLineItem: {
        flex: 1,
        height: '100%',
    },
    footerText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
    }
});